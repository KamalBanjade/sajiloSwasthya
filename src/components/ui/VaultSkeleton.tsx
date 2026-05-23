'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function VaultSkeleton() {
    return (
        <div className="space-y-8 pb-16">
            {/* Action Bar Skeleton */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-3">
                <Skeleton className="h-12 w-full md:w-48 rounded-xl" />
                <Skeleton className="h-12 w-full md:w-32 rounded-xl" />
            </div>

            {/* Filter Bar Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <Skeleton className="h-4 w-32 opacity-60" />
                <div className="flex flex-1 gap-4">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                </div>
            </div>

            {/* Timeline Sections Skeleton */}
            <div className="space-y-12">
                {/* Urgent Section Skeleton */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-3 w-32 opacity-40" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <Skeleton key={i} className="h-40 rounded-[2rem]" variant="glass" />
                        ))}
                    </div>
                </div>

                {/* Regular Section Skeleton */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 ml-2">
                        <Skeleton className="h-4 w-24 opacity-60" />
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-40 rounded-[2rem]" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
