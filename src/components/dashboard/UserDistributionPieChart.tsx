'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';

const data = [
    { name: 'Doctors', value: 8, color: '#00A388' },
    { name: 'Patients', value: 10, color: '#3B82F6' },
    { name: 'Admins', value: 1, color: '#F59E0B' },
];

const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '12px',
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

export function UserDistributionPieChart() {
    return (
        <ChartCard title="User Distribution" subtitle="By role type">
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={renderLabel}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                {data.map(item => (
                    <div key={item.name} className="text-center">
                        <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: item.color }} />
                        <p className="text-xl font-black text-foreground">{item.value}</p>
                        <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{item.name}</p>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
