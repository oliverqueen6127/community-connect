import { NextRequest, NextResponse } from 'next/server';
import { buildContextString, searchDirectory } from '@/lib/directory-search';
import { SearchFilters } from '@/lib/types';

export const runtime = 'nodejs';

interface Location {
  city: string;
  state: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], location } = await request.json() as {
      message: string;
      history: { role: string; content: string }[];
      location?: Location;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const activeCity = location?.city || '';
    const activeState = location?.state || '';
    const locationLine = activeCity
      ? `\n\n⚠️ ACTIVE USER LOCATION: ${activeCity}, ${activeState}\nYou MUST only show results from ${activeCity}. NEVER show results from other cities unless the user explicitly asks. If no results exist in ${activeCity}, say so clearly.`
      : '';

    const directoryContext = buildContextString();

    const systemPrompt = `You are the Community Connect USA AI assistant — an intelligent search helper for a community platform serving Muslim Americans and diverse communities across the United States.

Your job is to understand user questions and return structured search responses about local businesses, events, housing, and jobs.

You have access to the following directory data:
${directoryContext}${locationLine}

IMPORTANT INSTRUCTIONS:
1. Always analyze the user's request to determine what they are looking for
2. If the user has a selected location, ALWAYS filter to that location — never mix cities
3. Return a helpful, warm, conversational response mentioning the city
4. Always include a JSON block at the end with the extracted filters

For the JSON block, use this EXACT format:
<search_filters>
{
  "type": "business" | "event" | "housing" | "job" | null,
  "city": "city name" | null,
  "state": "state code" | null,
  "category": "category keyword" | null,
  "priceMin": number | null,
  "priceMax": number | null,
  "rating": number | null,
  "keywords": ["keyword1"] | null,
  "listingType": "rent" | "sale" | null,
  "jobType": "full-time" | "part-time" | "contract" | "freelance" | null,
  "remote": true | false | null,
  "bedrooms": number | null,
  "isFree": true | false | null
}
</search_filters>`;

    const messages = [
      ...history.slice(-6).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const filters = extractFiltersFromMessage(message, location);
      const results = searchDirectory(filters);
      const mockMessage = generateMockResponse(message, activeCity);
      return NextResponse.json({
        message: mockMessage,
        filters,
        results: results.slice(0, 8),
        totalFound: results.length,
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://communityconnectusa.com',
        'X-Title': 'Community Connect USA',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    const filtersMatch = aiContent.match(/<search_filters>([\s\S]*?)<\/search_filters>/);
    let filters: SearchFilters = {};

    if (filtersMatch) {
      try {
        const parsed = JSON.parse(filtersMatch[1]);
        filters = Object.fromEntries(
          Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined)
        ) as SearchFilters;
      } catch {
        filters = extractFiltersFromMessage(message, location);
      }
    } else {
      filters = extractFiltersFromMessage(message, location);
    }

    // Always enforce the active location
    if (activeCity && !filters.city) {
      filters.city = activeCity;
      filters.state = activeState;
    }

    const cleanMessage = aiContent
      .replace(/<search_filters>[\s\S]*?<\/search_filters>/g, '')
      .trim();

    const results = searchDirectory(filters);

    return NextResponse.json({
      message: cleanMessage,
      filters,
      results: results.slice(0, 8),
      totalFound: results.length,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      message: "I'm here to help you discover your community! Try asking about halal restaurants, local mosques, apartments, jobs, or upcoming events.",
      filters: {},
      results: [],
      totalFound: 0,
    });
  }
}

function extractFiltersFromMessage(message: string, location?: Location): SearchFilters {
  const lower = message.toLowerCase();
  const filters: SearchFilters = {};

  // Type detection
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat') || lower.includes('dining')) {
    filters.type = 'business';
    filters.category = lower.includes('halal') ? 'halal' : 'restaurant';
  } else if (lower.includes('mosque') || lower.includes('masjid') || lower.includes('islamic center')) {
    filters.type = 'business';
    filters.category = 'mosque';
  } else if (lower.includes('grocery') || lower.includes('supermarket')) {
    filters.type = 'business';
    filters.category = 'grocery';
  } else if (lower.includes('apartment') || lower.includes('house') || lower.includes('rent') || lower.includes('housing') || lower.includes('studio')) {
    filters.type = 'housing';
    if (lower.includes('rent')) filters.listingType = 'rent';
    if (lower.includes('buy') || lower.includes('sale')) filters.listingType = 'sale';
  } else if (lower.includes('job') || lower.includes('work') || lower.includes('career') || lower.includes('hire') || lower.includes('employ')) {
    filters.type = 'job';
    if (lower.includes('remote')) filters.remote = true;
    if (lower.includes('part-time') || lower.includes('part time')) filters.jobType = 'part-time';
    if (lower.includes('full-time') || lower.includes('full time')) filters.jobType = 'full-time';
  } else if (lower.includes('event') || lower.includes('weekend') || lower.includes('happening')) {
    filters.type = 'event';
    if (lower.includes('free')) filters.isFree = true;
  }

  if (lower.includes('halal')) {
    filters.keywords = [...(filters.keywords || []), 'halal'];
    if (!filters.type) filters.type = 'business';
  }

  const priceMatch = lower.match(/under\s*\$?(\d+(?:,\d+)?)/);
  if (priceMatch) {
    filters.priceMax = parseInt(priceMatch[1].replace(',', ''));
  }

  const ratingMatch = lower.match(/(\d+(?:\.\d+)?)\s*star/);
  if (ratingMatch) {
    filters.rating = parseFloat(ratingMatch[1]);
  }

  // Check if user explicitly mentioned a different city
  const cities = ['new york', 'chicago', 'philadelphia', 'houston', 'dallas', 'los angeles', 'atlanta', 'seattle', 'boston', 'miami'];
  let userSpecifiedCity = false;
  for (const city of cities) {
    if (lower.includes(city)) {
      filters.city = city.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      userSpecifiedCity = true;
      break;
    }
  }

  // If user didn't specify a city, use the active location
  if (!userSpecifiedCity && location?.city) {
    filters.city = location.city;
    if (location.state) filters.state = location.state;
  }

  return filters;
}

function generateMockResponse(message: string, city: string): string {
  const lower = message.toLowerCase();
  const loc = city ? ` in ${city}` : '';

  if (lower.includes('halal') && (lower.includes('restaurant') || lower.includes('food'))) {
    return `I found some amazing halal restaurants${loc}! Here are the top-rated options in our directory. Each one is certified halal with great community reviews.`;
  }
  if (lower.includes('mosque') || lower.includes('masjid')) {
    return `I found Islamic centers and mosques${loc}. These are community-verified locations offering daily prayers and community services.`;
  }
  if (lower.includes('apartment') || lower.includes('rent')) {
    return `Here are available housing listings${loc}! I've filtered for your location and budget requirements.`;
  }
  if (lower.includes('job') || lower.includes('work')) {
    return `I found job opportunities${loc}! Here are positions that match what you're looking for.`;
  }
  if (lower.includes('event')) {
    return `Here are upcoming community events${loc}! From cultural gatherings to educational workshops, there's something for everyone.`;
  }
  if (lower.includes('grocery') || lower.includes('halal market')) {
    return `I found halal grocery stores and markets${loc}! Great options for fresh halal products and specialty items.`;
  }
  return `I found several listings${loc} that match your search. Here's what's available in our community directory!`;
}
