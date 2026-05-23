'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { doctorApi, WeekSchedule } from '@/lib/api';

export function WeekScheduleHeatmap() {
  const { data: schedule, isLoading } = useQuery<WeekSchedule>({
    queryKey: ['week-schedule'],
    queryFn: doctorApi.getWeekSchedule
  });

  if (isLoading) {
    return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const days = schedule?.days || [];
  const todayIndex = days.findIndex(d => d.date.startsWith(todayStr));
  const displayDays = todayIndex !== -1 
    ? days.slice(Math.max(0, todayIndex - 6), todayIndex + 1)
    : days.slice(-7);

  const maxCount = Math.max(...(displayDays.map(d => d.count) || [1]), 1);

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-50 dark:bg-slate-800/30';
    const intensity = count / maxCount;
    if (intensity < 0.3) return 'bg-primary/20 text-primary-700';
    if (intensity < 0.6) return 'bg-primary/40 text-primary-800';
    if (intensity < 0.8) return 'bg-primary/70 text-white';
    return 'bg-primary text-white';
  };

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Load</h3>
        <span className="text-xs text-slate-500 font-medium">Activity Heatmap</span>
      </div>
      <div className="grid grid-cols-7 gap-3 mb-8">
        {displayDays.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {format(parseISO(day.date), 'EEE')}
            </span>
            <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 group relative cursor-default ${getIntensityColor(day.count)}`}>
              <span className="text-lg font-black">{day.count}</span>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                 <p className="font-bold border-b border-white/10 pb-1 mb-1">{format(parseISO(day.date), 'MMMM d')}</p>
                 <div className="space-y-0.5">
                    <div className="flex justify-between"><span>Scheduled:</span> <span>{day.scheduled}</span></div>
                    <div className="flex justify-between"><span>Completed:</span> <span>{day.completed}</span></div>
                    <div className="flex justify-between text-rose-400"><span>Cancelled:</span> <span>{day.cancelled}</span></div>
                 </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-900 dark:text-white mt-1">
                {format(parseISO(day.date), 'd')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 dark:border-slate-800">
        <span>Low</span>
        <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/50 to-primary" />
        <span>High Load</span>
      </div>
    </div>
  );
}
