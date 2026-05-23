import { Listing, SearchFilters, Business, Event, Housing, Job } from './types';
import { ALL_LISTINGS, BUSINESSES, EVENTS, HOUSING, JOBS } from './data';

export function searchDirectory(filters: SearchFilters): Listing[] {
  let results: Listing[] = ALL_LISTINGS;

  if (filters.type) {
    results = results.filter((item) => item.type === filters.type);
  }

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    results = results.filter((item) => {
      if ('city' in item) {
        return item.city.toLowerCase().includes(cityLower);
      }
      return false;
    });
  }

  if (filters.state) {
    const stateLower = filters.state.toLowerCase();
    results = results.filter((item) => {
      if ('state' in item) {
        return item.state.toLowerCase().includes(stateLower) ||
          getStateAbbreviation(filters.state!).toLowerCase() === item.state.toLowerCase();
      }
      return false;
    });
  }

  if (filters.category) {
    const catLower = filters.category.toLowerCase();
    results = results.filter((item) => {
      if ('category' in item) {
        return item.category.toLowerCase().includes(catLower);
      }
      if ('tags' in item && Array.isArray(item.tags)) {
        return item.tags.some((tag: string) => tag.toLowerCase().includes(catLower));
      }
      return false;
    });
  }

  if (filters.keywords && filters.keywords.length > 0) {
    results = results.filter((item) => {
      const searchStr = JSON.stringify(item).toLowerCase();
      return filters.keywords!.some((kw) => searchStr.includes(kw.toLowerCase()));
    });
  }

  if (filters.rating !== undefined) {
    results = results.filter((item) => {
      if ('rating' in item) {
        return (item as Business).rating >= filters.rating!;
      }
      return true;
    });
  }

  if (filters.priceMax !== undefined) {
    results = results.filter((item) => {
      if (item.type === 'housing') {
        return (item as Housing).price <= filters.priceMax!;
      }
      if (item.type === 'job') {
        const job = item as Job;
        if (job.salaryMin !== undefined) {
          return job.salaryMin <= filters.priceMax!;
        }
      }
      return true;
    });
  }

  if (filters.priceMin !== undefined) {
    results = results.filter((item) => {
      if (item.type === 'housing') {
        return (item as Housing).price >= filters.priceMin!;
      }
      if (item.type === 'job') {
        const job = item as Job;
        if (job.salaryMin !== undefined) {
          return job.salaryMax !== undefined ? job.salaryMax >= filters.priceMin! : true;
        }
      }
      return true;
    });
  }

  if (filters.bedrooms !== undefined) {
    results = results.filter((item) => {
      if (item.type === 'housing') {
        return (item as Housing).bedrooms >= filters.bedrooms!;
      }
      return true;
    });
  }

  if (filters.listingType) {
    results = results.filter((item) => {
      if (item.type === 'housing') {
        return (item as Housing).listingType === filters.listingType;
      }
      return true;
    });
  }

  if (filters.jobType) {
    results = results.filter((item) => {
      if (item.type === 'job') {
        return (item as Job).jobType === filters.jobType;
      }
      return true;
    });
  }

  if (filters.remote !== undefined) {
    results = results.filter((item) => {
      if (item.type === 'job') {
        return (item as Job).remote === filters.remote;
      }
      return true;
    });
  }

  if (filters.isFree !== undefined) {
    results = results.filter((item) => {
      if (item.type === 'event') {
        return (item as Event).isFree === filters.isFree;
      }
      return true;
    });
  }

  return results;
}

export function buildContextString(): string {
  const businessSummary = BUSINESSES.map((b) =>
    `Business: ${b.name} | Category: ${b.category} | City: ${b.city}, ${b.state} | Rating: ${b.rating}/5 | Tags: ${b.tags.join(', ')} | Open: ${b.isOpen ? 'Yes' : 'No'} | Price level: ${'$'.repeat(b.priceLevel)}`
  ).join('\n');

  const eventSummary = EVENTS.map((e) =>
    `Event: ${e.title} | Date: ${e.date} | City: ${e.city}, ${e.state} | Price: ${e.isFree ? 'Free' : `$${e.price}`} | Category: ${e.category}`
  ).join('\n');

  const housingSummary = HOUSING.map((h) =>
    `Housing: ${h.title} | Type: ${h.listingType} | City: ${h.city}, ${h.state} | Price: $${h.price}${h.listingType === 'rent' ? '/mo' : ''} | Beds: ${h.bedrooms} | Baths: ${h.bathrooms}`
  ).join('\n');

  const jobSummary = JOBS.map((j) =>
    `Job: ${j.title} at ${j.company} | City: ${j.city}, ${j.state} | Salary: ${j.salary} | Type: ${j.jobType} | Remote: ${j.remote ? 'Yes' : 'No'}`
  ).join('\n');

  return `COMMUNITY CONNECT USA DIRECTORY DATA:

=== BUSINESSES (${BUSINESSES.length} total) ===
${businessSummary}

=== EVENTS (${EVENTS.length} total) ===
${eventSummary}

=== HOUSING LISTINGS (${HOUSING.length} total) ===
${housingSummary}

=== JOB LISTINGS (${JOBS.length} total) ===
${jobSummary}`;
}

function getStateAbbreviation(state: string): string {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  };
  return stateMap[state.toLowerCase()] || state.toUpperCase();
}
