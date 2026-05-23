'use client';

import React, { useState, useEffect } from 'react';
import { adminAuditLogsApi, SecurityAlertDTO } from '@/lib/api/adminAuditLogs';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import {
    Shield, RefreshCw, AlertCircle, AlertTriangle,
    Zap, Clock, XCircle, User, Globe,
    CheckCircle, ChevronDown, ChevronUp, ActivitySquare
} from 'lucide-react';
import { SecuritySkeleton } from '@/components/ui/SecuritySkeleton';

const ALERT_META: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
    BRUTE_FORCE: { label: 'Brute Force Attempt', icon: XCircle, colorClass: 'rose' },
    EMERGENCY_OVERUSE: { label: 'Emergency QR Overuse', icon: Zap, colorClass: 'amber' },
    CRITICAL_EVENT: { label: 'Critical System Event', icon: AlertCircle, colorClass: 'rose' },
    OFF_HOURS_ACCESS: { label: 'Off-Hours Access', icon: Clock, colorClass: 'blue' },
};

const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function AlertCard({ alert }: { alert: SecurityAlertDTO }) {
    const [expanded, setExpanded] = useState(false);
    const meta = ALERT_META[alert.alertType] ?? { label: alert.alertType, icon: AlertTriangle, colorClass: 'slate' };
    const Icon = meta.icon;

    const c = meta.colorClass;
    const colorMap: Record<string, string> = {
        rose: 'bg-rose-50  dark:bg-rose-900/20  border-rose-200  dark:border-rose-800  text-rose-700  dark:text-rose-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
        blue: 'bg-blue-50  dark:bg-blue-900/20  border-blue-200  dark:border-blue-800  text-blue-700  dark:text-blue-400',
        slate: 'bg-slate-50 dark:bg-slate-800    border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    };
    const colorCls = colorMap[c] ?? colorMap.slate;

    const severityColors: Record<string, string> = {
        Critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
        High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
        Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl overflow-hidden ${colorCls}`}
        >
            <button
                className="w-full flex items-center gap-4 p-5 text-left"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black">{alert.title}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${severityColors[alert.severity] ?? ''}`}>
                            {alert.severity}
                        </span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{alert.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold opacity-60 hidden sm:block">
                        {formatLocalTime(alert.detectedAt, 'MMM dd, HH:mm')}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-3 border-t border-current/10 pt-4">
                            <p className="text-sm">{alert.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Detected At</span>
                                    <p className="font-bold">{formatLocalTime(alert.detectedAt, 'EEEE, MMM dd yyyy – HH:mm:ss')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Event Count</span>
                                    <p className="font-bold text-xl">{alert.eventCount}</p>
                                </div>
                                {alert.relatedUserName && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Related User
                                        </span>
                                        <p className="font-bold">{alert.relatedUserName}</p>
                                        {alert.relatedUserEmail && <p className="opacity-70">{alert.relatedUserEmail}</p>}
                                    </div>
                                )}
                                {alert.ipAddress && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> IP Address
                                        </span>
                                        <p className="font-mono font-bold">{alert.ipAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// --- Health Score Component ---
function SecurityHealthScore({ alerts }: { alerts: SecurityAlertDTO[] }) {
    const scores = { Critical: 30, High: 15, Medium: 5, Low: 2 };
    const totalDeduction = alerts.reduce((acc, a) => acc + (scores[a.severity as keyof typeof scores] || 0), 0);
    const score = Math.max(0, 100 - totalDeduction);

    let status = { label: 'Optimal', color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };
    if (score < 40) status = { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-500', glow: 'shadow-rose-500/20' };
    else if (score < 70) status = { label: 'Warning', color: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-amber-500/20' };
    else if (score < 90) status = { label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };

    return (
        <Card className="p-8 relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-slate-800/50 mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        <motion.circle
                            initial={{ strokeDasharray: "365 365", strokeDashoffset: 365 }}
                            animate={{ strokeDashoffset: 365 - (365 * score) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                            className={status.color} strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{score}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Score</span>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.bg} animate-pulse ${status.glow}`} />
                        <h2 className={`text-xl font-black uppercase tracking-tight ${status.color}`}>System Health: {status.label}</h2>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
                        {score === 100 ?
                            "System is operating within ideal parameters. No threats or unusual activity patterns detected across the network." :
                            status.label === 'Critical' ?
                                "Multiple critical security events require immediate administrative intervention to prevent potential data breach or system compromise." :
                                "System has recorded some unusual activity patterns. Professional review of the alerts below is recommended."
                        }
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/50">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Alerts</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{alerts.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/50">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Sync</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function SecurityAlertsPage() {
    const [alerts, setAlerts] = useState<SecurityAlertDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const data = await adminAuditLogsApi.getSecurityAlerts();
            setAlerts(data);
        } catch {
            toast.error('Failed to load security alerts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const filtered = alerts
        .filter(a => !filterSeverity || a.severity === filterSeverity)
        .sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99));

    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    alerts.forEach(a => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });

    return (
        <PageLayout>
            {loading ? (
                <SecuritySkeleton />
            ) : (
                <>
                    <SecurityHealthScore alerts={alerts} />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => {
                            const colorMap: Record<string, string> = {
                                Critical: 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400',
                                High: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400',
                                Medium: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
                                Low: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400',
                            };
                            const isActive = filterSeverity === sev;
                            return (
                                <button
                                    key={sev}
                                    onClick={() => setFilterSeverity(isActive ? null : sev)}
                                    className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${colorMap[sev]} ${isActive ? 'ring-4 ring-indigo-500/10 border-indigo-500' : 'border-opacity-30'}`}
                                >
                                    <div className="text-3xl font-black tracking-tighter">{counts[sev]}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">{sev} Alerts</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Alerts List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-2">
                                <ActivitySquare className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Detection Log — {filtered.length} Incident{filtered.length !== 1 ? 's' : ''}
                                    {filterSeverity ? ` · ${filterSeverity}` : ''}
                                </span>
                            </div>
                            {filterSeverity && (
                                <button onClick={() => setFilterSeverity(null)} className="text-xs text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Reset Filter
                                </button>
                            )}
                        </div>

                        {filtered.length === 0 ? (
                            <Card padding="lg" className="bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-slate-800/50">
                                <div className="py-16 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                                            {filterSeverity ? `No ${filterSeverity.toLowerCase()} threats detected` : 'System Architecture Secure'}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            The node monitoring service reports zero anomalies for this period.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((alert, i) => (
                                    <AlertCard key={`${alert.alertType}-${alert.detectedAt}-${i}`} alert={alert} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </PageLayout>
    );
}
