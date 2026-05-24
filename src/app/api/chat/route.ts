import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { buildContextString, searchDirectory } from '@/lib/directory-search';
import { SearchFilters } from '@/lib/types';

export const runtime = 'nodejs';

interface Location {
  city: string;
  state: string;
}

const encoder = new TextEncoder();

function sseChunk(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function makeStream(
  fn: (controller: ReadableStreamDefaultController) => Promise<void>
): Response {
  const stream = new ReadableStream({ start: fn });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      message: string;
      history: { role: string; content: string }[];
      location?: Location;
    };

    const { message, history = [], location } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Truncate to 2000 chars for safety
    const safeMessage = message.slice(0, 2000);

    const activeCity = location?.city || '';
    const activeState = location?.state || '';
    const locationContext = activeCity
      ? `\n\nACTIVE USER LOCATION: ${activeCity}, ${activeState}\nOnly show results from ${activeCity}. If nothing found in ${activeCity}, say so and suggest checking a nearby city.`
      : '';

    const directoryContext = buildContextString();

    const systemPrompt = `You are Community Connect AI — a friendly, knowledgeable assistant helping Muslim Americans and diverse communities across the United States find local resources.

You help users discover:
• Halal restaurants, cafés, bakeries, and food spots
• Mosques and Islamic centers
• Halal grocery stores and butchers
• Job opportunities (full-time, part-time, remote, delivery)
• Apartments and housing listings
• Community events (free and paid)
• Schools, healthcare, and local services

DIRECTORY DATA (your knowledge base):
${directoryContext}
${locationContext}

RESPONSE GUIDELINES:
1. Be warm, concise, and professional — 2 to 4 sentences maximum
2. Always mention the city by name
3. Tell the user what category of results you found and how many, without listing them individually — the results appear as cards below your message automatically
4. If results exist but are from different cities, mention that clearly
5. If nothing matches, acknowledge it warmly and suggest a related search or city
6. Never make up businesses, events, or listings that are not in the directory data above
7. CRITICAL: If the user asks about jobs → only mention jobs. If housing → only housing. Never mix types.`;

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: safeMessage },
    ];

    // Run search synchronously — fast, no API call needed
    const filters = extractFiltersFromMessage(safeMessage, location);
    const allResults = searchDirectory(filters);
    const results = allResults.slice(0, 8);
    const totalFound = allResults.length;

    const apiKey = process.env.OPENAI_API_KEY;

    // ── No API key: mock streaming ──────────────────────────────────────
    if (!apiKey) {
      const mockText = generateMockResponse(safeMessage, activeCity);
      return makeStream(async (ctrl) => {
        // Simulate word-by-word streaming for the mock case
        const words = mockText.split(' ');
        for (let i = 0; i < words.length; i++) {
          ctrl.enqueue(sseChunk({ type: 'text', delta: (i > 0 ? ' ' : '') + words[i] }));
          await new Promise((r) => setTimeout(r, 30));
        }
        ctrl.enqueue(sseChunk({ type: 'done', filters, results, totalFound }));
        ctrl.close();
      });
    }

    // ── OpenAI streaming ────────────────────────────────────────────────
    const openai = new OpenAI({ apiKey });

    return makeStream(async (ctrl) => {
      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 350,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            ctrl.enqueue(sseChunk({ type: 'text', delta }));
          }
        }

        ctrl.enqueue(sseChunk({ type: 'done', filters, results, totalFound }));
        ctrl.close();
      } catch (err) {
        console.error('OpenAI stream error:', err);
        const fallbackText = generateMockResponse(safeMessage, activeCity);
        ctrl.enqueue(sseChunk({ type: 'text', delta: fallbackText }));
        ctrl.enqueue(sseChunk({ type: 'done', filters, results, totalFound }));
        ctrl.close();
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return makeStream(async (ctrl) => {
      ctrl.enqueue(
        sseChunk({
          type: 'error',
          message:
            "I'm here to help you discover your community! Try asking about halal restaurants, mosques, apartments, jobs, or upcoming events.",
        })
      );
      ctrl.close();
    });
  }

}

// ── Intent detection ────────────────────────────────────────────────────────

function detectIntent(lower: string): { type: SearchFilters['type']; keywords: string[] } {
  const keywords: string[] = [];

  // Job-specific occupational terms — checked FIRST to prevent "warehouse" matching "house"
  const JOB_OCCUPATIONS = [
    'warehouse', 'driver', 'delivery', 'forklift', 'mechanic', 'engineer',
    'developer', 'programmer', 'nurse', 'teacher', 'manager', 'accountant',
    'chef', 'cook', 'security', 'cleaning', 'maintenance', 'technician',
    'designer', 'salesperson', 'cashier', 'receptionist', 'intern',
  ];
  const matchedOccupations = JOB_OCCUPATIONS.filter((o) => lower.includes(o));
  if (matchedOccupations.length > 0) keywords.push(...matchedOccupations);

  // Generic job signal words
  const hasJobWord =
    lower.includes('job') ||
    lower.includes('jobs') ||
    lower.includes('career') ||
    lower.includes('careers') ||
    lower.includes('hiring') ||
    lower.includes('hire') ||
    lower.includes('employ') ||
    lower.includes('employment') ||
    lower.includes('vacancy') ||
    lower.includes('position') ||
    lower.includes('internship') ||
    lower.includes('salary') ||
    lower.includes('resume') ||
    /\bwork\b/.test(lower) ||    // word boundary — avoids "network", "artwork"
    matchedOccupations.length > 0;

  if (hasJobWord) return { type: 'job', keywords };

  // Mosque
  if (
    lower.includes('mosque') ||
    lower.includes('masjid') ||
    lower.includes('islamic center') ||
    lower.includes('prayer') ||
    lower.includes('imam') ||
    lower.includes('jummah')
  ) return { type: 'business', keywords: ['mosque'] };

  // Grocery / butcher
  if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('butcher') || lower.includes('market'))
    return { type: 'business', keywords: ['grocery'] };

  // Restaurant / food
  if (
    lower.includes('restaurant') ||
    lower.includes('food') ||
    lower.includes('eat') ||
    lower.includes('dining') ||
    lower.includes('cafe') ||
    lower.includes('bakery') ||
    lower.includes('halal')
  ) return { type: 'business', keywords: lower.includes('halal') ? ['halal'] : ['restaurant'] };

  // Healthcare
  if (lower.includes('clinic') || lower.includes('health') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('dentist'))
    return { type: 'business', keywords: ['healthcare'] };

  // School / education
  if (lower.includes('school') || lower.includes('academy') || lower.includes('education') || lower.includes('university') || lower.includes('college'))
    return { type: 'business', keywords: ['school'] };

  // Housing — uses word boundary for 'house' so 'warehouse' never matches
  if (
    lower.includes('apartment') ||
    lower.includes('apartments') ||
    /\bhouse\b/.test(lower) ||
    /\bhomes?\b/.test(lower) ||
    lower.includes('rent') ||
    lower.includes('housing') ||
    lower.includes('studio') ||
    lower.includes('condo') ||
    lower.includes('bedroom') ||
    lower.includes('townhouse') ||
    lower.includes('lease')
  ) return { type: 'housing', keywords: [] };

  // Events
  if (
    lower.includes('event') ||
    lower.includes('weekend') ||
    lower.includes('happening') ||
    lower.includes('festival') ||
    lower.includes('gathering') ||
    lower.includes('concert') ||
    lower.includes('workshop')
  ) return { type: 'event', keywords: [] };

  return { type: undefined, keywords: [] };
}

// ── Filter extraction ────────────────────────────────────────────────────────

function extractFiltersFromMessage(message: string, location?: Location): SearchFilters {
  const lower = message.toLowerCase();
  const filters: SearchFilters = {};

  // Detect primary intent
  const { type, keywords } = detectIntent(lower);
  filters.type = type;

  // Type-specific sub-filters
  if (type === 'job') {
    if (lower.includes('remote')) filters.remote = true;
    if (lower.includes('part-time') || lower.includes('part time')) filters.jobType = 'part-time';
    if (lower.includes('full-time') || lower.includes('full time')) filters.jobType = 'full-time';
    if (lower.includes('contract')) filters.jobType = 'contract';
    if (lower.includes('freelance')) filters.jobType = 'contract';
    if (lower.includes('internship')) filters.jobType = 'internship';
    // Pass occupation terms as keywords to search inside job titles/descriptions
    if (keywords.length > 0) filters.keywords = keywords;
  }

  if (type === 'housing') {
    if (lower.includes('buy') || lower.includes('sale') || lower.includes('purchase') || lower.includes('for sale')) {
      filters.listingType = 'sale';
    } else {
      filters.listingType = 'rent';
    }
  }

  if (type === 'event') {
    if (lower.includes('free')) filters.isFree = true;
  }

  if (type === 'business' && keywords.length > 0) {
    // Use category filter for businesses (not keywords — avoids double-filtering)
    filters.category = keywords[0];
  }

  // Price / budget (e.g. "under $1500")
  const priceMatch = lower.match(/under\s*\$?(\d[\d,]*)/);
  if (priceMatch) filters.priceMax = parseInt(priceMatch[1].replace(',', ''));

  // Bedrooms (e.g. "2 bedroom", "3br")
  const bedroomMatch = lower.match(/(\d)\s*(?:bed|bedroom|br)\b/);
  if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);

  // Min rating (e.g. "4 star")
  const ratingMatch = lower.match(/(\d(?:\.\d)?)\s*star/);
  if (ratingMatch) filters.rating = parseFloat(ratingMatch[1]);

  // City — explicit mention overrides active location
  const knownCities = [
    'new york', 'chicago', 'philadelphia', 'houston', 'dallas',
    'los angeles', 'atlanta', 'seattle', 'boston', 'miami',
    'phoenix', 'denver', 'detroit', 'nashville', 'san francisco',
  ];
  let userSpecifiedCity = false;
  for (const city of knownCities) {
    if (lower.includes(city)) {
      filters.city = city.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
      userSpecifiedCity = true;
      break;
    }
  }
  if (!userSpecifiedCity && location?.city) {
    filters.city = location.city;
    if (location.state) filters.state = location.state;
  }

  return filters;
}

// ── Mock response generator (no API key fallback) ───────────────────────────

function generateMockResponse(message: string, city: string): string {
  const lower = message.toLowerCase();
  const loc = city ? ` in ${city}` : '';

  if (lower.includes('halal') && (lower.includes('restaurant') || lower.includes('food'))) {
    return `I found some amazing halal restaurants${loc}! Here are the top-rated options in our community directory. Each one is certified halal with great community reviews.`;
  }
  if (lower.includes('mosque') || lower.includes('masjid') || lower.includes('prayer')) {
    return `I found mosques and Islamic centers${loc}. These are community-verified locations offering daily prayers, Jummah services, and community programs.`;
  }
  if (lower.includes('grocery') || lower.includes('butcher')) {
    return `I found halal grocery stores and markets${loc}. Great options for fresh halal products, specialty cuts, and imported spices.`;
  }
  if (lower.includes('apartment') || lower.includes('rent') || lower.includes('housing')) {
    return `Here are available housing listings${loc}! I've filtered by your location and any budget criteria you mentioned.`;
  }
  if (lower.includes('job') || lower.includes('work') || lower.includes('career')) {
    return `I found job opportunities${loc}! Here are positions that match what you're looking for — from full-time roles to flexible part-time work.`;
  }
  if (lower.includes('event')) {
    return `Here are upcoming community events${loc}! From cultural gatherings to educational workshops, there's something for everyone.`;
  }
  return `I found several listings${loc} that match your search. Here's what's available in our community directory!`;
}
