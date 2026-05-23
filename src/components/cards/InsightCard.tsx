'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Text, H2 } from '@/components/ui/Typography';

export interface InsightCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color?: 'primary' | 'emerald' | 'amber' | 'rose';
    gradient?: string;
    isLoading?: boolean;
}

export function InsightCard({ title, value, icon: Icon, color = 'primary', gradient, isLoading }: InsightCardProps) {
    if (isLoading) {
        return (
            <Card padding="md" variant="elevated" className="bg-white dark:bg-slate-900 overflow-hidden">
                <Stack direction="row" align="center" justify="between" spacing="sm">
                    <Stack direction="col" spacing="xs" className="min-w-0 flex-1 gap-1">
                        <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="w-12 h-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                    </Stack>
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </Stack>
            </Card>
        );
    }

    const colorStyles: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10',
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
        rose: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
    };

    const style = colorStyles[color];

    if (gradient) {
        // Patient dashboard style
        return (
            <Card padding="md" variant="elevated" className="group hover:border-primary/30 transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden">
                <Stack direction="row" align="center" justify="between" spacing="sm">
                    <Stack direction="col" spacing="xs" className="min-w-0 flex-1 gap-1">
                        <Text variant="label" className="tracking-widest truncate">{title}</Text>
                        <H2 className="tracking-tighter !text-4xl truncate">{value}</H2>
                    </Stack>
                    <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                </Stack>
            </Card>
        );
    }

    // Doctor dashboard style
        <Card padding="md" className="dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
            <Stack direction="row" align="center" spacing="sm">
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border ${style}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <Stack direction="col" spacing="xs" className="min-w-0 flex-1 gap-1">
                    <Text variant="label" className="truncate">{title}</Text>
                    <H2 className="tracking-tighter !text-2xl truncate">{value}</H2>
                </Stack>
            </Stack>
        </Card>
}
