'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function RecordDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            {/* Action Bar Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 opacity-60" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-32 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>

            {/* Hero Card Skeleton */}
            <Skeleton className="h-48 rounded-[2.5rem]" variant="glass" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                        <Skeleton className="h-8 w-64 mb-6" />
                        <div className="space-y-4">
                            <Skeleton className="h-24 rounded-2xl" />
                            <Skeleton className="h-48 rounded-2xl" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32 ml-2" />
                        <Skeleton className="h-48 rounded-3xl" />
                        <Skeleton className="h-48 rounded-3xl" />
                    </div>
                    <Skeleton className="h-64 rounded-[2.5rem]" variant="glass" />
                </div>
            </div>
        </div>
    );
}
