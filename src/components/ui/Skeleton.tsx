import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rectangle';
}

export function Skeleton({ className = '', variant = 'rectangle' }: SkeletonProps) {
  const base = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

  const variants = {
    text: 'h-4 rounded-md',
    card: 'h-48 rounded-2xl',
    circle: 'rounded-full',
    rectangle: 'rounded-xl',
  };

  return <div className={`${base} ${variants[variant]} ${className}`} style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Skeleton variant="card" className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-full" />
        <div className="flex gap-2">
          <Skeleton variant="text" className="w-16 h-6 rounded-full" />
          <Skeleton variant="text" className="w-20 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}
