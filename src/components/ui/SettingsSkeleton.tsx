'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldCheck, Palette, Building2 } from 'lucide-react';

export function SettingsSkeleton() {
    return (
        <div className="py-12 space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Security Hub Skeleton */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-5 mb-10">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="w-48 h-6" />
                                <Skeleton className="w-64 h-3" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Two Factor Row Skeleton */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 gap-6">
                                <div className="flex items-center gap-6">
                                    <Skeleton className="w-14 h-14 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="w-48 h-4" />
                                        <Skeleton className="w-64 h-3" />
                                    </div>
                                </div>
                                <Skeleton className="w-32 h-11 rounded-xl" />
                            </div>

                            {/* Password Change Row Skeleton */}
                            <div className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <Skeleton className="w-14 h-14 rounded-2xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="w-48 h-4" />
                                            <Skeleton className="w-64 h-3" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                </div>
                            </div>

                            {/* Devices Section Skeleton */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between px-2">
                                    <Skeleton className="w-48 h-4" />
                                    <Skeleton className="w-24 h-3" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="w-32 h-4" />
                                                    <Skeleton className="w-24 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-4 space-y-10">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                            <div className="flex items-center gap-5 mb-10">
                                <Skeleton className="w-14 h-14 rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="w-32 h-6" />
                                    <Skeleton className="w-48 h-3" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} className="h-14 rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
