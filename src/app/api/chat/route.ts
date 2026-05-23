import { NextRequest, NextResponse } from 'next/server';
import { buildContextString, searchDirectory } from '@/lib/directory-search';
import { SearchFilters } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const directoryContext = buildContextString();

    const systemPrompt = `You are the Community Connect USA AI assistant — an intelligent search helper for a community platform serving Muslim Americans and diverse communities across the United States.

Your job is to understand user questions and return structured search responses about local businesses, events, housing, and jobs.

You have access to the following directory data:
${directoryContext}

IMPORTANT INSTRUCTIONS:
1. Always analyze the user's request to determine what they are looking for
2. Extract location information (city, state, zip)
3. Extract category/type information
4. Extract any price or filter requirements
5. Return a helpful, warm, conversational response
6. Always include a JSON block at the end with the extracted filters

For the JSON block, use this EXACT format (do not change field names):
<search_filters>
{
  "type": "business" | "event" | "housing" | "job" | null,
  "city": "city name" | null,
  "state": "state code like NY, CA, TX" | null,
  "category": "category keyword" | null,
  "priceMin": number | null,
  "priceMax": number | null,
  "rating": number | null,
  "keywords": ["keyword1", "keyword2"] | null,
  "listingType": "rent" | "sale" | null,
  "jobType": "full-time" | "part-time" | "contract" | "freelance" | null,
  "remote": true | false | null,
  "bedrooms": number | null,
  "isFree": true | false | null
}
</search_filters>

Examples:
- "halal restaurants in Philadelphia" → type: "business", city: "Philadelphia", category: "halal"
- "apartments under 1200 in Chicago" → type: "housing", city: "Chicago", priceMax: 1200, listingType: "rent"
- "free events this weekend" → type: "event", isFree: true
- "delivery jobs in New York" → type: "job", city: "New York", keywords: ["delivery"]
- "mosque near me" → type: "business", category: "mosque"

Always be warm, helpful, and community-focused in your responses. Mention the number of results you found.`;

    const messages = [
      ...history.slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const mockResponse = generateMockResponse(message);
      const filters = extractFiltersFromMessage(message);
      const results = searchDirectory(filters);
      return NextResponse.json({
        message: mockResponse,
        filters,
        results: results.slice(0, 6),
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
        filters = extractFiltersFromMessage(message);
      }
    } else {
      filters = extractFiltersFromMessage(message);
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
    const filters = extractFiltersFromMessage('');
    return NextResponse.json({
      message: "I'm here to help you discover your community! Try asking about halal restaurants, local mosques, apartments, jobs, or upcoming events.",
      filters,
      results: [],
      totalFound: 0,
    });
  }
}

function extractFiltersFromMessage(message: string): SearchFilters {
  const lower = message.toLowerCase();
  const filters: SearchFilters = {};

  const cities = ['new york', 'chicago', 'philadelphia', 'houston', 'dallas', 'los angeles', 'atlanta', 'seattle', 'boston', 'miami'];
  for (const city of cities) {
    if (lower.includes(city)) {
      filters.city = city.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

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

  return filters;
}

function generateMockResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('halal') && (lower.includes('restaurant') || lower.includes('food'))) {
    return "I found some amazing halal restaurants for you! Here are the top-rated options in our directory. Each one is certified halal with great community reviews.";
  }
  if (lower.includes('mosque') || lower.includes('masjid')) {
    return "I found Islamic centers and mosques in our directory. These are community-verified locations offering daily prayers and community services.";
  }
  if (lower.includes('apartment') || lower.includes('rent')) {
    return "Here are available housing listings matching your criteria! I've filtered for your location and budget requirements.";
  }
  if (lower.includes('job') || lower.includes('work')) {
    return "I found job opportunities in our directory! Here are positions that match what you're looking for.";
  }
  if (lower.includes('event')) {
    return "Here are upcoming community events! From cultural gatherings to educational workshops, there's something for everyone.";
  }
  return "I found several listings that match your search. Here's what's available in our community directory!";
}
