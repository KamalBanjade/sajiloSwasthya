'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function StatisticsSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Button Area */}
      <div className="flex items-center justify-end gap-3 mb-8">
        <Skeleton className="h-11 w-28 rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      {/* Ribbon Skeleton */}
      <Skeleton className="h-24 w-full rounded-[2rem] mb-10" />

      {/* Population Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5 px-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Vault Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5 px-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Access & Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="space-y-5">
           <div className="flex items-center gap-3 mb-5 px-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
           <div className="flex items-center gap-3 mb-5 px-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Insight Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <Skeleton className="lg:col-span-1 h-[400px] rounded-[2.5rem]" />
        <Skeleton className="lg:col-span-2 h-[400px] rounded-[2.5rem]" />
      </div>
    </div>
  );
}
