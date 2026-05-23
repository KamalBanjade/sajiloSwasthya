import React from 'react';
import { PageLayout, Section } from '@/components/layout/PageLayout';

export default function Loading() {
    return (
        <PageLayout>
            <Section>
                <div className="space-y-6 animate-pulse">

                    {/* Toolbar Skeleton — mirrors the real toolbar exactly */}
                    <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        {/* Search bar */}
                        <div className="flex-1 w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                        {/* Filters row */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <div className="w-full sm:w-48 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                            <div className="w-full sm:w-48 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                            <div className="w-full sm:w-40 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl" />
                        </div>
                    </div>

                    {/* Table Skeleton — mirrors ResponsiveTable structure */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                            {['w-28', 'w-24', 'w-20', 'w-16', 'w-20', 'w-20'].map((w, i) => (
                                <div key={i} className={`h-3 ${w} bg-slate-200 dark:bg-slate-700 rounded-full`} />
                            ))}
                        </div>

                        {/* Table rows */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 items-center"
                            >
                                {/* Name & Email */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
                                    <div className="flex flex-col gap-1.5">
                                        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                        <div className="h-2.5 w-36 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                    </div>
                                </div>
                                {/* Department */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                </div>
                                {/* Specialization */}
                                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                {/* Status badge */}
                                <div className="flex justify-center">
                                    <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                                </div>
                                {/* Joined date */}
                                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                {/* Actions */}
                                <div className="flex justify-end gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Skeleton */}
                    <div className="flex items-center justify-between px-2">
                        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        <div className="flex gap-2">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30" />
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        </div>
                    </div>

                </div>
            </Section>
        </PageLayout>
    );
}
