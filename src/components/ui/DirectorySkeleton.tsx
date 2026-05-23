'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { PageLayout, Section } from '../layout/PageLayout';

export function DirectorySkeleton() {
    return (
        <PageLayout>
            <div className="space-y-6">
                {/* Toolbar Skeleton - Matched to p-3, rounded-[32px], and h-11 */}
                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Skeleton className="h-11 flex-1 rounded-2xl" />
                    <Skeleton className="h-11 w-32 rounded-2xl hidden md:block" />
                    <Skeleton className="h-11 w-40 rounded-2xl" />
                </div>

                {/* Table Skeleton Placeholder - Matched to rounded-[40px] */}
                <div className="bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm rounded-[40px] border border-slate-100/50 dark:border-slate-800/30 overflow-hidden shadow-sm p-8">
                    <div className="space-y-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-8">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="h-12 w-12 rounded-[1.25rem]" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4 opacity-50" />
                                    </div>
                                </div>
                                <div className="hidden lg:flex flex-col gap-2 w-32">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                                <div className="hidden md:flex flex-col gap-2 w-32">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
