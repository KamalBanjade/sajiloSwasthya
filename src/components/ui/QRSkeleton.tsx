'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function QRSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Action Bar Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-3">
                <Skeleton className="h-11 w-40 rounded-xl" />
                <Skeleton className="h-11 w-40 rounded-xl" />
            </div>

            {/* Featured Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-3 w-48 opacity-40" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <Skeleton className="shrink-0 w-[212px] h-[212px] rounded-[2rem]" />
                            <div className="flex-1 space-y-4 w-full">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-12 rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 rounded-lg" />
                                    <Skeleton className="h-10 rounded-lg" />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Skeleton className="h-9 w-20 rounded-xl" />
                                    <Skeleton className="h-9 w-20 rounded-xl" />
                                    <Skeleton className="h-9 w-20 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* History Table Skeleton */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-lg" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <Skeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="p-8 space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
