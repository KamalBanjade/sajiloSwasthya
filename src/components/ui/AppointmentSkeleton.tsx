'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export function AppointmentSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} padding="md" className="overflow-hidden relative">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />

                    <div className="flex flex-col md:flex-row items-center gap-5">
                        {/* Time block */}
                        <div className="w-full md:w-24 shrink-0 py-3 px-2 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 ml-3">
                            <Skeleton className="h-7 w-16 rounded-full" />
                            <Skeleton className="h-2.5 w-8 rounded-full" />
                            <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                            <Skeleton className="h-2.5 w-12 rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-4 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-5 w-2/3 rounded-lg" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-4 w-32 rounded-full" />
                                <Skeleton className="h-5 w-16 rounded-lg" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0">
                            <Skeleton className="h-10 w-36 rounded-xl" />
                            <Skeleton className="h-10 w-36 rounded-xl" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
