export type ListingCategory =
  | 'restaurant'
  | 'grocery'
  | 'mosque'
  | 'school'
  | 'healthcare'
  | 'retail'
  | 'services'
  | 'halal'
  | 'entertainment'
  | 'other';

export type ListingType = 'business' | 'event' | 'housing' | 'job';

export interface Business {
  id: string;
  type: 'business';
  name: string;
  category: ListingCategory;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: string;
  image: string;
  tags: string[];
  priceLevel: 1 | 2 | 3 | 4;
  latitude?: number;
  longitude?: number;
}

export interface Event {
  id: string;
  type: 'event';
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  city: string;
  state: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  price: number;
  isFree: boolean;
  image: string;
  tags: string[];
  rsvpLink?: string;
}

export interface Housing {
  id: string;
  type: 'housing';
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: 'apartment' | 'house' | 'condo' | 'townhouse' | 'studio';
  listingType: 'rent' | 'sale';
  images: string[];
  amenities: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  postedDate: string;
  available: boolean;
  petFriendly: boolean;
  parking: boolean;
}

export interface Job {
  id: string;
  type: 'job';
  title: string;
  company: string;
  description: string;
  category: string;
  city: string;
  state: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  remote: boolean;
  experience: string;
  requirements: string[];
  benefits: string[];
  contactEmail: string;
  postedDate: string;
  deadline?: string;
  logo?: string;
}

export type Listing = Business | Event | Housing | Job;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: Listing[];
  isStreaming?: boolean;
}

export interface SearchFilters {
  type?: ListingType;
  city?: string;
  state?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  keywords?: string[];
  listingType?: 'rent' | 'sale';
  jobType?: string;
  remote?: boolean;
  bedrooms?: number;
  isFree?: boolean;
}

export interface AISearchResponse {
  message: string;
  filters: SearchFilters;
  results: Listing[];
  totalFound: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  savedBusinesses: string[];
  savedEvents: string[];
  savedHousing: string[];
  savedJobs: string[];
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface AppContextType {
  user: User | null;
  isLoading: boolean;
  selectedCity: string;
  selectedState: string;
  toasts: ToastNotification[];
  chatMessages: ChatMessage[];
  setSelectedCity: (city: string) => void;
  setSelectedState: (state: string) => void;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  toggleSaved: (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string) => void;
  isSaved: (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
