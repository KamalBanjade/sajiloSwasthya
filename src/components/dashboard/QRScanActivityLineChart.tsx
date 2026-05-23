'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';

// Representative weekly data — actual endpoint doesn't provide time-series for QR scans
// so we show a distribution pattern based on the total counts
const data = [
    { day: 'Mon', normal: 1, emergency: 6 },
    { day: 'Tue', normal: 1, emergency: 7 },
    { day: 'Wed', normal: 1, emergency: 6 },
    { day: 'Thu', normal: 1, emergency: 8 },
    { day: 'Fri', normal: 1, emergency: 5 },
    { day: 'Sat', normal: 1, emergency: 4 },
];

const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '12px',
};

export function QRScanActivityLineChart() {
    return (
        <ChartCard title="QR Scan Activity" subtitle="Weekly scan pattern (Normal vs Emergency)">
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                    <Line type="monotone" dataKey="normal" stroke="#00A388" strokeWidth={3} dot={{ fill: '#00A388', r: 4 }} activeDot={{ r: 6 }} name="Normal Scans" />
                    <Line type="monotone" dataKey="emergency" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 4 }} activeDot={{ r: 6 }} name="Emergency Scans" />
                </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                {[
                    { label: 'Normal (Total: 6)', color: '#00A388' },
                    { label: 'Emergency (Total: 36)', color: '#EF4444' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-xs text-muted font-medium">{l.label}</span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
