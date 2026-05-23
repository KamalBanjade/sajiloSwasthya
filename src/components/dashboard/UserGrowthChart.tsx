'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { ChartCard } from './ChartCard';

const data = [
    { month: 'Oct', users: 4, doctors: 2, patients: 2 },
    { month: 'Nov', users: 7, doctors: 4, patients: 3 },
    { month: 'Dec', users: 10, doctors: 5, patients: 5 },
    { month: 'Jan', users: 14, doctors: 7, patients: 7 },
    { month: 'Feb', users: 17, doctors: 7, patients: 9 },
    { month: 'Mar', users: 19, doctors: 8, patients: 10 },
];

const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    fontSize: '12px',
};

export function UserGrowthChart() {
    return (
        <ChartCard title="User Growth Trend" subtitle="Monthly registrations across all roles">
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                        <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradDoctors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00A388" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00A388" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="month" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--foreground)', fontWeight: 700 }} itemStyle={{ color: 'var(--foreground)' }} />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} fill="url(#gradUsers)" name="Total" />
                    <Area type="monotone" dataKey="doctors" stroke="#00A388" strokeWidth={2} fill="url(#gradDoctors)" name="Doctors" />
                    <Area type="monotone" dataKey="patients" stroke="#F59E0B" strokeWidth={2} fill="url(#gradPatients)" name="Patients" />
                </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                {[
                    { label: 'Total', color: '#3B82F6' },
                    { label: 'Doctors', color: '#00A388' },
                    { label: 'Patients', color: '#F59E0B' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-xs text-muted font-medium">{l.label}</span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
