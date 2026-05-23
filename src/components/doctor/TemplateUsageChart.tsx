'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { doctorApi, TemplateUsage } from '@/lib/api';

const COLORS = ['#00A388', '#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444'];

export function TemplateUsageChart() {
  const { data: usage, isLoading } = useQuery<TemplateUsage[]>({
    queryKey: ['template-usage'],
    queryFn: doctorApi.getTemplateUsage
  });

  if (isLoading) {
    return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  const chartData = usage?.map(item => ({
    name: item.templateName,
    value: item.usageCount
  })) || [];

  return (
    <div className="h-full flex flex-col w-full">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Documentation Templates</h3>
      <p className="text-xs text-slate-500 mb-6">Most frequently used structures</p>
      <div className="flex-1 min-h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" animationBegin={0} animationDuration={1500}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {chartData.reduce((acc, curr) => acc + curr.value, 0)}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Uses</span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {chartData.slice(0, 3).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-4">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
