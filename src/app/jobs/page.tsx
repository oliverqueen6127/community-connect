'use client';

import React, { useState, useMemo } from 'react';
import { JOBS } from '@/lib/data';
import JobCard from '@/components/cards/JobCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';

const CATEGORIES = ['All', 'technology', 'food service', 'education', 'healthcare', 'marketing', 'delivery', 'warehouse', 'design'];

export default function JobsPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [jobType, setJobType] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const byCity = useMemo(
    () => JOBS.filter((j) => j.remote || j.city.toLowerCase() === selectedCity.toLowerCase()),
    [selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'All') results = results.filter((j) => j.category === selectedCategory);
    if (jobType !== 'all') results = results.filter((j) => j.jobType === jobType);
    if (remoteOnly) results = results.filter((j) => j.remote);
    return results.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  }, [byCity, search, selectedCategory, jobType, remoteOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Job Listings</h1>
        <div className="flex items-center gap-1.5 text-sm text-white/40">
          <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Jobs in <span className="font-semibold text-[#00E38C] ml-1">{selectedCity}, {selectedState}</span>
          <span>+ remote</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass border border-white/8 rounded-2xl p-4 mb-6 space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search jobs in ${selectedCity}...`}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  selectedCategory === cat ? 'text-[#050816]' : 'glass border border-white/10 text-white/40 hover:text-white hover:border-white/20'
                }`}
                style={selectedCategory === cat ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="text-sm glass border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none text-white/60 bg-transparent"
            >
              <option value="all" className="bg-[#050816]">All Types</option>
              <option value="full-time" className="bg-[#050816]">Full-time</option>
              <option value="part-time" className="bg-[#050816]">Part-time</option>
              <option value="contract" className="bg-[#050816]">Contract</option>
              <option value="freelance" className="bg-[#050816]">Freelance</option>
              <option value="internship" className="bg-[#050816]">Internship</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setRemoteOnly(!remoteOnly)} className={`relative w-10 h-5 rounded-full transition-colors ${remoteOnly ? 'bg-[#00E38C]' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${remoteOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-white/40">Remote Only</span>
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/30 mb-4">{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} in {selectedCity} + remote</p>

      {byCity.length === 0 ? (
        <EmptyState icon="💼" title="No jobs in this city" description={`No jobs in ${selectedCity} yet.`} city={`${selectedCity}, ${selectedState}`} actionLabel="Change Location" onAction={() => {}} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching jobs" description={`No jobs match your filters.`} actionLabel="Clear Filters" onAction={() => { setSearch(''); setSelectedCategory('All'); setJobType('all'); setRemoteOnly(false); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onSave={() => toggleSaved('jobs', job.id)} isSaved={isSaved('jobs', job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
