'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { User, FileText, Shield, Activity, ArrowRight } from 'lucide-react';
import { AuditLogResponseDTO, AuditSeverity } from '@/lib/api/adminAuditLogs';
import { formatLocalTime } from '@/lib/utils/dateUtils';

type LogType = 'user' | 'record' | 'security' | 'system';

function classifyLog(action: string): LogType {
    const lower = action.toLowerCase();
    if (lower.includes('login') || lower.includes('register') || lower.includes('user')) return 'user';
    if (lower.includes('record') || lower.includes('upload') || lower.includes('certif')) return 'record';
    if (lower.includes('qr') || lower.includes('scan') || lower.includes('access') || lower.includes('emergency')) return 'security';
    return 'system';
}

const typeConfig: Record<LogType, { icon: React.ElementType; bg: string; text: string; label: string }> = {
    user: { icon: User, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'User' },
    record: { icon: FileText, bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Record' },
    security: { icon: Shield, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Security' },
    system: { icon: Activity, bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', label: 'System' },
};

const severityBadge: Record<AuditSeverity, string> = {
    [AuditSeverity.Info]: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    [AuditSeverity.Warning]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    [AuditSeverity.Error]: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    [AuditSeverity.Critical]: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

import { useAuditLogs } from '@/hooks/useAdminQueries';

export function RecentActivityTable() {
    const router = useRouter();

    const { data, isLoading } = useAuditLogs(1);

    const logs = data?.data || [];
    const loading = isLoading;

    return (
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-black/30">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-foreground">Recent Activity</h3>
                    <p className="text-xs text-muted mt-0.5">Latest system events from audit log</p>
                </div>
                <button
                    onClick={() => router.push('/admin/audit-logs')}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-surface-2">
                            {['Type', 'Action', 'User', 'Severity', 'Time'].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-muted uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array(5).fill(0).map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-4 bg-surface-2 rounded w-3/4" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">No activity found.</td>
                            </tr>
                        ) : logs.map((log: AuditLogResponseDTO) => {
                            const type = classifyLog(log.action);
                            const cfg = typeConfig[type];
                            const IconComponent = cfg.icon;
                            return (
                                <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg}`}>
                                            <IconComponent className={`w-3.5 h-3.5 ${cfg.text}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-sm font-semibold text-foreground truncate max-w-[220px]">{log.action}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-xs text-muted">{log.userName ?? log.userEmail ?? '—'}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${severityBadge[log.severity]}`}>
                                            {log.severityLabel}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-muted whitespace-nowrap">
                                        {formatLocalTime(log.timestamp)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
