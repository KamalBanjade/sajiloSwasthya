'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function EmergencySkeleton() {
    return (
        <div className="py-10 lg:py-16 space-y-16 pb-40">
            <div className="grid lg:grid-cols-12 gap-10 xl:gap-12">
                {/* ── Left ── Medical Info Skeleton ──────────────────────────────── */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Medical Basics Skeleton */}
                    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-slate-300/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <Skeleton className="h-8 w-48" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 ml-1" />
                                <Skeleton className="h-14 rounded-[1.5rem]" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 ml-1" />
                                <Skeleton className="h-14 rounded-[1.5rem]" />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-40 ml-1" />
                                <Skeleton className="h-40 rounded-[2rem]" />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-40 ml-1" />
                                <Skeleton className="h-40 rounded-[2rem]" />
                            </div>
                        </div>
                    </div>

                    {/* Notes to Responders Skeleton */}
                    <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-rose-900/30">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <Skeleton className="h-8 w-64" />
                        </div>
                        <Skeleton className="h-40 rounded-[2rem]" />
                        <Skeleton className="h-4 w-64 mt-4 ml-1" />
                    </div>
                </div>

                {/* ── Right ── Contact & Controls Skeleton ──────────────────────── */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Emergency Contact Skeleton */}
                    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-slate-300/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <Skeleton className="h-8 w-48" />
                        </div>

                        <div className="space-y-7">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24 ml-1" />
                                    <Skeleton className="h-14 rounded-[1.5rem]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Control Panel Skeleton */}
                    <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-indigo-900/30 space-y-8">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-56" />
                            <Skeleton className="h-4 w-full opacity-60" />
                        </div>

                        <div className="space-y-5">
                            <Skeleton className="h-20 rounded-[2rem]" />
                            <Skeleton className="h-20 rounded-[2rem]" />
                        </div>

                        <div className="space-y-5 pt-4">
                            <Skeleton className="h-16 rounded-2xl" />
                            <Skeleton className="h-16 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
