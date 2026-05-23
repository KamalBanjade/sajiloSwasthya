import React from 'react';

export default function Loading() {
  return (
    <div className="w-full h-full space-y-6 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="flex flex-col lg:row items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="w-full lg:w-48 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="w-full lg:w-48 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="w-full lg:w-40 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
