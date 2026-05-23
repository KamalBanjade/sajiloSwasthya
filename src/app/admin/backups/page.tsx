'use client';

import React, { useState } from 'react';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { FadeIn } from '@/components/ui/FadeIn';
import {
    Database, HardDrive, Download, UploadCloud,
    History, AlertCircle, CheckCircle2, Server,
    ShieldCheck, Clock, FileJson, Loader2, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';

import { adminApi } from '@/lib/api';
import axiosInstance from '@/lib/utils/axios';

export default function AdminBackupsPage() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const fetchAuditLogs = async () => {
        try {
            setIsLoadingLogs(true);
            const res = await adminApi.getAuditLogs({ action: 'System Backup Downloaded', pageSize: 10 });

            // Map the backend AuditLogs to the table schema
            const mapped = res.data.map((log: any) => ({
                id: log.id.substring(0, 8).toUpperCase(),
                timestamp: log.timestamp,
                action: log.action,
                admin: log.userName || 'Admin System',
                size: 'Variable (JSON)',
                status: log.severityLabel === 'Error' ? 'failed' : 'success'
            }));
            setAuditLogs(mapped);
        } catch (error) {
            console.error("Failed to fetch backup audit logs", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    React.useEffect(() => {
        fetchAuditLogs();
    }, []);

    const handleDownloadSnapshot = async () => {
        setIsDownloading(true);
        try {
            const response = await axiosInstance.get('admin/backups/download', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sajilo_snapshot_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Database snapshot generated and downloaded successfully!");
            // Refresh history table
            setTimeout(fetchAuditLogs, 1500);
        } catch (error) {
            toast.error("Failed to extract system snapshot. Check permissions.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleRestoreClick = () => {
        toast.error("System isolation required: Please ensure all doctors are logged out before attempting a restore.");
    };

    return (
        <PageLayout className="py-8 space-y-8">


            {/* Metrics Dashboard */}
            <FadeIn direction="up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* DB Size */}
                    <div className="bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[32px] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5 rounded-2xl text-emerald-600 border border-emerald-200 dark:border-emerald-500/20">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Current DB Size</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tabular-nums">4.2</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">MB</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-4 flex items-center gap-2 relative">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Status: Lean & Optimized
                        </p>
                    </div>

                    {/* Tigris Storage */}
                    <div className="bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[32px] p-8 relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700 origin-top-right">
                            <Server className="w-36 h-36" />
                        </div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                        <div className="flex items-center justify-between mb-6 relative">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl text-primary border border-primary/20">
                                    <HardDrive className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tigris Limit</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em]">
                                Free Tier
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tabular-nums">0.8</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/ 5.0 GB</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden relative shadow-inner">
                            <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full w-[16%] relative">
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Last Action */}
                    <div className="bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[32px] p-8 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-500">
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-slate-200/50 dark:bg-slate-700/20 blur-3xl rounded-full" />
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl text-slate-500 border border-slate-200 dark:border-slate-700">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Last Snapshot</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-2 relative tracking-tight">
                            {auditLogs.length > 0 ? new Date(auditLogs[0].timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "Never"}
                        </p>
                        <p className="text-xs font-bold text-slate-500 relative flex items-center gap-1.5">
                            By: <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {auditLogs.length > 0 ? auditLogs[0].admin : "N/A"}
                            </span>
                        </p>
                    </div>
                </div>
            </FadeIn>

            {/* Control Panel */}
            <FadeIn direction="up" delay={0.2}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Panel */}
                    <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black border border-slate-200 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl dark:shadow-indigo-500/10 rounded-[40px] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 dark:bg-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-700" />

                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700 rounded-3xl flex items-center justify-center mb-8 relative z-10 shadow-[inset_0_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
                            {isDownloading ? (
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                                <Download className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                            )}
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 relative z-10">
                            Extract Snapshot
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-[280px] mb-10 relative z-10 leading-relaxed">
                            Safely package all relational system metadata into a localized JSON archive.
                        </p>

                        <button
                            onClick={handleDownloadSnapshot}
                            disabled={isDownloading}
                            className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary hover:to-primary text-white font-black text-[11px] uppercase tracking-[0.2em] px-10 py-5 rounded-[20px] shadow-[0_8px_30px_rgb(99,102,241,0.3)] hover:shadow-[0_8px_40px_rgb(99,102,241,0.5)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10 w-full md:w-auto"
                        >
                            {isDownloading ? 'Bundling JSON Data...' : 'Download Database (.json)'}
                        </button>
                    </div>

                    {/* Restore Panel */}
                    <div className="bg-white/40 dark:bg-slate-900/10 backdrop-blur-xl border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-[40px] p-12 flex flex-col items-center justify-center text-center hover:bg-white/80 dark:hover:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-500 cursor-pointer group" onClick={handleRestoreClick}>
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
                            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                            Restore System
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-[280px] mb-10 leading-relaxed">
                            Upload a previously authorized <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono">.json</code> snapshot to rollback relational database state.
                        </p>

                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-[18px] bg-white dark:bg-slate-800 shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                            Click or Drag File Here
                        </span>
                    </div>
                </div>
            </FadeIn>

            {/* Audit History */}
            <Section title="Backup Audit Ledger">
                <div className="bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm rounded-[40px] border border-slate-100/50 dark:border-slate-800/30 overflow-hidden shadow-sm">
                    <ResponsiveTable
                        data={auditLogs}
                        keyExtractor={(h) => h.id}
                        columns={[
                            {
                                header: 'Event ID',
                                className: 'pl-8 py-6',
                                accessor: (h) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                            <FileJson className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{h.id}</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Action',
                                accessor: (h) => (
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{h.action}</p>
                                        <p className="text-xs font-semibold text-slate-400">By {h.admin}</p>
                                    </div>
                                )
                            },
                            {
                                header: 'Timestamp',
                                accessor: (h) => (
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {new Date(h.timestamp).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {new Date(h.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                )
                            },
                            {
                                header: 'Size',
                                accessor: (h) => (
                                    <span className="text-sm font-bold tabular-nums text-slate-600 dark:text-slate-400">{h.size}</span>
                                )
                            },
                            {
                                header: 'Status',
                                className: 'pr-8 text-right flex justify-end',
                                accessor: (h) => (
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 w-max
                                        ${h.status === 'success'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}
                                    >
                                        {h.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        {h.status}
                                    </div>
                                )
                            }
                        ]}
                        renderMobileCard={(h) => (
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                            <FileJson className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{h.id}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max
                                        ${h.status === 'success'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}
                                    >
                                        {h.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        {h.status}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{h.action}</p>
                                    <p className="text-xs font-semibold text-slate-500">By {h.admin}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                            {new Date(h.timestamp).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {new Date(h.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums text-slate-600 dark:text-slate-400">{h.size}</span>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </Section>

        </PageLayout>
    );
}
