'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import { queryKeys } from '@/lib/queryKeys';
import { useDoctorDashboardStats, useDoctorRecordGrowth } from '@/hooks/useAdminQueries';
import {
  Calendar, FileText, Activity, Users, AlertCircle,
  Sparkles, TrendingUp, Clock, LayoutDashboard,
  CheckCircle, ArrowUpRight, BarChart3, PieChart as PieIcon,
  Database, FileEdit, ShieldAlert, Archive, FileText as FileIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { DoctorStatCard } from '@/components/doctor/DoctorStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminApi, doctorApi, Doctor } from '@/lib/api';

import { RecentScansList } from '@/components/doctor/RecentScansList';
import { WeekScheduleHeatmap } from '@/components/doctor/WeekScheduleHeatmap';
import { PatientVolumeChart } from '@/components/doctor/PatientVolumeChart';

import { TemplateUsageChart } from '@/components/doctor/TemplateUsageChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DesktopPairing } from '@/components/scanner/DesktopPairing';
import { AppointmentStatusChart } from '@/components/doctor/AppointmentStatusChart';

// --- Framer Motion Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const tooltipStyle = {
  backgroundColor: 'var(--surface, #ffffff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: '14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
  fontSize: '12px',
};
const tooltipLabelStyle = { fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
          {label}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{entry.name}</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- Reusable Premium Components ---
function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
      </div>
      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{children}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
    </div>
  );
}

function ChartPanel({ title, sub, children, className = '', glowColor = 'bg-primary/5' }: { title: string; sub?: string; children: React.ReactNode; className?: string; glowColor?: string }) {
  return (
    <motion.div variants={itemVariants} className={`group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden ${className}`}>
      {/* Soft glow on hover */}
      <div className={`absolute -inset-px rounded-[2.5rem] opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-2xl ${glowColor}`} />

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {sub && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>}
          </div>
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default function DoctorDashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, error } = useDoctorDashboardStats();
  const { data: recordGrowth, isLoading: isGrowthLoading } = useDoctorRecordGrowth();

  if (isLoading || isGrowthLoading) {
    return (
      <PageLayout>
        <DashboardSkeleton />
      </PageLayout>
    );
  }

  if (error || !stats || !recordGrowth) {
    return (
      <PageLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center p-12 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-slate-200">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard Unavailable</h2>
            <p className="text-slate-500 mt-2 font-medium">We encountered an error loading your statistics.<br />Please check your connection and refresh.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <PageLayout>
      {/* Ambient background decoration */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12 pb-20"
      >
        {/* --- Hero Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Medical Analytics</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Dr. {stats.firstName}</span>
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-3 font-bold bg-slate-100/50 dark:bg-white/5 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-slate-200/50 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {format(new Date(), 'EEEE, MMMM do yyyy')}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl backdrop-blur-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em]">System Live</span>
            </div>
            <button className="px-6 py-3 bg-primary/10 dark:bg-white text-primary dark:text-slate-900 rounded-2xl hover:scale-105 transition-all shadow-xl backdrop-blur-md border border-primary/20 flex items-center gap-3 font-black text-sm">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </button>
          </motion.div>
        </div>

        {/* --- Top Metrics --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DoctorStatCard delay={0} title="Today's Appointments" value={stats.todayAppointments} icon={Calendar} color="primary" priority="critical" pulseAnimation={stats.todayAppointments > 0} subtitle="Scheduled for today" />
          <DoctorStatCard delay={1} title="Pending Records" value={stats.pendingRecords} subtitle="Awaiting certification" icon={FileText} color={stats.pendingRecords > 0 ? "warning" : "success"} priority="critical" pulseAnimation={stats.pendingRecords > 3} />
          <DoctorStatCard delay={2} title="Weekly Completion" value={`${stats.completionRate}%`} subtitle={`${stats.weekAppointments} appts this week`} icon={Activity} color="secondary" priority="high" trend={stats.completionRate >= 80 ? 'up' : 'neutral'} />
          <DoctorStatCard delay={3} title="Patient Access" value={stats.recentScans} subtitle="Recent profile scans" icon={Users} color="accent" priority="high" />
        </div>

        {/* --- Schedule & Activity --- */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* --- Row 1: Growth & Scanner --- */}
            <div className="lg:col-span-2 flex flex-col">
              <ChartPanel title="Growth Trends" sub="Repository Medical Records Growth" className="shadow-primary/5 flex-1 h-[420px] overflow-hidden">
                <div className="h-full w-full flex flex-col p-4">
                  {/* Granular Metrics Row (Dynamic Columns based on active states) */}
                  <div className="flex flex-wrap gap-2.5 mb-8">
                    {[
                      { label: 'System Records', value: recordGrowth?.[recordGrowth.length - 1]?.total, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: Database, desc: 'Total tracked' },
                      { label: 'Certified', value: recordGrowth?.[recordGrowth.length - 1]?.certified, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, desc: 'Verified data' },
                      { label: 'Pending', value: recordGrowth?.[recordGrowth.length - 1]?.pending, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock, desc: 'Waiting review' },
                      { label: 'Drafts', value: recordGrowth?.[recordGrowth.length - 1]?.draft, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: FileEdit, desc: 'Unfiled active' },
                      { label: 'Emergency', value: recordGrowth?.[recordGrowth.length - 1]?.emergency, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: ShieldAlert, desc: 'Urgent access' },
                      { label: 'Archived', value: recordGrowth?.[recordGrowth.length - 1]?.archived, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Archive, desc: 'Historical ref' }
                    ].filter(stat => stat.label === 'System Records' || (stat.value && stat.value > 0)).map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`px-4 py-2.5 rounded-2xl ${stat.bg} ${stat.border} border flex items-center gap-3 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 group`}
                      >
                        <div className={`p-1.5 rounded-lg ${stat.bg} brightness-90`}>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.value || 0}</p>
                            <p className={`text-[8px] font-black ${stat.color} uppercase tracking-widest opacity-80`}>{stat.label}</p>
                          </div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{stat.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex-1 min-h-[200px] relative group/chart">
                    {/* Glass Background Panel for Chart */}
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-black/5 rounded-3xl border border-slate-200 dark:border-white/10 backdrop-blur-[2px] pointer-events-none" />

                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={recordGrowth || []}
                        margin={{ top: 20, right: 20, bottom: 0, left: -20 }}
                      >
                        <defs>
                          <linearGradient id="gradCert" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gradPend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gradDraft" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} /><stop offset="95%" stopColor="#F43F5E" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gradEmerg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gradArch" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#64748B" stopOpacity={0.15} /><stop offset="95%" stopColor="#64748B" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" strokeOpacity={0.1} vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="#94A3B8"
                          tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={25}
                          dy={10}
                        />
                        <YAxis
                          stroke="#94A3B8"
                          tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ stroke: 'rgba(59, 130, 246, 0.1)', strokeWidth: 30 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="certified"
                          stroke="#10B981"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#gradCert)"
                          name="Certified"
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#6EE7B7' }}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const isEnd = index === recordGrowth.length - 1;
                            const hasChanged = index > 0 && payload.certified !== recordGrowth[index - 1].certified;
                            // If resolution is day, dots are cool. If wider, dots help show milestones
                            if (isEnd || hasChanged) {
                              return <circle cx={cx} cy={cy} r={index % 2 === 0 ? 4 : 3} fill="#10B981" stroke="#fff" strokeWidth={2} key={`dot-cert-${index}`} />;
                            }
                            return null;
                          }}
                          animationDuration={1500}
                        />
                        <Area
                          type="monotone"
                          dataKey="pending"
                          stroke="#F59E0B"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#gradPend)"
                          name="Pending"
                          activeDot={{ r: 5, strokeWidth: 0, fill: '#FBBF24' }}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const isEnd = index === recordGrowth.length - 1;
                            const hasChanged = index > 0 && payload.pending !== recordGrowth[index - 1].pending;
                            if (isEnd || hasChanged) {
                              return <circle cx={cx} cy={cy} r={3} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} key={`dot-pend-${index}`} />;
                            }
                            return null;
                          }}
                          animationDuration={1800}
                        />
                        <Area
                          type="monotone"
                          dataKey="draft"
                          stroke="#F43F5E"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#gradDraft)"
                          name="Drafts"
                          activeDot={{ r: 5, strokeWidth: 0, fill: '#FB7185' }}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const isEnd = index === recordGrowth.length - 1;
                            const hasChanged = index > 0 && payload.draft !== recordGrowth[index - 1].draft;
                            if (isEnd || hasChanged) {
                              return <circle cx={cx} cy={cy} r={3} fill="#F43F5E" stroke="#fff" strokeWidth={1.5} key={`dot-draft-${index}`} />;
                            }
                            return null;
                          }}
                          animationDuration={2100}
                        />
                        <Area
                          type="monotone"
                          dataKey="emergency"
                          stroke="#6366F1"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#gradEmerg)"
                          name="Emergency"
                          activeDot={{ r: 5, strokeWidth: 0, fill: '#818CF8' }}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const isEnd = index === recordGrowth.length - 1;
                            const hasChanged = index > 0 && payload.emergency !== recordGrowth[index - 1].emergency;
                            if (isEnd || hasChanged) {
                              return <circle cx={cx} cy={cy} r={3} fill="#6366F1" stroke="#fff" strokeWidth={1.5} key={`dot-emerg-${index}`} />;
                            }
                            return null;
                          }}
                          animationDuration={2400}
                        />
                        <Area
                          type="monotone"
                          dataKey="archived"
                          stroke="#64748B"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#gradArch)"
                          name="Archived"
                          activeDot={{ r: 4, strokeWidth: 0, fill: '#94A3B8' }}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const isEnd = index === recordGrowth.length - 1;
                            const hasChanged = index > 0 && payload.archived !== recordGrowth[index - 1].archived;
                            if (isEnd || hasChanged) {
                              return <circle cx={cx} cy={cy} r={2.5} fill="#64748B" stroke="#fff" strokeWidth={1} key={`dot-arch-${index}`} />;
                            }
                            return null;
                          }}
                          animationDuration={2700}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#3B82F6"
                          strokeWidth={1.5}
                          strokeDasharray="5 5"
                          fill="none"
                          name="Growth Ceiling"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Aesthetic Detail Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex flex-wrap gap-6">
                      {[
                        { l: 'Certified', c: '#10B981', d: 'Verified Practice Intelligence' },
                        { l: 'Pipeline', c: '#F59E0B', d: 'Incoming Record Volume' }
                      ].map(item => (
                        <div key={item.l} className="flex items-start gap-3">
                          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: item.c }} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.l}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{item.d}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 shadow-inner">
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500 relative z-10" />
                          </div>
                          System Synced
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {recordGrowth?.[0]?.resolution === 'Year' ? 'Institutional Strategic Overview' :
                            recordGrowth?.[0]?.resolution === 'Month' ? 'Monthly Operational Insight' :
                              recordGrowth?.[0]?.resolution === 'Week' ? 'Weekly Practice Momentum' :
                                'Daily Tactical Intelligence'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ChartPanel>
            </div>

            <div className="lg:col-span-1 flex flex-col">
              <ChartPanel title="Mobile Scanner" sub="Device synchronization status" glowColor="bg-amber-500/10" className="flex-1 h-[420px] overflow-hidden">
                <div className="h-full">
                  <DesktopPairing />
                </div>
              </ChartPanel>
            </div>

            {/* --- Row 2: Distribution & Activity --- */}
            <div className="lg:col-span-2 flex flex-col pt-8 lg:pt-0">
              <ChartPanel title="Appointment Distribution" sub="Weekly performance analytics • 30 Days Analytics Window" glowColor="bg-blue-500/10" className="flex-1 h-[420px] overflow-hidden">
                <div className="h-full">
                  <AppointmentStatusChart />
                </div>
              </ChartPanel>
            </div>

            <div className="lg:col-span-1 flex flex-col pt-8 lg:pt-0">
              <ChartPanel title="Live Activity" sub="Real-time interaction feed" glowColor="bg-emerald-500/10" className="flex-1 h-[420px] overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  <RecentScansList />
                </div>
              </ChartPanel>
            </div>
          </div>
        </section>

        {/* --- Trends & Volume --- */}
        <section className="space-y-6">
          <SectionLabel icon={BarChart3}>Practice Trends & Analytics</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartPanel title="Week Overview" sub="Appointment load distribution (Last 7 Days)" glowColor="bg-sky-500/10">
              <WeekScheduleHeatmap />
            </ChartPanel>
            <ChartPanel title="Service Volume" sub="Patient frequency trends (Last 30 Days)" glowColor="bg-indigo-500/10">
              <PatientVolumeChart />
            </ChartPanel>
          </div>
        </section>
      </motion.div>
    </PageLayout>
  );
}

function DashboardSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12 pb-20"
    >
      <div className="flex justify-between items-center">
        <motion.div variants={itemVariants}>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-80 rounded-2xl mb-2" />
          <Skeleton className="h-6 w-56 rounded-full opacity-60" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <Skeleton className="h-14 w-44 rounded-2xl shadow-sm" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} variants={itemVariants} transition={{ delay: i * 0.05 }}>
            <Skeleton className="h-44 rounded-[2.5rem]" variant="glass" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2">
           <Skeleton className="h-[500px] rounded-[3rem]" variant="glass" />
        </motion.div>
        <div className="flex flex-col gap-8">
          <motion.div variants={itemVariants}>
            <Skeleton className="h-64 rounded-[2.5rem]" variant="glass" />
          </motion.div>
          <motion.div variants={itemVariants} className="flex-1">
            <Skeleton className="h-[200px] rounded-[3rem]" variant="glass" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
