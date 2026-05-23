'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartCard } from './ChartCard';

interface AuditLogsBarChartProps {
    critical: number;
    warning: number;
    totalLogs: number;
}

export function AuditLogsBarChart({ critical, warning, totalLogs }: AuditLogsBarChartProps) {
    const data = [
        { label: 'Total Logs', value: totalLogs, color: '#3B82F6' },
        { label: 'Warnings (24h)', value: warning, color: '#F59E0B' },
        { label: 'Critical (24h)', value: critical, color: '#EF4444' },
    ];

    const tooltipStyle = {
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        fontSize: '12px',
    };

    return (
        <ChartCard title="Audit Activity" subtitle="System event log breakdown">
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="label" stroke="var(--muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: 'var(--foreground)' }}
                        cursor={{ fill: 'var(--surface-2)' }}
                    />
                    <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
