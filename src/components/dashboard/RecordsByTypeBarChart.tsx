'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartCard } from './ChartCard';

const data = [
    { status: 'Certified', count: 10, color: '#00A388' },
    { status: 'Pending', count: 1, color: '#F59E0B' },
    { status: 'Draft', count: 1, color: '#64748B' },
    { status: 'Emergency', count: 0, color: '#EF4444' },
];

const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '12px',
};

export function RecordsByTypeBarChart() {
    return (
        <ChartCard title="Records by Status" subtitle="Medical document breakdown">
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="status" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: 'var(--foreground)' }}
                        cursor={{ fill: 'var(--surface-2)' }}
                    />
                    <Bar dataKey="count" name="Records" radius={[6, 6, 0, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
