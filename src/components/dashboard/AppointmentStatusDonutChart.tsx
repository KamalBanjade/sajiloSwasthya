'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { ChartCard } from './ChartCard';

interface AppointmentStatusDonutChartProps {
    total: number;
    completed: number;
    upcoming: number;
}

export function AppointmentStatusDonutChart({ total, completed, upcoming }: AppointmentStatusDonutChartProps) {
    const other = Math.max(0, total - completed - upcoming);

    const data = [
        { name: 'Completed', value: completed || 0.001, color: '#00A388' },
        { name: 'Upcoming', value: upcoming || 0.001, color: '#3B82F6' },
        { name: 'Other', value: other || 0.001, color: 'var(--border)' },
    ];

    return (
        <ChartCard title="Appointments" subtitle="Status overview">
            <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-black text-foreground">{total}</p>
                    <p className="text-xs text-muted font-semibold">Total</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide">Done</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-300">{completed}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">Soon</p>
                        <p className="text-xl font-black text-blue-600 dark:text-blue-300">{upcoming}</p>
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}
