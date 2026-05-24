'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';
import ContactModal from '@/components/ui/ContactModal';
import { useLanguage } from '@/lib/language-context';

interface JobCardProps {
  job: Job;
  onSave?: () => void;
  isSaved?: boolean;
}

const JOB_COLORS: Record<string, string> = {
  'full-time': 'rgba(0,227,140,0.15)',
  'part-time': 'rgba(0,194,255,0.15)',
  'contract': 'rgba(139,92,246,0.15)',
  'freelance': 'rgba(251,191,36,0.15)',
  'internship': 'rgba(160,174,192,0.15)',
};

const JOB_TEXT: Record<string, string> = {
  'full-time': '#00E38C',
  'part-time': '#00C2FF',
  'contract': '#a78bfa',
  'freelance': '#fbbf24',
  'internship': '#A0AEC0',
};

export default function JobCard({ job, onSave, isSaved = false }: JobCardProps) {
  const [showContact, setShowContact] = useState(false);
  const { t } = useLanguage();

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const jobColor = JOB_COLORS[job.jobType] || JOB_COLORS['internship'];
  const jobTextColor = JOB_TEXT[job.jobType] || JOB_TEXT['internship'];

  return (
    <>
      <div className="group glass-card rounded-2xl p-5 flex flex-col gap-4 border border-white/8 hover:border-[#00E38C]/30">
        <div className="flex items-start justify-between gap-3">
          {/* Company avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-[#050816] font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 15px rgba(0,227,140,0.2)' }}
          >
            {job.company.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-1">{job.title}</h3>
            <p className="text-sm text-white/40 mt-0.5">{job.company}</p>
          </div>
          <button
            onClick={onSave}
            className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isSaved ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
            style={{ background: jobColor, color: jobTextColor, borderColor: jobTextColor + '40' }}>
            {job.jobType}
          </span>
          {job.remote && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20">
              {t('common', 'remote')}
            </span>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/30 border border-white/8">
            {job.category}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-white/60">{job.salary}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{job.city}, {job.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{daysAgo === 0 ? 'Posted today' : `Posted ${daysAgo}d ago`}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button className="flex-1 py-2 text-xs font-bold rounded-xl text-[#050816] transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
            {t('common', 'apply')}
          </button>
          <button
            onClick={() => setShowContact(true)}
            className="px-3 py-2 text-xs font-semibold border border-white/15 rounded-xl text-white/50 hover:text-white hover:border-[#00E38C]/40 transition-all"
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
