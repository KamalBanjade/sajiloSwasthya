'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

import { doctorApi, RecentScan } from '@/lib/api';

export function RecentScansList() {
  const { data: scans, isLoading } = useQuery<RecentScan[]>({
    queryKey: ['recent-scans'],
    queryFn: () => doctorApi.getRecentScans(5),
    refetchInterval: 30000
  });

  if (isLoading) {
    return <ListSkeleton />;
  }

  return (
    <div className="h-[480px] flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Feed</span>
      </div>

      {!scans || scans.length === 0 ? (
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
          <p className="text-slate-500 dark:text-slate-400">No recent activity detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <div key={scan.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors group">
              <div className={`p-2 rounded-lg ${scan.isEmergency ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                {scan.isEmergency ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{scan.patientName}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {format(new Date(scan.scannedAt), 'h:mm a, MMM d')}
                  <span>•</span>
                  <span className={scan.totpVerified ? 'text-emerald-500' : 'text-amber-500'}>
                    {scan.totpVerified ? 'TOTP Verified' : 'Standard Scan'}
                  </span>
                </div>
              </div>
              {scan.isEmergency && (
                <div className="px-2 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">EMERGENCY</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="h-full flex flex-col w-full animate-pulse">
      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mb-6" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
