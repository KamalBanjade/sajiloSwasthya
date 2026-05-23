'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BreakdownData {
  draft: number;
  pending: number;
  certified: number;
  total: number;
}

export function RecordStatusChart() {
  const { data: breakdown, isLoading } = useQuery<BreakdownData>({
    queryKey: ['record-status'],
    queryFn: async () => {
      const response = await fetch('/api/doctor/statistics/record-status');
      if (!response.ok) return { draft: 0, pending: 0, certified: 0, total: 0 };
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  const chartData = [
    { name: 'Draft', count: breakdown?.draft || 0, color: '#64748B' },
    { name: 'Pending', count: breakdown?.pending || 0, color: '#F59E0B' },
    { name: 'Certified', count: breakdown?.certified || 0, color: '#00A388' },
  ];

  return (
    <div className="h-full flex flex-col w-full">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Record Repository</h3>
      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {chartData.map((item) => (
          <div key={item.name} className="text-center">
            <p className="text-lg font-black text-slate-900 dark:text-white">{item.count}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
