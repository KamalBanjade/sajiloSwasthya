'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { User, GraduationCap, Briefcase, Award, Star, Activity, Sparkles, Clock, Phone, Globe, ShieldCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

export function ProfileSkeleton() {
    return (
        <PageLayout className="space-y-12 animate-in fade-in duration-700">
            {/* Header Skeleton */}
            <div className="rounded-[4rem] p-12 bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-white/5 shadow-premium flex flex-col lg:flex-row items-center gap-10">
                <Skeleton className="w-48 h-48 rounded-[3rem]" />
                <div className="flex-1 space-y-6 text-center lg:text-left">
                    <div className="space-y-2">
                        <Skeleton className="w-32 h-3 mx-auto lg:mx-0" />
                        <Skeleton className="w-96 h-12 mx-auto lg:mx-0 rounded-2xl" />
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                        <Skeleton className="w-28 h-10 rounded-2xl" />
                        <Skeleton className="w-28 h-10 rounded-2xl" />
                        <Skeleton className="w-28 h-10 rounded-2xl" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── LEFT: Main Content ── */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Biography Skeleton */}
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-12 h-12 rounded-[1.25rem]" />
                            <Skeleton className="w-48 h-4 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-3/4 h-4" />
                        </div>
                    </div>

                    {/* Timeline Skeletons (Education/Experience) */}
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <Skeleton className="w-12 h-12 rounded-[1.25rem]" />
                                <Skeleton className="w-48 h-4 rounded-full" />
                            </div>
                            <div className="space-y-8">
                                {[1, 2].map((j) => (
                                    <div key={j} className="flex gap-5">
                                        <Skeleton className="w-3 h-3 rounded-full mt-1.5 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="w-1/2 h-5" />
                                            <Skeleton className="w-1/3 h-4" />
                                            <Skeleton className="w-full h-16 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Score Skeleton */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <Skeleton className="w-10 h-10 rounded-[1rem]" />
                            <Skeleton className="w-32 h-3" />
                        </div>
                        <div className="flex justify-center py-4">
                            <Skeleton className="w-32 h-32 rounded-full" />
                        </div>
                    </div>

                    {/* Consultation Skeleton */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-2xl bg-white/10" />
                            <div className="space-y-2">
                                <Skeleton className="w-32 h-5 bg-white/10" />
                                <Skeleton className="w-24 h-3 bg-white/10" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-14 rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    </div>

                    {/* Contact Skeleton */}
                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <Skeleton className="w-10 h-10 rounded-[1rem]" />
                            <Skeleton className="w-32 h-3" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-14 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
