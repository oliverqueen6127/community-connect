import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { searchDirectory } from '@/lib/directory-search';
import { Listing, Business, Event, Housing, Job, SearchFilters } from '@/lib/types';

export const runtime = 'nodejs';

// ── SSE helpers ────────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseChunk(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function makeStream(fn: (ctrl: ReadableStreamDefaultController) => Promise<void>): Response {
  return new Response(new ReadableStream({ start: fn }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── Server-side Supabase (service key bypasses RLS) ───────────────────────────

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ── Intent interface ───────────────────────────────────────────────────────────

interface AIIntent {
  type: 'business' | 'event' | 'housing' | 'job' | null;
  category: string | null;
  city: string | null;
  state: string | null;
  keywords: string[];
  remote: boolean | null;
  jobType: string | null;
  listingType: 'rent' | 'sale' | null;
  bedrooms: number | null;
  priceMax: number | null;
  isFree: boolean | null;
  rating: number | null;
}

// ── Step 1a: OpenAI intent extraction ─────────────────────────────────────────

async function extractIntentAI(
  openai: OpenAI,
  message: string,
  history: { role: string; content: string }[],
  defaultCity: string,
  defaultState: string,
): Promise<AIIntent> {
  const systemPrompt = `You extract search intent for a Muslim American community directory. Return ONLY valid JSON, no markdown.

JSON shape (all fields required, use null if not applicable):
{
  "type": "business"|"event"|"housing"|"job"|null,
  "category": string|null,
  "city": string|null,
  "state": string|null,
  "keywords": string[],
  "remote": boolean|null,
  "jobType": "full-time"|"part-time"|"contract"|"freelance"|"internship"|null,
  "listingType": "rent"|"sale"|null,
  "bedrooms": number|null,
  "priceMax": number|null,
  "isFree": boolean|null,
  "rating": number|null
}

Rules:
- type: "business" for restaurants/mosques/grocery/healthcare/schools/cafes/retail; "event" for events/festivals/workshops; "housing" for apartments/homes/rentals/condos; "job" for jobs/careers/hiring
- category for businesses: restaurant, mosque, grocery, healthcare, school, retail, services, entertainment
- city: if user names a specific city, use it exactly; otherwise use default "${defaultCity || 'unknown'}"
- state: use default "${defaultState || 'unknown'}" unless user names another state
- keywords: up to 4 relevant search terms (e.g. ["halal", "delivery"], ["2 bedroom", "pet friendly"])`;

  try {
    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: msgs,
      temperature: 0,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as AIIntent;
    // Ensure keywords is always an array
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];
    return parsed;
  } catch (err) {
    console.error('[AI Search] Intent extraction failed:', err);
    return {
      type: null, category: null,
      city: defaultCity || null, state: defaultState || null,
      keywords: [], remote: null, jobType: null, listingType: null,
      bedrooms: null, priceMax: null, isFree: null, rating: null,
    };
  }
}

// ── Step 1b: Regex fallback (no API key) ──────────────────────────────────────

function extractIntentFallback(message: string, defaultCity: string, defaultState: string): AIIntent {
  const lower = message.toLowerCase();
  let type: AIIntent['type'] = null;
  let category: string | null = null;
  const keywords: string[] = [];

  const JOB_OCCUPATIONS = [
    'warehouse', 'driver', 'delivery', 'forklift', 'mechanic', 'engineer',
    'developer', 'programmer', 'nurse', 'teacher', 'manager', 'accountant',
    'chef', 'cook', 'security', 'cleaning', 'maintenance', 'technician',
    'designer', 'salesperson', 'cashier', 'intern',
  ];
  const matchedOccupations = JOB_OCCUPATIONS.filter((o) => lower.includes(o));
  const hasJobWord =
    lower.includes('job') || lower.includes('career') || lower.includes('hiring') ||
    lower.includes('employ') || lower.includes('internship') || lower.includes('salary') ||
    lower.includes('resume') || /\bwork\b/.test(lower) || matchedOccupations.length > 0;

  if (hasJobWord) {
    type = 'job';
    if (matchedOccupations.length) keywords.push(...matchedOccupations.slice(0, 3));
  } else if (lower.includes('mosque') || lower.includes('masjid') || lower.includes('prayer') || lower.includes('jummah')) {
    type = 'business'; category = 'mosque';
  } else if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('butcher') || lower.includes('market')) {
    type = 'business'; category = 'grocery';
  } else if (
    lower.includes('restaurant') || lower.includes('food') || lower.includes('eat') ||
    lower.includes('cafe') || lower.includes('bakery') || lower.includes('halal') || lower.includes('dining')
  ) {
    type = 'business'; category = 'restaurant';
    if (lower.includes('halal')) keywords.push('halal');
  } else if (lower.includes('clinic') || lower.includes('health') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('dentist')) {
    type = 'business'; category = 'healthcare';
  } else if (lower.includes('school') || lower.includes('academy') || lower.includes('education') || lower.includes('university') || lower.includes('college')) {
    type = 'business'; category = 'school';
  } else if (
    lower.includes('apartment') || /\bhouse\b/.test(lower) || /\bhome\b/.test(lower) ||
    lower.includes('rent') || lower.includes('housing') || lower.includes('condo') ||
    lower.includes('bedroom') || lower.includes('townhouse') || lower.includes('studio')
  ) {
    type = 'housing';
  } else if (
    lower.includes('event') || lower.includes('festival') || lower.includes('gathering') ||
    lower.includes('workshop') || lower.includes('concert') || lower.includes('weekend')
  ) {
    type = 'event';
  }

  const knownCities = [
    'new york', 'chicago', 'philadelphia', 'houston', 'dallas', 'los angeles',
    'atlanta', 'seattle', 'boston', 'miami', 'phoenix', 'denver', 'detroit',
    'nashville', 'san francisco',
  ];
  let city = defaultCity || null;
  for (const c of knownCities) {
    if (lower.includes(c)) {
      city = c.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  const priceMatch = lower.match(/under\s*\$?(\d[\d,]*)/);
  const bedroomMatch = lower.match(/(\d)\s*(?:bed|bedroom|br)\b/);
  const ratingMatch = lower.match(/(\d(?:\.\d)?)\s*star/);

  return {
    type,
    category,
    city,
    state: defaultState || null,
    keywords,
    remote: lower.includes('remote') ? true : null,
    jobType: lower.includes('part-time') || lower.includes('part time') ? 'part-time'
      : lower.includes('full-time') || lower.includes('full time') ? 'full-time'
      : lower.includes('contract') ? 'contract'
      : lower.includes('internship') ? 'internship'
      : null,
    listingType: lower.includes('buy') || lower.includes('for sale') ? 'sale'
      : type === 'housing' ? 'rent'
      : null,
    bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : null,
    priceMax: priceMatch ? parseInt(priceMatch[1].replace(',', '')) : null,
    isFree: lower.includes('free') && type === 'event' ? true : null,
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
  };
}

// ── Step 2: Query Supabase ────────────────────────────────────────────────────

const TABLE_MAP: Record<string, string> = {
  business: 'businesses',
  event: 'events',
  housing: 'housing',
  job: 'jobs',
};

function rowToListing(row: Record<string, unknown>, type: string): Listing {
  const id = row.id as string;

  if (type === 'business') {
    return {
      id, type: 'business',
      name: (row.name as string) || '',
      category: (row.category as Business['category']) || 'other',
      description: (row.description as string) || '',
      address: (row.address as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      zip: (row.zip as string) || '',
      phone: (row.phone as string) || '',
      website: (row.website as string) || undefined,
      rating: (row.rating as number) || 0,
      reviewCount: (row.review_count as number) || 0,
      isOpen: Boolean(row.is_open),
      hours: (row.hours as string) || '',
      image: (row.image_url as string) || '',
      tags: (row.tags as string[]) || [],
      priceLevel: ((row.price_level as number) || 2) as 1 | 2 | 3 | 4,
    };
  }

  if (type === 'event') {
    return {
      id, type: 'event',
      title: (row.title as string) || '',
      description: (row.description as string) || '',
      category: (row.category as string) || 'community',
      date: (row.date as string) || '',
      time: (row.time as string) || '',
      endTime: (row.end_time as string) || undefined,
      location: (row.location as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      organizer: (row.organizer as string) || '',
      attendees: (row.attendees as number) || 0,
      maxAttendees: (row.max_attendees as number) || undefined,
      price: (row.price as number) || 0,
      isFree: Boolean(row.is_free),
      image: (row.image_url as string) || '',
      tags: (row.tags as string[]) || [],
      rsvpLink: (row.rsvp_link as string) || undefined,
    };
  }

  if (type === 'housing') {
    return {
      id, type: 'housing',
      title: (row.title as string) || '',
      description: (row.description as string) || '',
      address: (row.address as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      zip: (row.zip as string) || '',
      price: (row.price as number) || 0,
      bedrooms: (row.bedrooms as number) || 1,
      bathrooms: (row.bathrooms as number) || 1,
      sqft: (row.sqft as number) || 0,
      propertyType: (row.property_type as Housing['propertyType']) || 'apartment',
      listingType: (row.listing_type as Housing['listingType']) || 'rent',
      images: (row.images as string[]) || [],
      amenities: (row.amenities as string[]) || [],
      contactName: (row.contact_name as string) || '',
      contactPhone: (row.contact_phone as string) || '',
      contactEmail: (row.contact_email as string) || '',
      postedDate: new Date((row.created_at as string) || Date.now()).toISOString().split('T')[0],
      available: Boolean(row.available),
      petFriendly: Boolean(row.pet_friendly),
      parking: Boolean(row.parking),
    };
  }

  return {
    id, type: 'job',
    title: (row.title as string) || '',
    company: (row.company as string) || '',
    description: (row.description as string) || '',
    category: (row.category as string) || 'general',
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    salary: (row.salary as string) || '',
    jobType: (row.job_type as Job['jobType']) || 'full-time',
    remote: Boolean(row.remote),
    experience: (row.experience as string) || '',
    requirements: (row.requirements as string[]) || [],
    benefits: (row.benefits as string[]) || [],
    contactEmail: (row.contact_email as string) || '',
    postedDate: new Date((row.created_at as string) || Date.now()).toISOString().split('T')[0],
    deadline: (row.deadline as string) || undefined,
    logo: (row.logo_url as string) || undefined,
  };
}

async function querySupabaseListings(supabase: SupabaseClient, intent: AIIntent): Promise<Listing[]> {
  const types = intent.type ? [intent.type] : ['business', 'event', 'housing', 'job'];
  const rows: Listing[] = [];

  await Promise.all(
    types.map(async (type) => {
      const table = TABLE_MAP[type];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from(table).select('*').eq('status', 'active');

      if (intent.city) q = q.ilike('city', `%${intent.city}%`);
      if (intent.state) q = q.ilike('state', `%${intent.state}%`);

      if (type === 'business') {
        if (intent.category) q = q.ilike('category', `%${intent.category}%`);
        if (intent.rating) q = q.gte('rating', intent.rating);
      }
      if (type === 'event' && intent.isFree !== null) {
        q = q.eq('is_free', intent.isFree);
      }
      if (type === 'housing') {
        if (intent.listingType) q = q.eq('listing_type', intent.listingType);
        if (intent.bedrooms) q = q.gte('bedrooms', intent.bedrooms);
        if (intent.priceMax) q = q.lte('price', intent.priceMax);
      }
      if (type === 'job') {
        if (intent.remote !== null) q = q.eq('remote', intent.remote);
        if (intent.jobType) q = q.eq('job_type', intent.jobType);
      }

      const { data, error } = await q.order('created_at', { ascending: false }).limit(20);
      if (error) {
        console.error(`[AI Search] Supabase ${table} error:`, error.message);
        return;
      }
      for (const row of (data ?? [])) {
        rows.push(rowToListing(row as Record<string, unknown>, type));
      }
    }),
  );

  return rows;
}

// ── Step 3: Build compact result summary for OpenAI ───────────────────────────

function buildResultsSummary(results: Listing[]): string {
  if (results.length === 0) return 'No listings found matching the search criteria.';
  return results.slice(0, 10).map((item) => {
    if (item.type === 'business') {
      const b = item as Business;
      return `[BUSINESS] ${b.name} | ${b.category} | ${b.city}, ${b.state} | Rating: ${b.rating}/5 | ${b.isOpen ? 'Open now' : 'Closed'}`;
    }
    if (item.type === 'event') {
      const e = item as Event;
      return `[EVENT] ${e.title} | ${e.date} ${e.time} | ${e.city}, ${e.state} | ${e.isFree ? 'Free' : `$${e.price}`}`;
    }
    if (item.type === 'housing') {
      const h = item as Housing;
      return `[HOUSING] ${h.title} | ${h.listingType === 'rent' ? `$${h.price}/mo` : `$${h.price}`} | ${h.bedrooms}bd ${h.bathrooms}ba | ${h.city}, ${h.state}`;
    }
    const j = item as Job;
    return `[JOB] ${j.title} at ${j.company} | ${j.jobType} | ${j.remote ? 'Remote' : `${j.city}, ${j.state}`} | ${j.salary}`;
  }).join('\n');
}

// ── Mock response generator ────────────────────────────────────────────────────

function generateMockResponse(intent: AIIntent, count: number): string {
  const city = intent.city ? ` in ${intent.city}` : '';
  if (count === 0) return `I couldn't find any listings${city} matching your search. Try a different city or broaden your search terms!`;
  const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? 's' : ''}`;
  if (intent.type === 'business') return `I found ${plural(count, intent.category || 'business')}${city}! Check out these community-verified listings below.`;
  if (intent.type === 'event') return `I found ${plural(count, 'upcoming event')}${city}! Great community gatherings to explore.`;
  if (intent.type === 'housing') return `I found ${plural(count, 'housing listing')}${city}! Here are the available ${intent.listingType === 'sale' ? 'properties for sale' : 'rentals'}.`;
  if (intent.type === 'job') return `I found ${plural(count, 'job opportunity')}${city}! Here are the positions that match your search.`;
  return `I found ${plural(count, 'listing')}${city} across our community directory!`;
}

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      message: string;
      history?: { role: string; content: string }[];
      location?: { city: string; state: string };
    };

    const { message, history = [], location } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const safeMessage = message.slice(0, 2000);
    const activeCity = location?.city ?? '';
    const activeState = location?.state ?? '';
    const apiKey = process.env.OPENAI_API_KEY;
    const supabase = getSupabase();

    // ── Step 1: Extract intent ────────────────────────────────────────────────
    let intent: AIIntent;
    if (apiKey) {
      const openai = new OpenAI({ apiKey });
      intent = await extractIntentAI(openai, safeMessage, history, activeCity, activeState);
    } else {
      intent = extractIntentFallback(safeMessage, activeCity, activeState);
    }
    console.log('AI INTENT', JSON.stringify(intent));

    // ── Step 2: Query static data + Supabase ─────────────────────────────────
    const filters: SearchFilters = {
      type: intent.type ?? undefined,
      city: intent.city ?? undefined,
      state: intent.state ?? undefined,
      category: intent.category ?? undefined,
      remote: intent.remote ?? undefined,
      jobType: intent.jobType ?? undefined,
      listingType: intent.listingType ?? undefined,
      bedrooms: intent.bedrooms ?? undefined,
      priceMax: intent.priceMax ?? undefined,
      isFree: intent.isFree ?? undefined,
      rating: intent.rating ?? undefined,
      keywords: intent.keywords.length > 0 ? intent.keywords : undefined,
    };
    console.log('AI FILTERS', JSON.stringify(filters));

    // Static data search (already applies all filters including keywords)
    const staticResults = searchDirectory(filters);

    // Supabase search (structural filters; keyword filter applied in-memory below)
    let supabaseResults: Listing[] = [];
    if (supabase) {
      supabaseResults = await querySupabaseListings(supabase, intent);
    }

    // Keyword filter Supabase results in-memory
    let filteredSupabase = supabaseResults;
    if (intent.keywords.length > 0) {
      const kw = supabaseResults.filter((item) => {
        const str = JSON.stringify(item).toLowerCase();
        return intent.keywords.some((k) => str.includes(k.toLowerCase()));
      });
      if (kw.length > 0) filteredSupabase = kw;
    }

    // Merge: Supabase first (user-submitted, newer), then static — dedup by id
    const seenIds = new Set<string>();
    const allResults: Listing[] = [];
    for (const item of [...filteredSupabase, ...staticResults]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allResults.push(item);
      }
    }

    const topResults = allResults.slice(0, 8);
    const totalFound = allResults.length;

    console.log('SUPABASE RESULTS', JSON.stringify({
      supabaseCount: supabaseResults.length,
      staticCount: staticResults.length,
      totalFound,
    }));

    // ── No API key: mock streaming ────────────────────────────────────────────
    if (!apiKey) {
      const mockText = generateMockResponse(intent, totalFound);
      return makeStream(async (ctrl) => {
        const words = mockText.split(' ');
        for (let i = 0; i < words.length; i++) {
          ctrl.enqueue(sseChunk({ type: 'text', delta: (i > 0 ? ' ' : '') + words[i] }));
          await new Promise((r) => setTimeout(r, 30));
        }
        ctrl.enqueue(sseChunk({ type: 'done', intent, filters, results: topResults, totalFound }));
        ctrl.close();
      });
    }

    // ── Step 3: OpenAI streaming answer from real results ─────────────────────
    const openai = new OpenAI({ apiKey });
    const resultsSummary = buildResultsSummary(topResults);

    const systemPrompt = `You are Community Connect AI — a warm, knowledgeable assistant for Muslim Americans and diverse communities.

ACTUAL SEARCH RESULTS (${topResults.length} shown of ${totalFound} found):
${resultsSummary}

ACTIVE USER LOCATION: ${activeCity || 'unknown'}, ${activeState || 'unknown'}

RESPONSE RULES:
1. 2–3 sentences maximum, warm and direct
2. State how many results were found and for which city
3. Cards appear automatically below — do NOT list them in your text
4. If zero results: acknowledge warmly, suggest nearby city or different search term
5. NEVER invent listings not in the search results above
6. Stay on topic — if user asked for jobs, talk about jobs only`;

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: safeMessage },
    ];

    return makeStream(async (ctrl) => {
      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.6,
          max_tokens: 180,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) ctrl.enqueue(sseChunk({ type: 'text', delta }));
        }

        ctrl.enqueue(sseChunk({ type: 'done', intent, filters, results: topResults, totalFound }));
        ctrl.close();
      } catch (err) {
        console.error('[AI Search] OpenAI stream error:', err);
        const fallback = generateMockResponse(intent, totalFound);
        ctrl.enqueue(sseChunk({ type: 'text', delta: fallback }));
        ctrl.enqueue(sseChunk({ type: 'done', intent, filters, results: topResults, totalFound }));
        ctrl.close();
      }
    });

  } catch (error) {
    console.error('[AI Search] handler error:', error);
    return makeStream(async (ctrl) => {
      ctrl.enqueue(sseChunk({
        type: 'error',
        message: "I'm here to help! Try asking about halal restaurants, mosques, apartments, jobs, or upcoming events.",
      }));
      ctrl.close();
    });
  }
}
