'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminAuditLogsApi, SystemStatisticsDTO, SecurityAlertDTO } from '@/lib/api/adminAuditLogs';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
    Users, UserCheck, UserCog, Stethoscope,
    FileText, FileCheck, FileClock,
    QrCode, Zap, Shield,
    Calendar, CheckCircle, TrendingUp,
    RefreshCw, AlertTriangle, AlertCircle,
    Activity, Clock, XCircle, Info,
    ChevronRight, Sparkles, Filter, ActivitySquare
} from 'lucide-react';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import { StatisticsSkeleton } from '@/components/ui/StatisticsSkeleton';

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" } })
};

// --- Clean Stat Card ---
function StatCard({ icon: Icon, label, value, sub, color = "slate", delay }: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    sub?: string;
    color?: "indigo" | "teal" | "cyan" | "purple" | "green" | "emerald" | "amber" | "rose" | "slate" | "blue";
    delay: number;
}) {
    const colorMap = {
        indigo: "border-l-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
        teal: "border-l-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10",
        cyan: "border-l-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10",
        purple: "border-l-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
        green: "border-l-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
        emerald: "border-l-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        amber: "border-l-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
        rose: "border-l-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
        slate: "border-l-slate-500 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10",
        blue: "border-l-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
    };

    const cls = colorMap[color] || colorMap.slate;
    const borderCls = cls.split(' ')[0];
    const iconCls = cls.split(' ').slice(1).join(' ');

    return (
        <motion.div
            custom={delay}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 ${borderCls} shadow-sm flex flex-col justify-between`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${iconCls}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            
            <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                {sub && <div className="text-[10px] text-slate-400 mt-1">{sub}</div>}
            </div>
        </motion.div>
    );
}

// --- Clean Section Container ---
function Section({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-5 px-1">
                <Icon className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

export default function StatisticsPage() {
    const router = useRouter();
    const [retaining, setRetaining] = useState(false);

    // 1. Fetch System Statistics
    const { 
        data: stats, 
        isLoading: statsLoading, 
        refetch: refetchStats 
    } = useQuery({
        queryKey: ['admin', 'statistics'],
        queryFn: adminAuditLogsApi.getSystemStatistics,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // 2. Fetch Security Alerts
    const { 
        data: alerts = [], 
        isLoading: alertsLoading, 
        refetch: refetchAlerts 
    } = useQuery({
        queryKey: ['admin', 'security-alerts'],
        queryFn: adminAuditLogsApi.getSecurityAlerts,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    const loading = statsLoading || alertsLoading;

    const fetchAll = useCallback(() => {
        refetchStats();
        refetchAlerts();
    }, [refetchStats, refetchAlerts]);

    const handleApplyRetention = async () => {
        setRetaining(true);
        try {
            const result = await adminAuditLogsApi.applyRetentionPolicy(90);
            toast.success(`Retention applied: ${result.deletedCount} old log entries removed.`);
            fetchAll();
        } catch {
            toast.error('Failed to apply retention policy');
        } finally {
            setRetaining(false);
        }
    };

    if (loading) {
        return (
            <PageLayout>
                <StatisticsSkeleton />
            </PageLayout>
        );
    }

    if (!stats) return null;

    const criticalAlerts = alerts.filter(a => a.severity === 'Critical' || a.severity === 'High');

    return (
        <PageLayout>
            <div className="flex items-center justify-end gap-3 mb-8">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={fetchAll}
                        className="h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleApplyRetention}
                        disabled={retaining}
                        className="h-11 px-4 bg-rose-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <Shield className="w-4 h-4" />
                        {retaining ? 'Applying…' : 'Apply Retention (90d)'}
                    </Button>
                </div>
            </div>

            {/* Critical Alert Ribbon */}
            <AnimatePresence>
                {criticalAlerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-10 overflow-hidden"
                    >
                        <div className="p-6 rounded-[2rem] bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/30 animate-pulse">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">Active Threats Detected</h3>
                                    <p className="text-sm font-medium text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                                        {criticalAlerts.length} high-priority security incidents require immediate review.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/security')}
                                className="px-6 py-3 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                            >
                                Review Alerts
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Core Sections --- */}

            <Section title="Network Population" icon={Users}>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard delay={0} icon={Users} color="indigo" label="Total Actors" value={stats.totalUsers} />
                    <StatCard delay={1} icon={Stethoscope} color="teal" label="Doctors" value={stats.totalDoctors} />
                    <StatCard delay={2} icon={UserCheck} color="cyan" label="Patients" value={stats.totalPatients} />
                    <StatCard delay={3} icon={UserCog} color="purple" label="Admins" value={stats.totalAdmins} />
                    <StatCard delay={4} icon={Activity} color="green" label="Active Users" value={stats.activeUsers} />
                    <StatCard delay={5} icon={TrendingUp} color="amber" label="New This Month" value={stats.newUsersThisMonth} />
                </div>
            </Section>

            <Section title="Cryptographic Vault" icon={FileText}>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard delay={6} icon={FileText} color="indigo" label="Total Uploaded" value={stats.totalRecordsUploaded} />
                    <StatCard delay={7} icon={FileCheck} color="green" label="Certified" value={stats.totalRecordsCertified} />
                    <StatCard delay={8} icon={FileClock} color="amber" label="Pending" value={stats.totalRecordsPending} />
                    <StatCard delay={9} icon={ActivitySquare} color="slate" label="Drafts" value={stats.totalRecordsDraft} />
                    <StatCard delay={10} icon={Zap} color="rose" label="Emergency" value={stats.totalRecordsEmergency} />
                    <StatCard delay={11} icon={TrendingUp} color="teal" label="Uploaded This Month" value={stats.recordsUploadedThisMonth} />
                </div>
            </Section>            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Section title="Access Verification (QR)" icon={QrCode}>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard delay={10} icon={QrCode} color="indigo" label="Total Scans" value={stats.totalQRScans} />
                        <StatCard delay={11} icon={Shield} color="green" label="Normal Scans" value={stats.normalQRScans} />
                        <StatCard delay={12} icon={Zap} color="rose" label="Emergency Scans" value={stats.emergencyQRScans} />
                        <StatCard delay={13} icon={Activity} color="teal" label="Active Sessions" value={stats.activeAccessSessions} />
                    </div>
                </Section>

                <Section title="Clinical Engagements" icon={Calendar}>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard delay={14} icon={Calendar} color="indigo" label="Total Appts" value={stats.totalAppointments} />
                        <StatCard delay={15} icon={CheckCircle} color="green" label="Completed" value={stats.completedAppointments} />
                        <StatCard delay={16} icon={Clock} color="amber" label="Upcoming" value={stats.upcomingAppointments} />
                        <StatCard delay={17} icon={FileText} color="purple" label="Total Audit Logs" value={stats.totalAuditLogs} />
                    </div>
                </Section>
            </div>

            {/* Deep Insight Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                
                {/* 24h Telemetry */}
                <div className="lg:col-span-1 border border-white/60 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-500">
                            <ActivitySquare className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">24h Telemetry</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Critical Exceptions', val: stats.criticalEvents24h, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                            { label: 'Warning Triggers', val: stats.warningEvents24h, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Active Sessions', val: stats.activeAccessSessions, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{item.label}</span>
                                </div>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{item.val}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => router.push('/admin/audit-logs')}
                        className="mt-8 w-full p-4 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        View Raw Feed <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Event Log Console */}
                <div className="lg:col-span-2 border border-white/60 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-rose-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Critical Events</h3>
                        </div>
                        <button
                            onClick={() => router.push('/admin/security')}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                        >
                            Open SecOps Console <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {stats.recentCriticalEvents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-10 opacity-60">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">System state optimal.</p>
                                <p className="text-xs font-medium">No critical exceptions recorded recently.</p>
                            </div>
                        ) : stats.recentCriticalEvents.map((event) => (
                            <div key={event.id} className="group relative p-5 rounded-[1.5rem] bg-white/60 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-start gap-4">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-transparent group-hover:h-8 group-hover:bg-rose-500 transition-all duration-300 rounded-r-md" />
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex-shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">{event.action}</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                                            {formatLocalTime(event.timestamp, 'MMM dd — HH:mm')}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {event.details}
                                    </p>
                                    {event.userName && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg">
                                            <UserCog className="w-3 h-3 text-indigo-500" />
                                            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">{event.userName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}

