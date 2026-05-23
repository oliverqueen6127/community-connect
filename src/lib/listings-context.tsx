'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserListing, ListingType, Business, Event, Housing, Job } from './types';

const LISTINGS_KEY = 'cc-user-listings';

interface ListingsContextType {
  userListings: UserListing[];
  addListing: (listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => void;
  deleteListing: (id: string) => void;
  approveListing: (id: string) => void;
  rejectListing: (id: string) => void;
  getListingsByUser: (userId: string) => UserListing[];
  activeListings: UserListing[];
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

function load(): UserListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(data: UserListing[]) {
  try { localStorage.setItem(LISTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [userListings, setUserListings] = useState<UserListing[]>([]);

  useEffect(() => { setUserListings(load()); }, []);

  const addListing = useCallback((listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => {
    const newListing: UserListing = {
      ...listing,
      id: `ul-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setUserListings((prev) => {
      const updated = [newListing, ...prev];
      save(updated);
      return updated;
    });
  }, []);

  const deleteListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      save(updated);
      return updated;
    });
  }, []);

  const approveListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'active' as const } : l);
      save(updated);
      return updated;
    });
  }, []);

  const rejectListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'pending' as const } : l);
      save(updated);
      return updated;
    });
  }, []);

  const getListingsByUser = useCallback((userId: string) =>
    userListings.filter((l) => l.publishedBy === userId), [userListings]);

  const activeListings = userListings.filter((l) => l.status === 'active');

  return (
    <ListingsContext.Provider value={{
      userListings, addListing, deleteListing,
      approveListing, rejectListing, getListingsByUser, activeListings,
    }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}

// Helper to build typed listing data from form
export function buildListingData(type: ListingType, form: Record<string, string>, userId: string, userName: string): Business | Event | Housing | Job {
  const id = `ul-${Math.random().toString(36).substr(2, 9)}`;
  const city = form.city || 'New York';
  const state = form.state || 'NY';

  if (type === 'business') {
    return {
      id, type: 'business',
      name: form.title || 'Untitled Business',
      category: (form.category as Business['category']) || 'other',
      description: form.description || '',
      address: form.address || '',
      city, state,
      zip: form.zip || '',
      phone: form.phone || '',
      website: form.website || undefined,
      rating: 0, reviewCount: 0,
      isOpen: true,
      hours: form.hours || 'Mon-Sat 9am-6pm',
      image: `https://source.unsplash.com/400x300/?${encodeURIComponent(form.category || 'business')}`,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      priceLevel: 2,
    } as Business;
  }

  if (type === 'event') {
    return {
      id, type: 'event',
      title: form.title || 'Untitled Event',
      description: form.description || '',
      category: form.category || 'community',
      date: form.eventDate || new Date().toISOString().split('T')[0],
      time: form.eventTime || '6:00 PM',
      location: form.location || '',
      city, state,
      organizer: userName,
      attendees: 0,
      price: parseFloat(form.price || '0'),
      isFree: !form.price || form.price === '0',
      image: `https://source.unsplash.com/400x300/?event,community`,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    } as Event;
  }

  if (type === 'housing') {
    return {
      id, type: 'housing',
      title: form.title || 'Untitled Property',
      description: form.description || '',
      address: form.address || '',
      city, state,
      zip: form.zip || '',
      price: parseFloat(form.price || '0'),
      bedrooms: parseInt(form.bedrooms || '1'),
      bathrooms: parseFloat(form.bathrooms || '1'),
      sqft: parseInt(form.sqft || '500'),
      propertyType: (form.propertyType as Housing['propertyType']) || 'apartment',
      listingType: (form.listingType as Housing['listingType']) || 'rent',
      images: [`https://source.unsplash.com/400x300/?apartment,home`],
      amenities: [],
      contactName: userName,
      contactPhone: form.phone || '',
      contactEmail: form.email || '',
      postedDate: new Date().toISOString().split('T')[0],
      available: true,
      petFriendly: false,
      parking: false,
    } as Housing;
  }

  // job
  return {
    id, type: 'job',
    title: form.title || 'Untitled Position',
    company: form.company || userName,
    description: form.description || '',
    category: form.category || 'other',
    city, state,
    salary: form.salary || 'Competitive',
    jobType: (form.jobType as Job['jobType']) || 'full-time',
    remote: form.remote === 'true',
    experience: form.experience || 'Any',
    requirements: form.requirements ? form.requirements.split(',').map((r) => r.trim()).filter(Boolean) : [],
    benefits: [],
    contactEmail: form.email || '',
    postedDate: new Date().toISOString().split('T')[0],
  } as Job;
}
