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
  priceMin: number | null;
  isFree: boolean | null;
  rating: number | null;
}

// ── Restaurant category expansion ─────────────────────────────────────────────
// ListingCategory has 'halal' and 'restaurant' as separate values — many halal
// food businesses are categorised as 'halal', not 'restaurant'. When the user
// searches for restaurants we must accept both, plus food-tagged businesses.

const RESTAURANT_EQUIVALENT_CATEGORIES = new Set(['restaurant', 'halal', 'entertainment']);
const FOOD_TAGS = ['restaurant', 'food', 'halal', 'dining', 'cafe', 'bakery', 'takeout', 'dine-in', 'grill'];

// ── Keyword classification ────────────────────────────────────────────────────
// Specific business keywords: product/service names where if no listing matches,
// we return empty rather than unrelated results. Jobs always use strict matching.

const SPECIFIC_BUSINESS_KEYWORDS = new Set([
  // Coffee & drinks
  'coffee', 'cafe', 'café', 'espresso', 'latte', 'cappuccino', 'mocha', 'americano',
  'boba', 'bubble tea', 'smoothie', 'juice bar', 'tea house',
  // Specific cuisines/food types
  'sushi', 'pizza', 'burger', 'taco', 'ramen', 'pho', 'kebab', 'dim sum',
  'bbq', 'barbecue', 'donut', 'doughnut', 'bagel', 'crepe', 'waffle',
  'ice cream', 'gelato', 'dessert', 'bakery cake',
  // Fitness & wellness
  'gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'boxing', 'martial arts',
  // Beauty & personal care
  'barber', 'barbershop', 'salon', 'spa', 'nail', 'beauty supply', 'hair',
  // Health services
  'pharmacy', 'drugstore', 'optician', 'eye care',
  // Entertainment & recreation
  'hookah', 'shisha', 'bowling', 'billiard', 'arcade', 'gaming',
  // Child care
  'daycare', 'preschool', 'kindergarten', 'nursery', 'childcare',
  // Specific retail
  'bookstore', 'book store', 'library', 'florist', 'flower shop',
  // Services
  'laundromat', 'dry cleaning', 'cleaners', 'car wash', 'auto repair',
  'locksmith', 'tailor', 'alterations',
]);

// Job occupation keywords — strict: if you search "warehouse job", return only warehouse jobs
const JOB_OCCUPATION_KEYWORDS = new Set([
  'warehouse', 'driver', 'delivery', 'forklift', 'mechanic', 'engineer',
  'developer', 'programmer', 'software', 'nurse', 'teacher', 'manager',
  'accountant', 'chef', 'cook', 'security', 'cleaning', 'maintenance',
  'technician', 'designer', 'salesperson', 'cashier', 'receptionist',
  'data', 'marketing', 'hr', 'finance', 'legal', 'analyst', 'coordinator',
]);

function isStrictSearch(intent: AIIntent): boolean {
  if (intent.keywords.length === 0) return false;
  // Job occupation keywords are always strict
  if (intent.type === 'job') {
    return intent.keywords.some((kw) => JOB_OCCUPATION_KEYWORDS.has(kw.toLowerCase()));
  }
  // Specific business product/service keywords are strict
  if (intent.type === 'business' || intent.type === null) {
    return intent.keywords.some((kw) =>
      Array.from(SPECIFIC_BUSINESS_KEYWORDS).some((sk) => kw.toLowerCase().includes(sk))
    );
  }
  return false;
}

// ── Scoring ────────────────────────────────────────────────────────────────────
// title/name match = 10, category/tags = 7, description = 3, city alone = 0

function getItemTitle(item: Listing): string {
  if (item.type === 'business') return (item as Business).name;
  if (item.type === 'event') return (item as Event).title;
  if (item.type === 'housing') return (item as Housing).title;
  if (item.type === 'job') return (item as Job).title;
  return '';
}

function scoreResult(item: Listing, keywords: string[]): number {
  if (keywords.length === 0) return 1; // no keywords = include everything
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    const title = getItemTitle(item).toLowerCase();
    if (title.includes(k)) { score += 10; continue; }

    const category = ('category' in item ? (item as { category: string }).category : '').toLowerCase();
    if (category.includes(k)) { score += 7; continue; }

    const tags: string[] = ('tags' in item ? (item as { tags: string[] }).tags : []) || [];
    if (tags.some((t) => t.toLowerCase().includes(k))) { score += 7; continue; }

    const desc = ('description' in item ? (item as { description: string }).description : '').toLowerCase();
    if (desc.includes(k)) { score += 3; }
  }
  return score;
}

// ── Keyword filter (separate step, runs after merge) ─────────────────────────

function applyKeywordFilter(
  results: Listing[],
  intent: AIIntent,
): Listing[] {
  if (intent.keywords.length === 0) return results;

  const scored = results.map((item) => ({ item, score: scoreResult(item, intent.keywords) }));

  console.log('SCORED RESULTS', JSON.stringify(scored.map((s) => ({
    title: getItemTitle(s.item),
    type: s.item.type,
    score: s.score,
  }))));

  if (isStrictSearch(intent)) {
    // Strict: specific products (coffee, pizza, gym, warehouse...) — only matching results.
    // If nothing matches, return empty — "no coffee found" is the correct answer.
    const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.item);
    const rejected = scored.filter((s) => s.score === 0).map((s) => s.item);

    console.log('REJECTED RESULTS', JSON.stringify(rejected.map((r) => ({
      title: getItemTitle(r), type: r.type,
    }))));

    return matched;
  }

  // Non-strict: generic searches (restaurant, halal food, events this weekend...).
  // Sort by keyword relevance for ranking, but KEEP ALL results.
  // applyStrictFilters handles the actual narrowing via category/type filters.
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

// ── Price parsing ──────────────────────────────────────────────────────────────

function extractPriceMax(lower: string): number | null {
  const patterns = [
    /(?:less\s+than|under|below|cheaper\s+than|at\s+most|up\s+to|no\s+more\s+than|not\s+more\s+than)\s*\$?\s*([\d,]+)/,
    /(?:max(?:imum)?|budget)\s+(?:of\s+)?\$?\s*([\d,]+)/,
    /\$?\s*([\d,]+)\s+(?:or\s+less|and\s+under|and\s+below)/,
    /within\s+\$?\s*([\d,]+)/,
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  return null;
}

function extractPriceMin(lower: string): number | null {
  const patterns = [
    /(?:more\s+than|over|above|at\s+least|minimum|min)\s*\$?\s*([\d,]+)/,
    /\$?\s*([\d,]+)\s+(?:or\s+more|and\s+above|and\s+over|and\s+up)/,
    /paying\s+(?:over|at\s+least|more\s+than)\s+\$?\s*([\d,]+)/,
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  return null;
}

function normalizePrice(price: string | number | undefined | null): number {
  if (price === undefined || price === null) return 0;
  if (typeof price === 'number') return price;
  const cleaned = price.toString()
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\/mo(?:nth)?/gi, '')
    .replace(/\/yr(?:ear)?/gi, '')
    .replace(/\/year/gi, '')
    .trim()
    .split(/[\s–-]/)[0];
  return parseFloat(cleaned) || 0;
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

JSON shape (all fields required, use null when not applicable):
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
  "priceMin": number|null,
  "isFree": boolean|null,
  "rating": number|null
}

Rules:
- type: "business" = restaurants/mosques/grocery/healthcare/schools/cafes/coffee shops/retail; "event" = events/festivals/workshops; "housing" = apartments/homes/rentals/condos/studio; "job" = jobs/careers/hiring
- category for businesses (only these values): restaurant, mosque, grocery, healthcare, school, retail, services, entertainment
  * CRITICAL: Do NOT use "restaurant" for coffee/cafe searches. Coffee shops are NOT restaurants.
  * CRITICAL: For coffee, cafe, espresso, latte, yoga, gym, barber, salon, pharmacy → set category=null and put the specific term in keywords instead
  * Use category only for broad searches: "restaurant" → halal food, "mosque" → Islamic centers
- keywords: up to 4 terms. Rules for keywords:
  * DO add specific product/service names: coffee, pizza, gym, barber, yoga, sushi, etc.
  * DO add ingredient/quality modifiers: halal, organic, vegan, etc.
  * DO NOT add broad category names that are already in "category": do not add "restaurant", "mosque", "grocery", "job", "housing", "food", "eat" as keywords
  * DO NOT add the city name as a keyword
- city: extract if user names one, otherwise use default "${defaultCity || 'unknown'}"
- state: use default "${defaultState || 'unknown'}" unless user names another
- priceMax: extract from "less than X", "under X", "below X", "max X", "budget X", "no more than X", "cheaper than X", "up to X", "at most X", "X or less" — set to NUMBER X only
- priceMin: extract from "more than X", "over X", "above X", "at least X", "minimum X", "paying over X" — set to NUMBER X

Examples:
- "I am looking for restaurant" → type="business", category="restaurant", keywords=[]
- "coffee in New York" → type="business", category=null, keywords=["coffee","cafe"]
- "halal restaurant" → type="business", category="restaurant", keywords=["halal"]
- "mosque near me" → type="business", category="mosque", keywords=[]
- "warehouse job" → type="job", keywords=["warehouse"]
- "rent under 2500" → type="housing", listingType="rent", priceMax=2500, keywords=[]
- "places to eat" → type="business", category="restaurant", keywords=[]`;

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
      max_tokens: 350,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as AIIntent;
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];
    return parsed;
  } catch (err) {
    console.error('[AI Search] Intent extraction failed:', err);
    return {
      type: null, category: null,
      city: defaultCity || null, state: defaultState || null,
      keywords: [], remote: null, jobType: null, listingType: null,
      bedrooms: null, priceMax: null, priceMin: null, isFree: null, rating: null,
    };
  }
}

// ── Step 1b: Regex fallback (no API key) ──────────────────────────────────────

const COFFEE_WORDS = ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'americano'];
const CAFE_WORDS = ['cafe', 'café', 'coffeehouse', 'coffee shop'];

function extractIntentFallback(message: string, defaultCity: string, defaultState: string): AIIntent {
  const lower = message.toLowerCase();
  let type: AIIntent['type'] = null;
  let category: string | null = null;
  const keywords: string[] = [];

  const JOB_OCCUPATIONS = [
    'warehouse', 'driver', 'delivery', 'forklift', 'mechanic', 'engineer',
    'developer', 'programmer', 'nurse', 'teacher', 'manager', 'accountant',
    'chef', 'cook', 'security', 'cleaning', 'maintenance', 'technician',
    'designer', 'salesperson', 'cashier', 'intern', 'software', 'data',
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
  } else if (COFFEE_WORDS.some((w) => lower.includes(w))) {
    // Coffee/espresso: specific product search — no category, strict keyword matching
    type = 'business'; category = null;
    const matched = COFFEE_WORDS.filter((w) => lower.includes(w));
    keywords.push(...matched.slice(0, 2), 'cafe');
  } else if (CAFE_WORDS.some((w) => lower.includes(w))) {
    // Cafe: specific product search
    type = 'business'; category = null;
    keywords.push('cafe', 'coffee');
  } else if (lower.includes('gym') || lower.includes('fitness') || lower.includes('yoga') || lower.includes('pilates')) {
    type = 'business'; category = null;
    const matched = ['gym', 'fitness', 'yoga', 'pilates'].filter((w) => lower.includes(w));
    keywords.push(...matched);
  } else if (lower.includes('barber') || lower.includes('salon') || lower.includes('spa')) {
    type = 'business'; category = null;
    const matched = ['barber', 'salon', 'spa'].filter((w) => lower.includes(w));
    keywords.push(...matched);
  } else if (
    lower.includes('restaurant') || lower.includes('food') || lower.includes('eat') ||
    lower.includes('bakery') || lower.includes('halal') || lower.includes('dining')
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
    priceMax: extractPriceMax(lower),
    priceMin: extractPriceMin(lower),
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
        // Skip category filter for restaurant — 'halal' businesses won't match '%restaurant%'.
        // applyStrictFilters handles the expansion in memory.
        if (intent.category && intent.category !== 'restaurant') {
          q = q.ilike('category', `%${intent.category}%`);
        }
        if (intent.rating) q = q.gte('rating', intent.rating);
      }
      if (type === 'event' && intent.isFree !== null) {
        q = q.eq('is_free', intent.isFree);
      }
      if (type === 'housing') {
        if (intent.listingType) q = q.eq('listing_type', intent.listingType);
        if (intent.bedrooms) q = q.gte('bedrooms', intent.bedrooms);
        if (intent.priceMax !== null) q = q.lte('price', intent.priceMax);
        if (intent.priceMin !== null) q = q.gte('price', intent.priceMin);
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

// ── Strict structural filters (type, city, price, etc.) ───────────────────────
// Keyword filtering is handled separately by applyKeywordFilter above.

function applyStrictFilters(results: Listing[], intent: AIIntent): Listing[] {
  let filtered = results;

  // Type
  if (intent.type) {
    filtered = filtered.filter((item) => item.type === intent.type);
  }

  // City (case-insensitive partial match)
  if (intent.city) {
    const cityLower = intent.city.toLowerCase();
    filtered = filtered.filter((item) => {
      const itemCity = ('city' in item ? (item as { city: string }).city : '') || '';
      return itemCity.toLowerCase().includes(cityLower);
    });
  }

  // Housing price (STRICT)
  if (intent.priceMax !== null && intent.priceMax !== undefined && intent.type === 'housing') {
    console.log('PRICE MAX', intent.priceMax);
    filtered = filtered.filter((item) => {
      if (item.type !== 'housing') return true;
      const price = normalizePrice((item as Housing).price);
      console.log('NORMALIZED PRICE', (item as Housing).title, price, '<=', intent.priceMax, '->', price <= intent.priceMax!);
      return price <= intent.priceMax!;
    });
  }
  if (intent.priceMin !== null && intent.priceMin !== undefined && intent.type === 'housing') {
    filtered = filtered.filter((item) => {
      if (item.type !== 'housing') return true;
      return normalizePrice((item as Housing).price) >= intent.priceMin!;
    });
  }

  // Bedrooms
  if (intent.bedrooms !== null && intent.bedrooms !== undefined) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'housing') return true;
      return (item as Housing).bedrooms >= intent.bedrooms!;
    });
  }

  // Listing type (rent/sale)
  if (intent.listingType) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'housing') return true;
      return (item as Housing).listingType === intent.listingType;
    });
  }

  // Job remote
  if (intent.remote !== null && intent.remote !== undefined) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'job') return true;
      return (item as Job).remote === intent.remote;
    });
  }

  // Job type
  if (intent.jobType) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'job') return true;
      return (item as Job).jobType === intent.jobType;
    });
  }

  // Event free
  if (intent.isFree !== null && intent.isFree !== undefined) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'event') return true;
      return (item as Event).isFree === intent.isFree;
    });
  }

  // Business category (broad match — with expansion for restaurant)
  if (intent.category && intent.type === 'business') {
    const catLower = intent.category.toLowerCase();
    const beforeCat = filtered.length;
    filtered = filtered.filter((item) => {
      if (item.type !== 'business') return true;
      const b = item as Business;
      const bCatLower = b.category.toLowerCase();
      if (catLower === 'restaurant') {
        // Include halal + entertainment categories and food-tagged businesses
        return (
          RESTAURANT_EQUIVALENT_CATEGORIES.has(bCatLower) ||
          b.tags.some((t) => FOOD_TAGS.some((kw) => t.toLowerCase().includes(kw)))
        );
      }
      return (
        bCatLower.includes(catLower) ||
        b.tags.some((t) => t.toLowerCase().includes(catLower))
      );
    });
    console.log('AFTER_CATEGORY_FILTER_COUNT', filtered.length, '(was', beforeCat + ')');
  }

  // Rating
  if (intent.rating !== null && intent.rating !== undefined) {
    filtered = filtered.filter((item) => {
      if (item.type !== 'business') return true;
      return (item as Business).rating >= intent.rating!;
    });
  }

  return filtered;
}

// ── Result summary for OpenAI ─────────────────────────────────────────────────

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

// ── Mock / fallback response ──────────────────────────────────────────────────

function generateMockResponse(intent: AIIntent, count: number): string {
  const city = intent.city ? ` in ${intent.city}` : '';
  const priceLabel = intent.priceMax ? ` under $${intent.priceMax.toLocaleString()}` : '';
  const keyword = intent.keywords[0] || null;

  if (count === 0) {
    if (keyword && isStrictSearch(intent)) {
      return `I couldn't find any ${keyword} places${city}. This category may not be listed yet — try a nearby city or check back later!`;
    }
    if (intent.type === 'housing' && intent.priceMax) {
      return `I couldn't find rentals${priceLabel}${city}. Try increasing your budget or checking a nearby city.`;
    }
    return `I couldn't find any listings${city} matching your search. Try a different city or broader terms!`;
  }

  const s = count === 1 ? '' : 's';
  const label = keyword && isStrictSearch(intent) ? keyword : null;

  if (intent.type === 'business' && label) return `I found ${count} ${label} place${s}${city}! Check out the listings below.`;
  if (intent.type === 'business') return `I found ${count} business${s}${city}! Check out these community-verified listings.`;
  if (intent.type === 'event') return `I found ${count} upcoming event${s}${city}! Great community gatherings to explore.`;
  if (intent.type === 'housing') {
    const rentLabel = intent.listingType === 'sale' ? 'propert' : 'rental';
    const rentS = count === 1 ? 'y' : 'ies';
    return `I found ${count} ${rentLabel}${rentS}${priceLabel}${city}! Here are the available listings.`;
  }
  if (intent.type === 'job') return `I found ${count} job opportunit${count === 1 ? 'y' : 'ies'}${city}! Here are positions that match your search.`;
  return `I found ${count} listing${s}${city} across our community directory!`;
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

    console.log('QUERY', safeMessage);
    console.log('OPENAI_USED', !!apiKey);

    // ── Step 1: Extract intent ────────────────────────────────────────────────
    let intent: AIIntent;
    if (apiKey) {
      const openai = new OpenAI({ apiKey });
      intent = await extractIntentAI(openai, safeMessage, history, activeCity, activeState);
    } else {
      intent = extractIntentFallback(safeMessage, activeCity, activeState);
    }

    // Safety: always run regex price extraction — fills in if OpenAI missed it
    const lower = safeMessage.toLowerCase();
    if (intent.priceMax === null) intent.priceMax = extractPriceMax(lower);
    if (intent.priceMin === null) intent.priceMin = extractPriceMin(lower);

    // Safety: if OpenAI set category="restaurant" for a coffee/cafe search, override it
    if (
      intent.category === 'restaurant' &&
      intent.keywords.some((kw) => COFFEE_WORDS.includes(kw.toLowerCase()) || CAFE_WORDS.includes(kw.toLowerCase()))
    ) {
      intent.category = null;
    }

    // Safety: remove broad category words from keywords — they're already in intent.category
    // and cause false strictness when OpenAI adds them (e.g. keywords:["restaurant"] for restaurant search)
    const GENERIC_CATEGORY_WORDS = new Set([
      'restaurant', 'restaurants', 'food', 'eat', 'eating', 'dining', 'dine',
      'mosque', 'mosques', 'grocery', 'groceries', 'groceries', 'market',
      'job', 'jobs', 'work', 'employment', 'career', 'careers',
      'housing', 'house', 'home', 'apartment', 'apartments', 'rent', 'rental',
      'event', 'events', 'places',
    ]);
    intent.keywords = intent.keywords.filter((kw) => !GENERIC_CATEGORY_WORDS.has(kw.toLowerCase()));

    console.log('AI_INTENT', JSON.stringify(intent));
    console.log('KEYWORDS_AFTER_STRIP', JSON.stringify(intent.keywords));
    console.log('STRICT_MODE', isStrictSearch(intent));

    // ── Step 2: Query static data + Supabase ─────────────────────────────────
    const filters: SearchFilters = {
      type: intent.type ?? undefined,
      city: intent.city ?? undefined,
      state: intent.state ?? undefined,
      // Skip 'restaurant' category in searchDirectory — halal businesses won't match it.
      // applyStrictFilters handles the expanded restaurant category matching in memory.
      category: (intent.category && intent.category !== 'restaurant') ? intent.category : undefined,
      remote: intent.remote ?? undefined,
      jobType: intent.jobType ?? undefined,
      listingType: intent.listingType ?? undefined,
      bedrooms: intent.bedrooms ?? undefined,
      priceMax: intent.priceMax ?? undefined,
      isFree: intent.isFree ?? undefined,
      rating: intent.rating ?? undefined,
      keywords: intent.keywords.length > 0 ? intent.keywords : undefined,
    };

    const staticResults = searchDirectory(filters);

    let supabaseResults: Listing[] = [];
    if (supabase) {
      supabaseResults = await querySupabaseListings(supabase, intent);
    }

    console.log('SUPABASE_RESULTS', JSON.stringify({
      count: supabaseResults.length,
      titles: supabaseResults.map(getItemTitle),
    }));

    // Merge: Supabase first (newer/user-submitted), then static — dedup by id
    const seenIds = new Set<string>();
    const rawResults: Listing[] = [];
    for (const item of [...supabaseResults, ...staticResults]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        rawResults.push(item);
      }
    }

    console.log('RAW RESULTS', JSON.stringify(rawResults.map((r) => ({
      title: getItemTitle(r),
      type: r.type,
      city: 'city' in r ? (r as { city: string }).city : '',
      price: r.type === 'housing' ? (r as Housing).price : undefined,
      category: 'category' in r ? (r as { category: string }).category : undefined,
    }))));
    console.log('RAW_RESULTS_COUNT', rawResults.length);

    // ── Step 3: Keyword scoring + strict filter ───────────────────────────────
    const keywordFiltered = applyKeywordFilter(rawResults, intent);
    console.log('AFTER_KEYWORD_FILTER_COUNT', keywordFiltered.length);

    // ── Step 4: Structural strict filters (type, city, price, category...) ───
    const strictFiltered = applyStrictFilters(keywordFiltered, intent);

    console.log('FINAL_RESULTS', JSON.stringify(strictFiltered.map((r) => ({
      title: getItemTitle(r),
      type: r.type,
      price: r.type === 'housing' ? (r as Housing).price : undefined,
      category: 'category' in r ? (r as { category: string }).category : undefined,
    }))));
    console.log('FINAL_RESULTS_COUNT', strictFiltered.length);

    const topResults = strictFiltered.slice(0, 8);
    const totalFound = strictFiltered.length;

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

    // ── Step 5: OpenAI streaming answer from real results ─────────────────────
    const openai = new OpenAI({ apiKey });
    const resultsSummary = buildResultsSummary(topResults);
    const priceContext = intent.priceMax
      ? `\nPRICE FILTER APPLIED: only listings at or below $${intent.priceMax.toLocaleString()} are shown.`
      : '';
    const keywordContext = intent.keywords.length > 0 && isStrictSearch(intent)
      ? `\nKEYWORD FILTER APPLIED: only listings matching "${intent.keywords.join(', ')}" are shown.`
      : '';

    const systemPrompt = `You are Community Connect AI — a warm, concise assistant for Muslim Americans and diverse communities.

ACTUAL SEARCH RESULTS (${topResults.length} shown of ${totalFound} matching ALL filters):
${resultsSummary}
${priceContext}${keywordContext}
USER LOCATION: ${activeCity || 'unknown'}, ${activeState || 'unknown'}

RESPONSE RULES:
1. Maximum 2–3 sentences, warm and direct
2. State exact count and city
3. If keyword filter was applied (coffee, pizza, gym, etc.): mention the specific thing searched
4. If zero results with strict keyword: say "I couldn't find [keyword] places in [city]" — suggest checking back or nearby city
5. If zero results with price filter: mention the budget and suggest increasing it
6. Cards appear automatically — do NOT list them
7. NEVER invent listings. Only describe what's in the search results above
8. Stay on type — coffee search → only mention coffee/cafes, not restaurants`;

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
          temperature: 0.5,
          max_tokens: 160,
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
