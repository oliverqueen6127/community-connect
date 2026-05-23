'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import ContactModal from '@/components/ui/ContactModal';
import { useLanguage } from '@/lib/language-context';

interface JobCardProps {
  job: Job;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function JobCard({ job, onSave, isSaved = false }: JobCardProps) {
  const [showContact, setShowContact] = useState(false);
  const { t } = useLanguage();

  const jobTypeColors: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'gray'> = {
    'full-time': 'green', 'part-time': 'blue', 'contract': 'purple',
    'freelance': 'yellow', 'internship': 'gray',
  };

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            {job.company.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{job.title}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
          </div>
          <button
            onClick={onSave}
            className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isSaved ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant={jobTypeColors[job.jobType] || 'gray'}>{job.jobType}</Badge>
          {job.remote && <Badge variant="teal">{t('common', 'remote')}</Badge>}
          <Badge variant="gray">{job.category}</Badge>
        </div>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-700">{job.salary}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{job.city}, {job.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{daysAgo === 0 ? 'Posted today' : `Posted ${daysAgo}d ago`}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button className="flex-1 py-2.5 text-sm font-semibold bg-[#1B4332] text-white rounded-xl hover:bg-[#0f2d21] transition-colors">
            {t('common', 'apply')}
          </button>
          <button
            onClick={() => setShowContact(true)}
            className="px-4 py-2.5 text-sm font-medium text-[#1B4332] border border-[#1B4332] rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors"
          >
            {t('common', 'contact')}
          </button>
        </div>
      </div>

      {showContact && (
        <ContactModal
          listingId={job.id}
          listingTitle={`${job.title} @ ${job.company}`}
          listingType="job"
          ownerEmail={job.contactEmail}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
}
