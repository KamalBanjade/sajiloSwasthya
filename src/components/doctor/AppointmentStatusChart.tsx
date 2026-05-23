'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { doctorApi, WeekSchedule } from '@/lib/api';
import { TrendingUp, Users, CalendarCheck, BarChart3, AlertCircle, CalendarRange, MousePointer2 } from 'lucide-react';

export function AppointmentStatusChart() {
  // Enhanced component with aggregate insights and high-density bar chart
  const { data: schedule, isLoading } = useQuery<WeekSchedule>({
    queryKey: ['week-schedule'],
    queryFn: doctorApi.getWeekSchedule
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 animate-pulse">
        <BarChart3 className="w-10 h-10 text-slate-300 mb-4" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
    );
  }

  // Aggregate stats from the 7-day schedule
  const stats = schedule?.days.reduce((acc, day) => ({
    scheduled: acc.scheduled + day.scheduled,
    completed: acc.completed + day.completed,
    cancelled: acc.cancelled + day.cancelled
  }), { scheduled: 0, completed: 0, cancelled: 0 }) || { scheduled: 0, completed: 0, cancelled: 0 };

  const chartData = [
    { name: 'CONFIRMED', count: stats.scheduled, color: '#3B82F6' },
    { name: 'COMPLETED', count: stats.completed, color: '#10B981' },
    { name: 'CANCELLED', count: stats.cancelled, color: '#F43F5E' },
  ];

  const total = stats.scheduled + stats.completed + stats.cancelled;
  const efficiency = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  // Find top performer Status
  const topStatus = [...chartData].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="h-[480px] flex flex-col lg:flex-row gap-4 w-full p-1 overflow-hidden">
      {/* Left Details Panel - Insights Sidebar */}
      <div className="w-full lg:w-48 flex flex-col gap-4 lg:border-r border-slate-200/50 dark:border-slate-800/50 lg:pr-4">
        <div className="space-y-0.5">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aggregate View</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{total}</span>
            <div className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black">30D</div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5 group transition-transform hover:translate-x-1">
            <div className="p-1.5 bg-primary/10 rounded-lg"><Users className="w-3.5 h-3.5 text-primary" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Success Rate</p>
              <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">{efficiency}% Conversion</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 group transition-transform hover:translate-x-1">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Top Outcome</p>
              <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">{topStatus.count > 0 ? topStatus.name : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 group transition-transform hover:translate-x-1">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><CalendarRange className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Focus Period</p>
              <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">30-Day Window</p>
            </div>
          </div>
        </div>

        {total === 0 ? (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 flex gap-2 items-start">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[8px] font-bold text-amber-700 dark:text-amber-500 leading-tight">Sync active but no volume detected in this range.</p>
          </div>
        ) : (
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex gap-2 items-center">
            <MousePointer2 className="w-2.5 h-2.5 text-primary animate-bounce" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Hover for stats</p>
          </div>
        )}
      </div>

      {/* Main Bar Chart Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-[180px]">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#64748B', fontWeight: 900, letterSpacing: '0.05em' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="count" radius={[12, 12, 4, 4]} barSize={55} animationDuration={1500}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-40 space-y-4">
              <div className="relative">
                <BarChart3 className="w-24 h-24" />
                <AlertCircle className="absolute -bottom-1 -right-1 w-8 h-8 text-amber-500/50" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[180px]">Distribution Feed Standby</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          {chartData.map((item) => (
            <div key={item.name} className="flex flex-col group/item transition-all hover:translate-y-[-2px]">
              <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none truncate">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                  {item.count}
                </p>
                <span className="text-[11px] font-black text-slate-400 opacity-40">
                  {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
