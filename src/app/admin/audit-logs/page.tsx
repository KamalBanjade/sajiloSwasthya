'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { adminAuditLogsApi, AuditLogResponseDTO, AuditSeverity, AuditLogFilters } from '@/lib/api/adminAuditLogs';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
    Search,
    RefreshCw,
    Download,
    Fingerprint,
    Filter,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Calendar,
    Clock,
    Globe,
    Smartphone,
    AlertCircle,
    AlertTriangle,
    Info,
    XCircle
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

export default function AuditLogsPage() {
    const [selectedLog, setSelectedLog] = useState<AuditLogResponseDTO | null>(null);
    const [exporting, setExporting] = useState(false);

    // Filter states
    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 1,
        pageSize: 15,
        searchTerm: '',
        severity: undefined,
        fromDate: '',
        toDate: ''
    });

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => adminAuditLogsApi.getAuditLogs(filters),
        placeholderData: (previousData) => previousData,
        staleTime: 30000, // 30 seconds
    });

    // Listen for Escape key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedLog(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const logs = data?.logs || [];
    const pagination = {
        totalCount: data?.totalCount || 0,
        totalPages: data?.totalPages || 0,
        page: data?.page || 1,
        pageSize: data?.pageSize || 15
    };

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const blob = await adminAuditLogsApi.exportLogs({
                searchTerm: filters.searchTerm,
                action: filters.action,
                fromDate: filters.fromDate,
                toDate: filters.toDate
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Audit logs exported successfully');
        } catch {
            toast.error('Failed to export logs');
        } finally {
            setExporting(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(f => ({ ...f, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            pageSize: 15,
            searchTerm: '',
            severity: undefined,
            fromDate: '',
            toDate: ''
        });
    };

    const getSeverityStyles = (severity: AuditSeverity) => {
        switch (severity) {
            case AuditSeverity.Critical:
                return {
                    bg: 'bg-rose-100 dark:bg-rose-900/30',
                    text: 'text-rose-700 dark:text-rose-400',
                    border: 'border-rose-200 dark:border-rose-800/50',
                    icon: XCircle
                };
            case AuditSeverity.Error:
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-700 dark:text-orange-400',
                    border: 'border-orange-200 dark:border-orange-800/50',
                    icon: AlertTriangle
                };
            case AuditSeverity.Warning:
                return {
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-700 dark:text-amber-400',
                    border: 'border-amber-200 dark:border-amber-800/50',
                    icon: AlertTriangle
                };
            default:
                return {
                    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    text: 'text-emerald-700 dark:text-emerald-400',
                    border: 'border-emerald-200 dark:border-emerald-800/50',
                    icon: Info
                };
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <PageLayout>
            <div className="space-y-6">
                {/* Horizontal Filter Bar */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] p-4 lg:p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-1 space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Severity Filters</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Critical', val: AuditSeverity.Critical, color: 'hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30' },
                                    { label: 'Error', val: AuditSeverity.Error, color: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30' },
                                    { label: 'Warning', val: AuditSeverity.Warning, color: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30' },
                                    { label: 'Info', val: AuditSeverity.Info, color: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30' },
                                ].map((s) => (
                                    <button
                                        key={s.label}
                                        type="button"
                                        onClick={() => setFilters(f => ({ ...f, severity: f.severity === s.val ? undefined : s.val, page: 1 }))}
                                        className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-2 ${filters.severity === s.val 
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
                                            : `bg-white dark:bg-slate-800/50 ${s.color} border-slate-100 dark:border-slate-700`}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${filters.severity === s.val ? 'bg-current' : 'bg-current opacity-40'}`} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-px h-10 bg-slate-100 dark:bg-slate-800 hidden lg:block" />

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Date Range</label>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-full text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all w-44"
                                        value={filters.fromDate}
                                        onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value, page: 1 }))}
                                    />
                                </div>
                                <div className="w-2 h-px bg-slate-300 dark:bg-slate-600" />
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-full text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all w-44"
                                        value={filters.toDate}
                                        onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value, page: 1 }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end lg:pb-1">
                            <button 
                                onClick={resetFilters} 
                                className="px-4 py-2.5 rounded-full text-xs font-black text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all uppercase tracking-widest flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Main Table Content */}
                <Section className="p-0 overflow-hidden shadow-2xl shadow-indigo-100/50 dark:shadow-none border-none rounded-[2.5rem]">
                    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md">
                        <ResponsiveTable
                            loading={loading}
                            data={logs}
                            keyExtractor={(log) => log.id}
                            emptyState={
                                <div className="max-w-xs mx-auto py-32 text-center space-y-6">
                                    <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-200">
                                        <Filter className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Text variant="body" className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-[10px]">No Matching Records</Text>
                                        <Text variant="body" className="text-slate-400 text-xs font-medium">Try adjusting your filters or search term to see more logs.</Text>
                                    </div>
                                    <Button onClick={resetFilters} variant="outline" className="rounded-2xl font-black text-[10px] uppercase tracking-widest px-8">Clear all filters</Button>
                                </div>
                            }
                            columns={[
                                {
                                    header: 'Event Timeline',
                                    accessor: (log) => (
                                        <Stack spacing="xs">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getSeverityStyles(log.severity).text.split(' ')[0]} animate-pulse`} />
                                                <Text className="text-sm font-black text-slate-900 dark:text-white">{formatLocalTime(log.timestamp, 'MMM dd, yyyy')}</Text>
                                            </div>
                                            <Text className="text-[10px] font-bold text-slate-400 ml-4 uppercase tracking-widest">{formatLocalTime(log.timestamp, 'HH:mm:ss')}</Text>
                                        </Stack>
                                    )
                                },
                                {
                                    header: 'Identity',
                                    accessor: (log) => (
                                        <Stack direction="row" align="center" spacing="md">
                                            <div className={`w-11 h-11 rounded-[1.2rem] ${log.userName === 'System' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-900/50 text-slate-500'} flex items-center justify-center font-black text-[10px] transition-all hover:scale-110 active:scale-95 border border-white/50 dark:border-slate-700/50`}>
                                                {log.userName?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <Stack spacing="xs">
                                                <Text className="text-sm font-black text-slate-900 dark:text-white leading-tight">{log.userName || 'Anonymous'}</Text>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Fingerprint className="w-3 h-3" />
                                                    <Text className="text-[10px] font-black lowercase tracking-wide">{log.userEmail || 'system.core'}</Text>
                                                </div>
                                            </Stack>
                                        </Stack>
                                    )
                                },
                                {
                                    header: 'Operation',
                                    accessor: (log) => (
                                        <Stack spacing="xs">
                                            <Text className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">{log.action}</Text>
                                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">Action Logic Trace</Text>
                                        </Stack>
                                    )
                                },
                                {
                                    header: 'Criticality',
                                    className: 'text-center',
                                    accessor: (log) => {
                                        const sev = getSeverityStyles(log.severity);
                                        const SevIcon = sev.icon;
                                        return (
                                            <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border-2 transition-all hover:scale-105 ${sev.bg} ${sev.text} ${sev.border} shadow-sm`}>
                                                <SevIcon className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">{log.severityLabel}</span>
                                            </div>
                                        );
                                    }
                                },
                                {
                                    header: 'Details',
                                    className: 'text-right',
                                    accessor: (log) => (
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="group relative p-3 bg-white dark:bg-slate-800/80 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg active:scale-95"
                                        >
                                            <Eye className="w-5 h-5 transition-transform group-hover:scale-110" />
                                        </button>
                                    )
                                }
                            ]}
                            renderMobileCard={(log) => (
                                <div className="p-6 space-y-5 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 mb-4 mx-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${log.userName === 'System' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-black text-xs`}>
                                                {log.userName?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <Stack spacing="xs">
                                                <Text className="text-sm font-black text-slate-900 dark:text-white">{log.userName}</Text>
                                                <Text className="text-[10px] font-bold text-slate-400">{formatLocalTime(log.timestamp, 'MMM dd, HH:mm')}</Text>
                                            </Stack>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full border ${getSeverityStyles(log.severity).bg} ${getSeverityStyles(log.severity).text} ${getSeverityStyles(log.severity).border} text-[9px] font-black uppercase`}>
                                            {log.severityLabel}
                                        </div>
                                    </div>
                                    <Stack spacing="xs">
                                        <Text className="text-sm font-black text-indigo-600">{log.action}</Text>
                                        <Text className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{log.details}</Text>
                                    </Stack>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedLog(log)}
                                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-100 dark:border-slate-700"
                                    >
                                        Inspect Technical Trace
                                    </Button>
                                </div>
                            )}
                        />

                        <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100/50 dark:border-slate-800/50">
                            <div className="flex items-center space-x-4">
                                <Text variant="label" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per view</Text>
                                <div className="relative group">
                                    <select
                                        className="appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-6 py-2 rounded-full text-[11px] font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer pr-10"
                                        value={filters.pageSize}
                                        onChange={(e) => setFilters(f => ({ ...f, pageSize: Number(e.target.value), page: 1 }))}
                                    >
                                        {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Filter className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>

                            <Stack direction="row" align="center" spacing="xl">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    Page <span className="text-indigo-600 dark:text-indigo-400 text-sm">{pagination.page}</span> 
                                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                                    Total <span className="text-slate-900 dark:text-white text-sm">{pagination.totalPages || 1}</span>
                                </div>
                                <Stack direction="row" spacing="md">
                                    <Button
                                        disabled={pagination.page <= 1}
                                        variant="ghost"
                                        onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
                                        className="h-11 w-11 p-0 border border-slate-100 dark:border-slate-800 rounded-2xl disabled:opacity-30 hover:bg-white hover:shadow-lg transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </Button>
                                    <Button
                                        disabled={pagination.page >= pagination.totalPages}
                                        variant="ghost"
                                        onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                                        className="h-11 w-11 p-0 border border-slate-100 dark:border-slate-800 rounded-2xl disabled:opacity-30 hover:bg-white hover:shadow-lg transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    </Button>
                                </Stack>
                            </Stack>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Review Modal - Redesigned for Premium Look */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ x: '100%', filter: 'blur(10px)' }}
                            animate={{ x: 0, filter: 'blur(0px)' }}
                            exit={{ x: '100%', filter: 'blur(10px)' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="relative w-full max-w-2xl bg-slate-50 dark:bg-[#0c0e12] shadow-[-20px_0_80px_rgba(0,0,0,0.3)] h-full overflow-hidden flex flex-col"
                        >
                            {/* Slide-over Premium Header */}
                            <div className="relative p-8 pb-10 overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute bottom-[-10%] left-[-5%] w-[150px] h-[150px] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                                
                                <div className="relative z-10 flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center">
                                            <Fingerprint className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Record Inspector</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-2">Log Reference: {selectedLog.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedLog(null)} 
                                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl shadow-sm transition-all active:scale-90"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                {/* Dynamic Status Banner */}
                                <div className={`p-1.5 rounded-[1.5rem] bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex items-center gap-4 transition-all`}>
                                    <div className={`h-12 px-6 rounded-[1.2rem] flex items-center gap-3 ${getSeverityStyles(selectedLog.severity).bg} ${getSeverityStyles(selectedLog.severity).text} border ${getSeverityStyles(selectedLog.severity).border}`}>
                                        {React.createElement(getSeverityStyles(selectedLog.severity).icon, { className: "w-5 h-5" })}
                                        <span className="text-xs font-black uppercase tracking-[0.15em]">{selectedLog.severityLabel} Level</span>
                                    </div>
                                    <div className="flex-1 pr-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation Context</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate">{selectedLog.action}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-8 scrollbar-hide">
                                {/* Metadata Clusters */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Occurred On</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{formatLocalTime(selectedLog.timestamp, 'MMMM dd, yyyy')}</p>
                                        <p className="text-[11px] font-bold text-slate-400 mt-1">{formatLocalTime(selectedLog.timestamp, 'EEEE')}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Precise Time</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{formatLocalTime(selectedLog.timestamp, 'HH:mm:ss')}</p>
                                        <p className="text-[11px] font-bold text-slate-400 mt-1">{formatLocalTime(selectedLog.timestamp, 'SSS')} Milliseconds</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                        Identity & Source
                                    </h4>
                                    
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1 space-y-1.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">User Context</span>
                                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                    {selectedLog.userName?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">{selectedLog.userName}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 truncate tracking-tight">{selectedLog.userEmail || 'system.internal'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Interface</span>
                                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                    <Globe className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">{selectedLog.ipAddress}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Network Identity</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Agent</span>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                            <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 italic break-all">
                                                {selectedLog.userAgent}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                        Data Payload
                                    </h4>
                                    
                                    <div className="group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-blue-500/0 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                        <div className="relative bg-[#1a1c23] dark:bg-black p-8 rounded-[2rem] shadow-2xl overflow-hidden border border-white/5">
                                            {/* Code-style accents */}
                                            <div className="flex items-center gap-2 mb-6 opacity-30">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                <div className="flex-1" />
                                                <span className="text-[8px] font-black uppercase text-white tracking-widest">Structured Activity Data</span>
                                            </div>
                                            
                                            <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap leading-relaxed break-words max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {selectedLog.details}
                                            </pre>
                                            
                                            {/* Interactive background effect */}
                                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.entityType && (
                                    <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30">
                                        <div className="w-10 h-10 bg-white dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shadow-md">
                                            <RefreshCw className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[8px] font-black text-indigo-400 dark:text-indigo-600 uppercase tracking-widest">Entity</span>
                                                <p className="font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase">{selectedLog.entityType}</p>
                                            </div>
                                            <p className="font-mono text-[10px] text-indigo-600/70 dark:text-indigo-400/70 truncate mt-0.5">Ref: {selectedLog.entityId}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Shadow */}
                            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 dark:from-[#0c0e12] to-transparent pointer-events-none" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageLayout>
    );
}
