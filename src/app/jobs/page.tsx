'use client';

import React, { useState, useMemo } from 'react';
import { JOBS } from '@/lib/data';
import JobCard from '@/components/cards/JobCard';
import { useApp } from '@/lib/context';

const CATEGORIES = ['All', 'technology', 'food service', 'education', 'healthcare', 'marketing', 'delivery', 'warehouse', 'design'];

export default function JobsPage() {
  const { toggleSaved, isSaved } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [jobType, setJobType] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const filtered = useMemo(() => {
    let results = JOBS;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.city.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      results = results.filter((j) => j.category === selectedCategory);
    }

    if (jobType !== 'all') {
      results = results.filter((j) => j.jobType === jobType);
    }

    if (remoteOnly) {
      results = results.filter((j) => j.remote);
    }

    return results.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  }, [search, selectedCategory, jobType, remoteOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Job Listings</h1>
        <p className="text-gray-500">Find your next opportunity in the community</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies, locations..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] text-gray-800 bg-gray-50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                  selectedCategory === cat ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#52B788] bg-white text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`relative w-10 h-5 rounded-full transition-colors ${remoteOnly ? 'bg-[#52B788]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${remoteOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">Remote Only</span>
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} jobs found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No jobs found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={() => toggleSaved('jobs', job.id)}
              isSaved={isSaved('jobs', job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
