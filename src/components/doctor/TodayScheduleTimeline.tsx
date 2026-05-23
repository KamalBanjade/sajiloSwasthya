'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentTime: string;
  status: string;
  type: string;
  duration: number;
}

export function TodayScheduleTimeline() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['today-schedule'],
    queryFn: async () => {
      const response = await fetch('/api/doctor/statistics/today-schedule');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 60000
  });
  
  if (isLoading) {
    return <TimelineSkeleton />;
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'Confirmed': return 'bg-blue-500';
      case 'InProgress': return 'bg-amber-500';
      case 'Cancelled': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'Scheduled';
      case 'InProgress': return 'In Progress';
      default: return status;
    }
  };
  
  const now = new Date();
  const nextAppointment = appointments?.find(apt => 
    new Date(apt.appointmentTime) > now && apt.status !== 'Cancelled' && apt.status !== 'Completed'
  );
  
  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Schedule
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {appointments?.length || 0} appointments scheduled
          </p>
        </div>
        {nextAppointment && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Next appointment</p>
            <p className="text-sm font-semibold text-primary">
              {format(new Date(nextAppointment.appointmentTime), 'h:mm a')}
            </p>
          </div>
        )}
      </div>
      
      {!appointments || appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
          <p className="text-slate-500 dark:text-slate-400">No appointments scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {appointments.map((apt, index) => {
            const isNext = apt.id === nextAppointment?.id;
            const isPast = new Date(apt.appointmentTime) < now && apt.status !== 'InProgress';
            
            return (
              <div
                key={apt.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  isNext 
                    ? 'bg-primary/5 border-primary shadow-sm scale-[1.02]' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-primary/50'
                } ${isPast ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${getStatusColor(apt.status)}`} />
                  {index < appointments.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-2 min-h-[40px]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {format(new Date(apt.appointmentTime), 'h:mm a')}
                        </span>
                        <span className="text-xs text-slate-500">({apt.duration} min)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium">{apt.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          apt.status === 'InProgress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          apt.status === 'Cancelled' ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {getStatusLabel(apt.status)}
                        </span>
                        <span className="text-xs text-slate-500">{apt.type}</span>
                      </div>
                    </div>
                    {isNext && (
                      <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm">
                        Start <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="h-full flex flex-col w-full animate-pulse">
      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/3 mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
