'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    FileText, CheckCircle, Clock, Calendar,
    ShieldCheck, PlusCircle, ArrowRight,
    Search, Activity, FileStack, AlertCircle,
    TrendingUp, QrCode, Shield, UserCheck, Eye, ArrowUpRight, XCircle,
    Users
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    LineChart, Line,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { usePatientStats } from '@/hooks/usePatientQueries';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { FadeIn } from '@/components/ui/FadeIn';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Typography';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

// ─── Reusable Components ─────────────────────────────────────────────────────

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">{children}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
        </div>
    );
}

function GlassMetricCard({
    icon: Icon, label, value, sub, accentColor, glowColor, change, delay = 0
}: {
    icon: React.ElementType; label: string; value: number | string;
    sub?: string; accentColor: string; glowColor: string;
    change?: { label: string; positive?: boolean }; delay?: number;
}) {
    return (
        <motion.div
            variants={itemVariants}
            transition={{ delay: delay * 0.07 }}
            className={`group relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-4 lg:p-5 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-sm cursor-default`}
        >
            {/* Soft glow */}
            <div className={`absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 blur-2xl ${glowColor}`} />

            {/* Decorative icon watermark */}
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-[0.03] pointer-events-none text-foreground">
                <Icon className="w-20 h-20" />
            </div>

            <div className="relative z-10 flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${accentColor} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-4 h-4" />
                </div>
                {change && (
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${change.positive !== false
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        {change.label}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <div className="text-2xl font-black text-foreground mb-0.5 leading-none">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="text-[9px] font-bold text-muted uppercase tracking-widest">{label}</div>
                {sub && <div className="text-[9px] text-muted/70 mt-1 leading-tight">{sub}</div>}
            </div>
        </motion.div>
    );
}

function CompactMetric({ label, value, sub, icon: Icon, colorClass, highlight = false, bgClass = "", borderClass = "" }: { label: string; value: string | number; sub?: string; icon?: React.ElementType; colorClass: string; highlight?: boolean; bgClass?: string; borderClass?: string }) {
    return (
        <div className={`px-4 py-2.5 rounded-2xl ${bgClass || (highlight ? 'bg-primary/10' : 'bg-white/50 dark:bg-white/5')} ${borderClass || (highlight ? 'border-primary/20' : 'border-slate-200 dark:border-white/5')} border flex items-center gap-3 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 group`}>
            {Icon && (
                <div className={`p-1.5 rounded-lg ${bgClass || (highlight ? 'bg-primary/20' : 'bg-white/10 dark:bg-white/10')} brightness-95`}>
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
            )}
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-foreground leading-none tracking-tighter">{value || 0}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${colorClass} opacity-80`}>{label}</span>
                </div>
                {sub && <p className="text-[7px] font-bold text-muted uppercase tracking-tighter mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SidebarStat({ label, value, sub, highlight = false, colorClass = "" }: { label: string; value: string | number; sub?: string; highlight?: boolean; colorClass?: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className={`text-xl font-black ${colorClass || (highlight ? 'text-primary' : 'text-foreground')}`}>{value}</p>
                {sub && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{sub}</span>}
            </div>
        </div>
    );
}

function ChartPanel({ title, sub, titleClassName = "text-base font-black tracking-tighter uppercase tracking-[0.05em]", subClassName = "text-xs text-muted font-medium mt-1 opacity-60 tracking-tight", sideContent, topContent, bottomContent, children, className = '', glowColor = 'bg-primary/5', dividerColor = "border-slate-200 dark:border-white/5" }: { title: string; sub?: string; titleClassName?: string; subClassName?: string; sideContent?: React.ElementType | React.ReactNode; topContent?: React.ReactNode; bottomContent?: React.ReactNode; children: React.ReactNode; className?: string; glowColor?: string; dividerColor?: string }) {
    return (
        <motion.div variants={itemVariants} className={`group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden ${className}`}>
            <div className={`absolute -inset-px rounded-[2.5rem] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-3xl ${glowColor}`} />
            <div className="relative z-10 h-full flex flex-col">
                <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h3 className={titleClassName}>{title}</h3>
                        {sub && <p className={subClassName}>{sub}</p>}
                    </div>
                </div>

                {topContent && <div className="mb-8">{topContent}</div>}

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {sideContent && (
                        <div className={`lg:col-span-1 flex flex-col gap-8 pt-2 border-r ${dividerColor} pr-10`}>
                            {typeof sideContent === 'function' ? React.createElement(sideContent as React.ElementType) : sideContent}
                        </div>
                    )}
                    <div className={`${sideContent ? 'lg:col-span-2' : 'lg:col-span-3'} flex-1 min-h-[280px] flex flex-col`}>{children}</div>
                </div>

                {bottomContent && (
                    <div className={`mt-8 pt-8 border-t ${dividerColor} flex flex-wrap items-center gap-6`}>
                        {bottomContent}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl backdrop-blur-md z-[100]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {label}
                </p>
                <div className="flex flex-col gap-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{entry.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const PIE_COLORS = ['#005effff', '#00ff5eff', '#ffa200ff', '#ff0000ff', '#8B5CF6'];

// ─── Skeletons ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            {/* Header Section Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </motion.div>
            </div>

            {/* Security Banner Skeleton */}
            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div>
                            <Skeleton className="h-4 w-48 mb-1" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-28 rounded-2xl" />
                </div>
            </motion.div>

            {/* Key Metrics Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        transition={{ delay: i * 0.07 }}
                        className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-4 lg:p-5 h-32"
                    >
                        <Skeleton className="w-8 h-8 rounded-lg mb-3" />
                        <Skeleton className="h-6 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </motion.div>
                ))}
            </div>

            {/* Growth Trend & Distribution Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Trend Chart Panel Skeleton */}
                <motion.div variants={itemVariants} className="lg:col-span-2 relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden h-[500px]">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-8" />
                    <div className="flex flex-wrap gap-2.5 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-40 rounded-2xl" />
                        ))}
                    </div>
                    <Skeleton className="flex-1 min-h-[200px] rounded-[2.5rem]" />
                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-6">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-12 w-64 rounded-2xl ml-auto" />
                    </div>
                </motion.div>

                {/* Distribution Chart Panel Skeleton */}
                <motion.div variants={itemVariants} className="lg:col-span-1 relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden h-[500px]">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-8" />
                    <Skeleton className="flex-1 min-h-[200px] rounded-[2.5rem]" />
                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12 ml-auto" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── Dashboard Component ─────────────────────────────────────────────────────

export default function PatientDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: stats, isLoading } = usePatientStats();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        const name = stats?.firstName || user?.firstName || 'Patient';
        if (hour < 12) return `Good Morning, ${name}`;
        if (hour < 17) return `Good Afternoon, ${name}`;
        return `Good Evening, ${name}`;
    }, [stats?.firstName, user?.firstName]);

    if (isLoading) {
        return (
            <PageLayout>
                <DashboardSkeleton />
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[150px]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 pb-12"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Patient Intelligence</span>
                        </motion.div>
                        <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                            {greeting}
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-sm text-muted font-medium mt-1">
                            {format(new Date(), 'EEEE, MMMM do yyyy')}
                        </motion.p>
                    </div>
                </div>

                {/* Setup Reminder Banner */}
                {user && !user.totpSetupCompleted && (
                    <FadeIn direction="down" delay={0.1}>
                        <Card className="bg-amber-50 border-l-4 border-amber-400 p-4 md:p-6 rounded-2xl shadow-sm dark:bg-amber-900/10">
                            <Stack direction={{ base: 'col', md: 'row' } as any} align={{ base: 'start', md: 'center' } as any} spacing="md">
                                <Stack direction="row" align="center" spacing="md" className="flex-1">
                                    <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <Stack direction="col" spacing="xs" className="gap-0.5">
                                        <Text variant="label" className="text-amber-800 dark:text-amber-500 opacity-80">Security Setup Incomplete</Text>
                                        <Text className="text-amber-700 dark:text-amber-600 font-bold text-sm leading-tight">
                                            Complete two-factor authentication to secure your health data.
                                        </Text>
                                    </Stack>
                                </Stack>
                                <Button
                                    variant="primary"
                                    onClick={() => router.push('/complete-setup')}
                                    className="w-full md:w-auto bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20"
                                >
                                    Complete Setup Now
                                </Button>
                            </Stack>
                        </Card>
                    </FadeIn>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <GlassMetricCard
                        delay={1}
                        icon={FileStack}
                        label="Total Records"
                        value={stats?.totalRecords || 0}
                        accentColor="bg-blue-600"
                        glowColor="bg-blue-500/20"
                    />
                    <GlassMetricCard
                        delay={2}
                        icon={CheckCircle}
                        label="Certified"
                        value={stats?.certifiedRecords || 0}
                        accentColor="bg-emerald-600"
                        glowColor="bg-emerald-500/20"
                        sub="Verified by MD"
                    />
                    <GlassMetricCard
                        delay={3}
                        icon={ShieldCheck}
                        label="Trusted Devices"
                        value={stats?.trustedDevicesCount || 0}
                        accentColor="bg-slate-700"
                        glowColor="bg-slate-500/20"
                        sub="Verified access"
                    />
                    <GlassMetricCard
                        delay={4}
                        icon={Calendar}
                        label="Appointments"
                        value={stats?.upcomingAppointments || 0}
                        accentColor="bg-indigo-600"
                        glowColor="bg-indigo-500/20"
                        sub="Scheduled sessions"
                    />
                </div>

                {/* Growth Trend & Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartPanel
                        title="Growth Trends"
                        sub={stats?.recordGrowthTrend?.[0]?.resolution ? `Resolution: ${stats.recordGrowthTrend[0].resolution}` : "Repository Medical Records Growth"}
                        className="lg:col-span-2 min-h-[500px]"
                        topContent={
                            <div className="flex flex-wrap gap-2.5 mb-8">
                                <CompactMetric
                                    icon={FileStack} label="System Records" value={stats?.totalRecords || 0}
                                    sub="Total Tracked" colorClass="text-blue-500" bgClass="bg-blue-500/10" borderClass="border-blue-500/20" highlight
                                />
                                <CompactMetric
                                    icon={CheckCircle} label="Certified" value={stats?.certifiedRecords || 0}
                                    sub="Verified Data" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/20"
                                />
                                <CompactMetric
                                    icon={Clock} label="Pending" value={stats?.pendingRecords || 0}
                                    sub="Waiting Review" colorClass="text-amber-500" bgClass="bg-amber-500/10" borderClass="border-amber-500/20"
                                />
                                <CompactMetric
                                    icon={Activity} label="Archived" value={(stats?.totalRecords || 0) - ((stats?.certifiedRecords || 0) + (stats?.pendingRecords || 0))}
                                    sub="Historical Ref" colorClass="text-slate-500" bgClass="bg-slate-500/10" borderClass="border-slate-500/20"
                                />
                            </div>
                        }
                        bottomContent={
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Certified</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-tight">Verified Practice Intelligence</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 rounded-full bg-amber-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Pipeline</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-tight">Incoming Record Volume</p>
                                    </div>
                                </div>
                                <div className="flex-1" />
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Synced</span>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-primary/10 dark:bg-white text-primary dark:text-slate-900 rounded-2xl hover:scale-105 transition-all shadow-xl backdrop-blur-md border border-primary/20 font-black text-sm">
                                        <Activity className="w-5 h-5 text-primary" />
                                        <span>Daily Tactical Intelligence</span>
                                    </button>
                                </div>
                            </>
                        }
                        glowColor="bg-blue-500/10"
                    >
                        <div className="flex-1 min-h-[200px] relative group/chart mt-4 flex flex-col">
                            <div className="absolute inset-0 bg-slate-50/50 dark:bg-black/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 backdrop-blur-[2px] pointer-events-none" />
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.recordGrowthTrend || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradCert" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                                        <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="4" /><feOffset dx="0" dy="0" result="offsetblur" /><feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.15} />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                        dy={12}
                                        minTickGap={25}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                        dx={-10}
                                        domain={[0, 'auto']}
                                        tickCount={5}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="certified" 
                                        stroke="#10B981" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#gradCert)" 
                                        name="Certified" 
                                        animationDuration={2500} 
                                        filter="url(#areaGlow)"
                                        dot={(props: any) => {
                                            const { cx, cy, payload, index } = props;
                                            const data = stats?.recordGrowthTrend || [];
                                            const isEnd = index === data.length - 1;
                                            const hasChanged = index > 0 && payload.certified !== data[index - 1].certified;
                                            if (isEnd || hasChanged) {
                                                return <circle cx={cx} cy={cy} r={4} fill="#10B981" stroke="#fff" strokeWidth={2} key={`dot-cert-${index}`} />;
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="pending" 
                                        stroke="#F59E0B" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#gradAmber)" 
                                        name="Pending" 
                                        animationDuration={2000} 
                                        dot={(props: any) => {
                                            const { cx, cy, payload, index } = props;
                                            const data = stats?.recordGrowthTrend || [];
                                            const isEnd = index === data.length - 1;
                                            const hasChanged = index > 0 && payload.pending !== data[index - 1].pending;
                                            if (isEnd || hasChanged) {
                                                return <circle cx={cx} cy={cy} r={3} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} key={`dot-pend-${index}`} />;
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="emergency" 
                                        stroke="#6366F1" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#gradIndigo)" 
                                        name="Emergency" 
                                        animationDuration={1500} 
                                        dot={(props: any) => {
                                            const { cx, cy, payload, index } = props;
                                            const data = stats?.recordGrowthTrend || [];
                                            const isEnd = index === data.length - 1;
                                            const hasChanged = index > 0 && payload.emergency !== data[index - 1].emergency;
                                            if (isEnd || hasChanged) {
                                                return <circle cx={cx} cy={cy} r={3} fill="#6366F1" stroke="#fff" strokeWidth={1.5} key={`dot-emerg-${index}`} />;
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 6" fill="url(#gradTotal)" name="Pipeline" animationDuration={3000} strokeOpacity={0.6} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartPanel>

                    <ChartPanel
                        title="Content Distribution"
                        sub="Categorization of your stored data"
                        className="lg:col-span-1"
                        bottomContent={
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 w-full">
                                {(stats?.recordTypeDistribution || []).map((item, i) => (
                                    <div key={i} className="flex flex-col gap-1 group/item">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-[3px] shadow-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[11px] font-medium text-muted/80 uppercase tracking-widest group-hover/item:text-foreground transition-colors truncate">{item.label}</span>
                                        </div>
                                        <div className="pl-[20px]">
                                            <span className="text-[13px] font-bold text-foreground">
                                                {Math.round((item.value / (stats?.totalRecords || 1)) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    >
                        <div className="h-full w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.recordTypeDistribution || []}
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {(stats?.recordTypeDistribution || []).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                className="hover:scale-[1.03] origin-center transition-transform duration-200 cursor-pointer outline-none"
                                                style={{
                                                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
                                                        <p className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-widest mb-1">{payload[0]?.name}</p>
                                                        <p className="text-xl font-black text-primary">{payload[0]?.value} Records</p>
                                                        <p className="text-[9px] font-bold text-muted uppercase mt-1">
                                                            {Math.round((Number(payload[0]?.value || 0) / (stats?.totalRecords || 1)) * 100)}% OF TOTAL
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-1px]">
                                <p className="text-[42px] font-bold text-foreground tracking-tighter leading-none">{stats?.totalRecords || 0}</p>
                                <p className="text-[13px] font-medium text-muted tracking-tight mt-1">Total Files</p>
                            </div>
                        </div>
                    </ChartPanel>
                </div>

                {/* Appointment Status & Security Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartPanel
                        title="Appointment Distribution"
                        sub="Weekly performance analytics • 30 Days Analytics Window"
                        className="lg:col-span-2"
                        sideContent={
                            <div className="space-y-8">
                                <SidebarStat label="Aggregate View" value={(stats?.appointmentStatusDistribution || []).reduce((a, b) => a + b.value, 0)} sub="30D" highlight />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                            <Calendar className="w-3 h-3" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Up Next</p>
                                            <p className="text-[10px] font-black text-foreground">
                                                {(stats?.appointmentStatusDistribution || []).find(x => x.label === 'Confirmed')?.value || 0} Confirmed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Completed</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button className="flex-1 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl font-bold text-[10px] hover:bg-primary/20 dark:hover:bg-primary/30 transition-all border border-primary/20 backdrop-blur-md">
                                                    View Progress
                                                </button>
                                                <button className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5">
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                                            <AlertCircle className="w-3 h-3" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Action Required</p>
                                            <p className="text-[10px] font-black text-foreground">
                                                {(stats?.appointmentStatusDistribution || []).find(x => x.label === 'Overdue')?.value || 0} Overdue
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <div className="h-[280px] w-full p-4 rounded-[2rem] bg-slate-50/50 dark:bg-[#020617]/30 border border-slate-200 dark:border-white/5">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(stats?.appointmentStatusDistribution || []).map(d => ({ ...d, label: d.label === 'Cancelled' ? 'Terminated' : d.label }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.15} />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                        dx={-10}
                                        tickCount={5}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '10px', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                        {(stats?.appointmentStatusDistribution || []).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.label === 'Completed' ? '#10B981' :
                                                        entry.label === 'Cancelled' ? '#EF4444' :
                                                            entry.label === 'Overdue' ? '#F43F5E' :
                                                                entry.label === 'InProgress' ? '#6366F1' :
                                                                    entry.label === 'Confirmed' ? '#0EA5E9' :
                                                                        '#3B82F6'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartPanel>

                    <ChartPanel
                        title="Sharing & Security Health"
                        sub="Consent & access monitoring"
                        className="lg:col-span-1"
                    >
                        <div className="flex flex-col h-full justify-between">

                            {/* Top Stats Row */}
                            <div className="flex items-center gap-10 mb-6">

                                {/* Access Status */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted">
                                            Access Status
                                        </p>
                                        <p className={`text-lg font-extrabold ${stats?.totpEnabled ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                            {stats?.totpEnabled ? "Secured" : "Risk"}
                                        </p>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Users className="w-5 h-5" />
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted">
                                            Active Sessions
                                        </p>
                                        <p className="text-lg font-extrabold text-foreground">
                                            {stats?.activeShareCount || 0}
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Two-Factor Auth */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#020617]/30 border border-white/5 mb-4">

                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/15 text-primary">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>

                                    <p className="text-sm font-semibold text-foreground">
                                        Two-Factor Auth
                                    </p>
                                </div>

                                <span className={`text-xs font-bold ${stats?.totpEnabled ? "text-emerald-400" : "text-rose-400"
                                    }`}>
                                    {stats?.totpEnabled ? "Enabled" : "Disabled"}
                                </span>

                            </div>

                            {/* Privacy */}
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                                    Privacy
                                </h4>

                                <p className="text-xs text-muted leading-relaxed">
                                    AES-256 encryption active.{" "}
                                    <span className="text-foreground font-semibold">
                                        {stats?.trustedDevicesCount || 0}
                                    </span>{" "}
                                    trusted devices can bypass 2FA.
                                </p>
                            </div>

                            {/* Revoke Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/security/privacy")}
                                className="w-full text-[10px] font-bold uppercase tracking-widest"
                            >
                                Revoke All
                            </Button>

                        </div>
                    </ChartPanel>
                </div>

                {/* QR Access Activity Line Chart */}
                <div className="grid grid-cols-1 gap-6">
                    <ChartPanel
                        title="Profile Access Analytics"
                        sub="Transparency in how your data is accessed (Last 7 Days)"
                        sideContent={
                            <div className="space-y-6">
                                <SidebarStat label="Emergency scans" value={stats?.totalEmergencyScans || 0} highlight colorClass="bg-rose-500/10 text-rose-500" />
                                <SidebarStat label="Standard scans" value={stats?.totalNormalScans || 0} colorClass="bg-emerald-500/10 text-emerald-500" />
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase">System Synced</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="flex items-center gap-2 text-indigo-500 mb-1">
                                        <Activity className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">Tactical Intel</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-muted leading-tight">Emergency scans bypass 2FA for rapid triage.</p>
                                </div>
                            </div>
                        }
                        className="lg:col-span-3"
                    >
                        <div className="h-[250px] w-full p-6 rounded-[2rem] bg-slate-50/50 dark:bg-[#020617]/30 border border-slate-200 dark:border-white/5">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.scanTrend || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.05} vertical={false} />
                                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} tickCount={5} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }} />
                                    <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={4} dot={{ r: 6, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 8 }} name="Emergency Access" animationDuration={2000} />
                                    <Line type="monotone" dataKey="value2" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }} name="Authorized View" animationDuration={1800} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                        <Activity className="w-2 h-2 text-rose-500" />
                                    </div>
                                    <span className="text-[10px] text-muted font-bold uppercase tracking-tight">Emergency</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Eye className="w-2 h-2 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] text-muted font-bold uppercase tracking-tight">Standard</span>
                                </div>
                            </div>
                        </div>
                    </ChartPanel>
                </div>
            </motion.div>
        </PageLayout>
    );
}
