'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Timer, XCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

export function AvailabilitySkeleton() {
    return (
        <PageLayout className="space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Schedule Skeleton */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-[1.25rem]" />
                                <div className="space-y-2">
                                    <Skeleton className="w-48 h-4 rounded-full" />
                                    <Skeleton className="w-32 h-3 rounded-full opacity-50" />
                                </div>
                            </div>
                            <Skeleton className="w-24 h-6 rounded-full" />
                        </div>

                        <div className="space-y-10">
                            {/* Form Row Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="w-12 h-3" />
                                        <Skeleton className="w-full h-11 rounded-xl" />
                                    </div>
                                ))}
                            </div>

                            {/* Break Toggle Skeleton */}
                            <div className="flex items-center justify-between p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="w-24 h-3" />
                                        <Skeleton className="w-32 h-2" />
                                    </div>
                                </div>
                                <Skeleton className="w-12 h-6 rounded-full" />
                            </div>

                            {/* Weekly Grid Skeleton */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div key={i} className="p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-2 h-2 rounded-full" />
                                                <Skeleton className="w-20 h-4" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-full h-10 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Absence Skeleton */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-12 h-12 rounded-[1.25rem]" />
                            <div className="space-y-2">
                                <Skeleton className="w-32 h-4" />
                                <Skeleton className="w-24 h-3 opacity-50" />
                            </div>
                        </div>
                        <div className="space-y-5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="w-24 h-3" />
                                    <Skeleton className="w-full h-11 rounded-xl" />
                                </div>
                            ))}
                            <Skeleton className="w-full h-12 rounded-xl mt-2" />
                        </div>
                    </div>

                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-8 h-4 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="w-full h-24 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
