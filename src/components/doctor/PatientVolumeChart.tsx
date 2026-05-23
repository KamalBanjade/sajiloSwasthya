'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

import { doctorApi, PatientVolumeTrend } from '@/lib/api';

export function PatientVolumeChart() {
  const { data: trend, isLoading } = useQuery<PatientVolumeTrend[]>({
    queryKey: ['patient-volume'],
    queryFn: doctorApi.getPatientVolume
  });

  if (isLoading) {
    return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  const chartData = trend?.map(item => ({
    displayDate: format(parseISO(item.date), 'MMM d'),
    count: item.patientCount
  })) || [];

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Patient Volume</h3>
        <span className="text-xs text-slate-500 font-medium tracking-tight">Last 30 Days</span>
      </div>
      <div className="flex-1 min-h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" name="Patients" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
