'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Pill, TriangleAlert, CheckCircle, FileDown,
  Loader2, TrendingDown, TrendingUp, Activity, FlaskConical,
  Heart, Thermometer, Wind, Scale, Zap, ShieldAlert, ArrowUpRight,
  ClipboardList, History, FlaskConicalOff, EyeOff
} from 'lucide-react';
import {
  AreaChart, Area, ComposedChart, Line,
  BarChart, Bar, Cell, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  PieChart, Pie,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea
} from 'recharts';
import { doctorApi, patientApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  AnalysisSummary, VitalTrend, MedicationCorrelation,
  AbnormalityPattern, StabilityTimeline, QuarterlyStability
} from '@/types/analysis';

export interface LabMetadata {
  name: string;
  normalMin: number | null;
  normalMax: number | null;
  improvingDirection: string;
  category: string;
  unit: string;
}

// ─── Constants & Icons ────────────────────────────────────────────────────────
const STANDARD_VITALS = new Set(['Systolic', 'Diastolic', 'HeartRate', 'SpO2', 'Temperature', 'BMI']);

const VITAL_ICONS: Record<string, React.ElementType> = {
  Systolic: Heart, Diastolic: Heart, HeartRate: Activity,
  SpO2: Wind, Temperature: Thermometer, BMI: Scale,
};

// ─── Framer Motion Variants ───────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
  fontSize: '12px',
  color: 'var(--foreground)',
};
const tooltipLabel = { color: 'var(--foreground)', fontWeight: 700 };

// ─── Shared Components ───────────────────────────────────────────────────────

function GlassCard({
  children, className = '', glowColor = 'bg-primary/10'
}: {
  children: React.ReactNode; className?: string; glowColor?: string;
}) {
  return (
    <div
      className={`group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-200/80 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl dark:shadow-black/50 hover:border-indigo-500/20 transition-all duration-500 ${className}`}
    >
      <div className={`absolute top-0 right-0 w-64 h-64 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[80px] -mr-32 -mt-32 pointer-events-none ${glowColor.includes('bg-') ? glowColor : 'bg-indigo-500/10'}`} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-3 rounded-[1rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h2 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{children}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200/80 dark:from-white/10 to-transparent" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
        <Icon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-[300px] leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTrendHexColor = (dir: string) => {
  if (dir === 'Improving') return '#22c55e';
  if (dir === 'Degrading') return '#ef4444';
  if (dir === 'Stable') return '#6366f1';
  if (dir === 'Baseline') return '#94a3b8';
  return '#f59e0b';
};

const getScoreColor = (score: number) => {
  if (score >= 85) return '#22c55e';
  if (score >= 65) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const buildNormalizer = (metadata: LabMetadata[]) => {
  return (name: string, value: number): number => {
    const n = name.toLowerCase();
    if (n.includes('systolic')) return Math.min(100, Math.max(0, 100 - Math.abs(value - 117.5) * 2));
    if (n.includes('diastolic')) return Math.min(100, Math.max(0, 100 - Math.abs(value - 77.5) * 2));
    if (n.includes('heartrate') || (n.includes('heart') && n.includes('rate'))) return Math.min(100, Math.max(0, 100 - Math.abs(value - 72) * 1.5));
    if (n.includes('spo2') || n.includes('oxygen')) return Math.min(100, Math.max(0, 100 - Math.abs(value - 98.5) * 3.5));
    if (n.includes('temp')) {
      const isCelsius = value < 50;
      const target = isCelsius ? 37.0 : 98.6;
      const factor = isCelsius ? 27 : 15; // Adjusted scaling factor for Celsius vs Fahrenheit precision
      return Math.min(100, Math.max(0, 100 - Math.abs(value - target) * factor));
    }
    if (n.includes('bmi')) return Math.min(100, Math.max(0, 100 - Math.abs(value - 22.5) * 4));

    const meta = metadata.find(m => {
        const mName = m.name.toLowerCase();
        return mName === n || n.includes(mName) || mName.includes(n);
    });
    if (!meta) return 50;

    if (meta.normalMin !== null && meta.normalMax !== null) {
      const mid = (meta.normalMin + meta.normalMax) / 2;
      const range = meta.normalMax - meta.normalMin;
      return Math.max(0, Math.min(100, 100 - (Math.abs(value - mid) / (range || 1)) * 50));
    }

    if (meta.improvingDirection === 'Lower') {
      return value < 0 ? 100 : Math.max(0, 100 - value);
    }
    if (meta.improvingDirection === 'Higher') {
      return Math.min(100, value);
    }

    return 50;
  };
};

interface AnalysisDashboardProps { 
  patientId: string; 
  patientFullName: string; 
  overrideTotalVisits?: number;
}
interface HealthAnalysisApi {
  getVitalTrends: (id: string) => Promise<any>;
  getMedicationCorrelations: (id: string) => Promise<any>;
  getAbnormalityPatterns: (id: string) => Promise<any>;
  getStabilityTimeline: (id: string) => Promise<any>;
  getAnalysisSummary: (id: string) => Promise<any>;
  getFullAnalysis: (id: string) => Promise<any>;
  generateAnalysisReport: (id: string, fullName: string) => Promise<any>;
  downloadAnalysisReport: (id: string) => Promise<any>;
  getLabMetadata: () => Promise<any>;
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function AnalysisSkeleton() {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12 w-full">
      
      {/* ─── Hero Identity Skeleton ─── */}
      <div className="p-8 bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-12 w-32 rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
          <div className="flex items-end justify-end">
            <Skeleton className="h-16 w-32 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs Skeleton ─── */}
      <div className="flex flex-wrap gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-36 rounded-2xl" />
        ))}
      </div>

      {/* ─── Primary Content Skeleton ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] min-h-[400px]">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-8" />
            <div className="flex gap-4 mb-8">
              <Skeleton className="h-20 w-32 rounded-2xl" />
              <Skeleton className="h-20 w-32 rounded-2xl" />
              <Skeleton className="h-20 w-32 rounded-2xl" />
            </div>
            <Skeleton className="w-full h-[250px] rounded-2xl" />
          </div>
        </div>

        {/* Side Panel Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] min-h-[400px]">
             <Skeleton className="h-6 w-48 mb-8" />
             <div className="space-y-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AnalysisDashboard({ patientId, patientFullName, overrideTotalVisits }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'vitals' | 'labs' | 'treatment' | 'history'>('vitals');
  const [showAllLabs, setShowAllLabs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { user } = useAuthStore();
  const isPatient = user?.role === 'Patient';
  const api = (isPatient ? patientApi : doctorApi) as unknown as HealthAnalysisApi;

  // Single consolidated query for massive performance boost
  const { data: fullRes, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['clinical_full_analysis', patientId],
    queryFn: () => api.getFullAnalysis(patientId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: metaRes, isLoading: lm } = useQuery({
    queryKey: ['clinical_metadata'],
    queryFn: () => api.getLabMetadata(),
    staleTime: 10 * 60 * 1000, // Metadata changes rarely
  });

  const isMetadataLoading = lm;
  const fullData = fullRes?.data;

  const error = fetchError ? 'Failed to load clinical intelligence data.' : null;
  
  const summary = fullData?.summary as AnalysisSummary || null;
  const trends = fullData?.trends as VitalTrend[] || [];
  const correlations = fullData?.correlations as MedicationCorrelation[] || [];
  const patterns = fullData?.patterns as AbnormalityPattern[] || [];
  const timeline = fullData?.timeline as StabilityTimeline || null;
  const metadata = metaRes?.data as LabMetadata[] || [];

  const normalizeVital = useMemo(() => buildNormalizer(metadata), [metadata]);

  const vitalTrends = useMemo(() => trends.filter(t => 
    STANDARD_VITALS.has(t.vitalName) || 
    STANDARD_VITALS.has(t.vitalName.replace(/\s/g, ''))
  ), [trends]);
  const laboratoryTrends = useMemo(() => trends.filter(t => 
    !STANDARD_VITALS.has(t.vitalName) && 
    !STANDARD_VITALS.has(t.vitalName.replace(/\s/g, ''))
  ), [trends]);

  const labStats = useMemo(() => laboratoryTrends.reduce(
    (acc, lab) => {
      if (lab.direction === 'Improving') acc.improving++;
      else if (lab.direction === 'Degrading') acc.degrading++;
      else acc.stable++;
      return acc;
    }, { improving: 0, degrading: 0, stable: 0 }
  ), [laboratoryTrends]);

  const slopeInsights = useMemo(() => {
    const allInsights = summary?.keyInsights || [];
    return allInsights
      .filter(i => i.includes('slope'))
      .map(insight => {
        const match = insight.match(/Marker\s+(.*?)\s+shows significant trend slope \(([+-]?\d+\.?\d*)\)/i);
        if (!match) return null;
        const vName = match[1];
        const slope = parseFloat(match[2]);
        const backendTrend = trends.find(t => t.vitalName.toLowerCase() === vName.toLowerCase());
        const direction = backendTrend?.direction ?? (slope < 0 ? 'Improving' : 'Degrading');
        return { vitalName: vName, slope, direction };
      })
      .filter(Boolean) as { vitalName: string; slope: number; direction: string }[];
  }, [summary, trends]);

  const handleExportPdf = async () => {
    try {
      setIsGenerating(true);
      const api = (isPatient ? patientApi : doctorApi) as unknown as HealthAnalysisApi;
      const gen = await api.generateAnalysisReport(patientId, patientFullName);
      const res = await api.downloadAnalysisReport(gen.data.reportId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clinical-intelligence-${patientFullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
    finally { setIsGenerating(false); }
  };

  if (loading) return <AnalysisSkeleton />;

  if (error) return (
    <div className="p-6 border border-red-200 bg-red-50/80 dark:bg-red-900/20 rounded-3xl flex items-center gap-4 text-red-600 font-bold">
      <AlertCircle size={24} /> {error}
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      
      {/* ─── Hero Identity ─── */}
      {summary && (
        <GlassCard glowColor="bg-primary/10" className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                  Clinical Intelligence
                </span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {overrideTotalVisits ?? summary.totalVisits} Clinical Datapoints
                </span>
                {summary.primaryCondition && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-muted">
                    Condition: {summary.primaryCondition}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">{patientFullName}</h2>
              <p className="text-sm font-semibold text-muted">
                {summary.patientAge} Years · {summary.gender} · {summary.bloodType} · Last Visit {new Date(summary.lastVisit).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-surface-2 border border-border">
                <span className={`text-sm font-black ${summary.overallHealthTrend === 'Improving' ? 'text-emerald-500' : summary.overallHealthTrend === 'Degrading' ? 'text-red-500' : 'text-primary'}`}>
                  {summary.overallHealthTrend}
                </span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Health Trend</span>
              </div>
              <button
                onClick={handleExportPdf} disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[13px] font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                Export Analysis
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ─── Tab Navigation ─── */}
      <div className="flex p-1.5 bg-surface-2/60 backdrop-blur-md rounded-2xl border border-border/40 w-full sm:w-fit">
        {[
          { id: 'vitals', label: 'Vital Signs', icon: Heart },
          { id: 'labs', label: 'Laboratory', icon: FlaskConical },
          { id: 'treatment', label: 'Treatment', icon: Pill },
          { id: 'history', label: 'History', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-border/60' 
                : 'text-muted hover:text-foreground hover:bg-white/40'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="min-h-[400px]">
        {activeTab === 'vitals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <GridVitals trends={vitalTrends} />
            <RadarVitals trends={vitalTrends} normalizeVital={normalizeVital} />
          </motion.div>
        )}
        {activeTab === 'labs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <LabInsights trends={laboratoryTrends} />
          </motion.div>
        )}
        {activeTab === 'treatment' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <TreatmentEffect correlations={correlations} normalizeVital={normalizeVital} />
          </motion.div>
        )}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <StabilityLifecycle timeline={timeline} patterns={patterns} />
          </motion.div>
        )}
      </div>

    </motion.div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function GridVitals({ trends }: { trends: VitalTrend[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trends.map((t) => (
        <GlassCard key={t.vitalName} className="p-6" glowColor={t.direction === 'Improving' ? 'bg-emerald-500/10' : t.direction === 'Degrading' ? 'bg-red-500/10' : 'bg-primary/5'}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-surface-2 border border-border">
                {React.createElement(VITAL_ICONS[t.vitalName] || Activity, { size: 16, className: 'text-primary' })}
              </div>
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.15em]">{t.vitalName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTrendHexColor(t.direction) }} />
                  <span className="text-[11px] font-bold" style={{ color: getTrendHexColor(t.direction) }}>
                    {t.direction === 'Baseline' ? 'Initial Baseline' : t.direction}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-foreground">{t.currentValue?.toFixed(1) || '—'}</span>
              <span className="text-[11px] font-bold text-muted ml-1">{t.vitalUnit}</span>
            </div>
          </div>

          <div className="h-[100px] w-full mb-4 relative">
            {t.stabilityWindows && t.stabilityWindows.length >= 2 ? (
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={t.stabilityWindows.map((v, i) => ({ x: i, val: v.averageValue }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-${t.vitalName.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getTrendHexColor(t.direction)} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={getTrendHexColor(t.direction)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {t.normalMin !== null && t.normalMax !== null && (
                    <ReferenceArea y1={t.normalMin} y2={t.normalMax} fill="currentColor" fillOpacity={0.04} />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke={getTrendHexColor(t.direction)} 
                    strokeWidth={3} 
                    fill={`url(#grad-${t.vitalName.replace(/\s/g, '')})`} 
                    isAnimationActive={true} 
                    animationDuration={1500}
                    dot={{ fill: getTrendHexColor(t.direction), r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-t border-dashed border-border/60">
                <span className="text-[10px] font-bold text-muted italic">
                  {t.stabilityWindows?.length === 1 ? 'Single baseline recorded (needs 2+)' : 'No historical data points'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/40">
            <p className="text-[11px] font-medium text-muted leading-relaxed line-clamp-2 italic">"{t.humanInterpretation}"</p>

          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function RadarVitals({ trends, normalizeVital }: { trends: VitalTrend[], normalizeVital: (name: string, value: number) => number }) {
  const radarData = trends.filter(t => t.currentValue !== null).map(t => ({
    vital: t.vitalName,
    val: normalizeVital(t.vitalName, t.currentValue!),
  }));

  if (radarData.length < 3) {
    return (
      <GlassCard className="p-8">
        <SectionLabel icon={Activity}>Biological Balance Map</SectionLabel>
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/60 rounded-[2rem] bg-surface-2/30">
          <Activity size={32} className="text-muted/30 mb-4" />
          <p className="text-[12px] font-black text-foreground uppercase tracking-widest">Insufficient Distinct Parameters</p>
          <p className="text-[11px] text-muted max-w-sm mt-2 leading-relaxed">
            A radial map inherently requires at least 3 different variables (axes) to form a comparable geometry. Currently, only <strong className="text-primary">{radarData.length}</strong> distinct vital signs have consistent baseline data.
          </p>
          <p className="text-[10px] font-bold text-muted/60 uppercase tracking-widest mt-6 bg-surface-3/50 px-4 py-2 rounded-full">
             e.g. Need Heart Rate, SpO2, Temperature, etc.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8">
      <SectionLabel icon={Activity}>Biological Balance Map</SectionLabel>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="w-full lg:w-[450px] aspect-square lg:aspect-auto lg:h-[320px] relative">
          <ResponsiveContainer width="99%" height="100%">
            <RadarChart data={radarData} outerRadius="80%">
              <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
              <PolarAngleAxis dataKey="vital" tick={{ fontSize: 11, fill: 'var(--muted)', fontWeight: 700 }} />
              <Radar dataKey="val" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          {trends.map(t => {
            const score = normalizeVital(t.vitalName, t.currentValue || 0);
            return (
              <div key={t.vitalName} className="p-4 rounded-2xl bg-surface-2/40 border border-border/40">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{t.vitalName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl font-black" style={{ color: getScoreColor(score) }}>{score.toFixed(0)}%</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

function LabInsights({ trends }: { trends: VitalTrend[] }) {
  const [showAllLabs, setShowAllLabs] = React.useState(false);
  if (trends.length === 0) return <EmptyState icon={FlaskConicalOff} title="No Laboratory Data" description="Historical lab markers from clinical chemistry will appear here once processed." />;

  const labStats = trends.reduce(
    (acc, lab) => {
      if (lab.direction === 'Improving') acc.improving++;
      else if (lab.direction === 'Degrading') acc.degrading++;
      else acc.stable++;
      return acc;
    }, { improving: 0, degrading: 0, stable: 0 }
  );

  const sections = Array.from(new Set(trends.map(t => (t.sectionName || 'General Results').trim())));

  // Pick top 8 most 'significant' laboratory markers for the summary graph
  const summaryLabs = useMemo(() => {
    return [...trends]
      .sort((a, b) => {
        // Handle nulls
        const deltaA = Math.abs(a.percentChangeFromBaseline || 0);
        const deltaB = Math.abs(b.percentChangeFromBaseline || 0);
        
        // Priority: Degrading (Red) trends first, then Improving (Green), then magnitude
        if (a.direction === 'Degrading' && b.direction !== 'Degrading') return -1;
        if (a.direction !== 'Degrading' && b.direction === 'Degrading') return 1;
        
        return deltaB - deltaA;
      })
      .slice(0, 8);
  }, [trends]);

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
         <div className="flex flex-wrap items-center gap-4">
            {labStats.improving > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase">
                <ArrowUpRight size={10} /> {labStats.improving} Improving
              </span>
            )}
            {labStats.stable > 0 && (
              <span className="px-3 py-1 rounded-full bg-surface-2 border border-border text-muted text-[10px] font-black uppercase">
                {labStats.stable} Stable
              </span>
            )}
            {labStats.degrading > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase">
                {labStats.degrading} Warning
              </span>
            )}
         </div>
      </div>

      {/* OVERALL ASSESSMENT SUMMARY (Always visible if labs exist) */}
      <GlassCard className="p-8" glowColor="bg-primary/5">
        <SectionLabel>Overall Assessment</SectionLabel>
        <div style={{ height: Math.max(160, summaryLabs.length * 45) }} className="mt-4">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={summaryLabs.map(t => {
                let relativeScore = 50;
                if (t.normalMin !== null && t.normalMax !== null && t.currentValue !== null) {
                    const range = t.normalMax - t.normalMin;
                    const center = (t.normalMin + t.normalMax) / 2;
                    const distance = Math.abs(t.currentValue - center);
                    relativeScore = (distance / (range || 1)) * 40 + 30;
                } else if (t.percentChangeFromBaseline !== null) {
                    relativeScore = Math.max(10, Math.min(100, Math.abs(t.percentChangeFromBaseline) * 2));
                }

                return {
                  name: t.vitalName,
                  mag: Math.min(100, relativeScore),
                  cur: t.currentValue,
                  dir: t.direction,
                  isAbnormal: t.isAbnormal
                };
              })} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={150} 
                  tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 800 }} 
                />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }} 
                  isAnimationActive={false}
                  formatter={(value: any, name: any) => {
                    if (name === 'mag') return [`${parseFloat(value).toFixed(1)}%`, 'Risk Level'];
                    if (name === 'cur') return [value, 'Current Value'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="mag" radius={[0, 6, 6, 0]} barSize={20}>
                  {summaryLabs.map((t, i) => (
                    <Cell 
                        key={i} 
                        fill={getTrendHexColor(t.direction)} 
                    />
                  ))}
                  <LabelList dataKey="cur" position="right" style={{ fontSize: 11, fontWeight: 900, fill: 'var(--foreground)' }} formatter={(v: any) => v?.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </GlassCard>

      {sections.map(section => {
        const sectionLabs = trends.filter(t => (t.sectionName || 'General Results') === section);
        const displayedLabs = showAllLabs ? sectionLabs : sectionLabs.slice(0, 6);
        const isGeneralSection = section.toLowerCase().includes('general');

        return (
          <div key={section} className="space-y-6">
            <SectionLabel>{section}</SectionLabel>

<div />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedLabs.map(l => {
                const hex = getTrendHexColor(l.direction);
                const delta = l.percentChangeFromBaseline !== null ? l.percentChangeFromBaseline : 0;
                const absDelta = Math.abs(delta);
                
                return (
                  <GlassCard key={l.vitalName} className="p-6 flex flex-col gap-6 group hover:border-primary/20 transition-all duration-300" glowColor={hex + '08'}>
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted uppercase tracking-widest">{l.vitalName}</p>
                          <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-black text-foreground tabular-nums">
                               {l.currentValue !== null ? (l.currentValue % 1 === 0 ? l.currentValue : l.currentValue.toFixed(2)) : '—'}
                             </p>
                             <span className="text-[10px] font-bold text-muted uppercase">{l.vitalUnit}</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${
                            l.direction === 'Improving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            l.direction === 'Degrading' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-surface-2 border-border text-muted'
                          }`}>
                             {l.direction === 'Improving' && <ArrowUpRight size={10} />}
                             {l.direction}
                          </div>
                          {absDelta > 0 && (
                            <span className="text-[10px] font-black tabular-nums opacity-60">
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                            </span>
                          )}
                       </div>
                    </div>
                    
                    {/* Sparkline */}
                    <div className="h-20 w-full relative">
                      {l.stabilityWindows && l.stabilityWindows.length >= 2 ? (
                        <ResponsiveContainer width="99%" height="100%">
                          <AreaChart data={l.stabilityWindows.map(v => ({ v: v.averageValue }))}>
                            <defs>
                                <linearGradient id={`lab-grad-${l.vitalName.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={hex} stopOpacity={0.15} />
                                  <stop offset="100%" stopColor={hex} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="v" 
                              stroke={hex} 
                              strokeWidth={2.5} 
                              fill={`url(#lab-grad-${l.vitalName.replace(/[^a-zA-Z]/g, '')})`} 
                              isAnimationActive={true}
                              animationDuration={1500}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border-b border-dashed border-border/50">
                           <span className="text-[9px] font-black text-muted/30 uppercase tracking-widest">
                             {l.stabilityWindows?.length === 1 ? 'Single Point Baseline' : 'Awaiting Historical Baseline'}
                           </span>
                        </div>
                      )}
                    </div>

                    {/* Magnitude Indicator */}
                    <div className="space-y-1.5 pt-2">
                       <div className="flex justify-between text-[8px] font-black text-muted uppercase tracking-widest opacity-40">
                          <span>Stability</span>
                          <span>Shift</span>
                       </div>
                       <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(5, absDelta * 2))}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                       </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        );
      })}

      {trends.length > 5 && sections.some(s => trends.filter(t => (t.sectionName || 'General Results') === s).length > 6) && (
        <button
          onClick={() => setShowAllLabs(!showAllLabs)}
          className="w-full py-3 bg-surface-2 hover:bg-surface-3 border border-border rounded-2xl text-[11px] font-black text-muted transition-all uppercase tracking-widest"
        >
          {showAllLabs ? 'Show Less' : `Show All Clinical Markers (${trends.length})`}
        </button>
      )}
    </div>
  );
}

function TreatmentEffect({ correlations, normalizeVital }: { correlations: MedicationCorrelation[], normalizeVital: (name: string, value: number) => number }) {
  if (correlations.length === 0) return <EmptyState icon={Pill} title="Treatments & Outcomes" description="When medications are prescribed, their impact on your vitals will be correlated here." />;

  // TOP PERFORMER RANKING (Clinical Intelligence)
  const topMed = useMemo(() => {
    if (correlations.length < 1) return null;
    
    const getClincialScore = (m: MedicationCorrelation) => {
        const cat = m.drugCategory.toLowerCase();
        // Massively deprioritize supplements/vitamins/placebos for the top featured spot
        if (cat.includes('supplement') || cat.includes('vitamin') || cat.includes('nutrient')) return -1000;

        const improved = m.vitalDeltas.filter(d => d.interpretation === 'Improved');
        const degraded = m.vitalDeltas.filter(d => d.interpretation === 'Degraded');
        const sumImproved = improved.reduce((acc, d) => acc + Math.abs(d.delta), 0);
        
        // Ranking Formula: (Breadth of Impact * 10) + (Total Magnitude) - (Risk Penalty)
        let score = (improved.length * 15) + sumImproved - (degraded.length * 25);
        
        // Category Boost for high-impact therapeutic classes
        if (cat.includes('antidiabetic') || cat.includes('antihypertensive') || cat.includes('statin') || cat.includes('sglt2')) {
            score += 50;
        }
        return score;
    };

    return [...correlations].sort((a, b) => getClincialScore(b) - getClincialScore(a))[0];
  }, [correlations]);

  const improvedMarkers = topMed?.vitalDeltas.filter(d => d.interpretation === 'Improved') || [];
  const totalImpacted = topMed?.vitalDeltas.length || 1;
  const avgMagnitude = improvedMarkers.reduce((acc, d) => acc + Math.abs(d.delta), 0) / (improvedMarkers.length || 1);
  
  // Weighted Score: Rewards 'Breadth' (how many areas helped) twice as much as simple magnitude.
  // This makes a medicine that helps 24 different markers feel significantly more high-impact.
  const breadthFactor = (improvedMarkers.length / totalImpacted) * 1.8; 
  const holisticProgress = Math.min(avgMagnitude * breadthFactor, 100);

  const successRate = (improvedMarkers.length / totalImpacted) * 100;

  const outcomes = topMed?.vitalDeltas.reduce((acc, d) => {
    acc[d.interpretation] = (acc[d.interpretation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bestDelta = [...improvedMarkers].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  return (
    <div className="space-y-8">
      {topMed && correlations.length > 1 && (
        <GlassCard className="p-8 border-emerald-500/20 bg-emerald-500/[0.02]" glowColor="bg-emerald-500/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2.2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                   <Zap className="text-emerald-500 fill-emerald-500/20" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-600">Primary Clinical Driver</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                      {holisticProgress.toFixed(1)}% Weighted Progress
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-foreground capitalize tracking-tight">{topMed.medicationName}</h3>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">
                    Aggregated therapeutic impact across <span className="text-emerald-500 font-black">{improvedMarkers.length} improved indicators</span>
                  </p>
                  
                  {/* Detailed Stats Pills */}
                  {outcomes && (
                    <div className="flex gap-2 mt-3">
                      {Object.entries(outcomes).map(([label, count]) => (
                        <span key={label} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          label === 'Improved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 
                          label === 'Degraded' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-surface-3 text-muted border-border'
                        }`}>
                          {count} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
             </div>
             <div className="flex flex-col items-end">
                <div className="text-right">
                   <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">
                     Clinical Success Rate
                   </p>
                   <p className="text-4xl font-black text-emerald-500 tabular-nums">
                     {successRate.toFixed(0)}%
                   </p>
                   {bestDelta && (
                     <div className="flex items-center justify-end gap-1.5 mt-2 opacity-60">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest truncate max-w-[120px]">Peak: {bestDelta.vitalName}</span>
                        <span className="text-[10px] font-black text-emerald-600">
                          {bestDelta.delta > 0 ? '↑' : '↓'}{Math.abs(bestDelta.delta).toFixed(1)}%
                        </span>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-6">
        {correlations.map((med, idx) => (
          <MedicationImpactCard key={idx} med={med} normalizeVital={normalizeVital} />
        ))}
      </div>
    </div>
  );
}

function MedicationImpactCard({ med, normalizeVital }: { med: MedicationCorrelation, normalizeVital: (name: string, value: number) => number }) {
  const [viewType, setViewType] = useState<'graph' | 'card'>('card');

  const standardDeltas = med.vitalDeltas.filter(d => {
    const n = d.vitalName.toLowerCase();
    return Array.from(STANDARD_VITALS).some(v => 
        n.includes(v.toLowerCase()) || v.toLowerCase().includes(n)
    );
  });
  const labDeltas = med.vitalDeltas
    .filter(d => !standardDeltas.find(sd => sd.vitalName === d.vitalName))
    .sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));

  const outcomes = med.vitalDeltas.reduce((acc, d) => {
    acc[d.interpretation] = (acc[d.interpretation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const donutData = Object.entries(outcomes).map(([name, value]) => ({
    name, 
    value,
    color: name === 'Improved' ? '#22c55e' : name === 'Degraded' ? '#ef4444' : '#6366f1'
  }));

  const radarData = standardDeltas.map(d => ({
    vital: d.vitalName,
    before: normalizeVital(d.vitalName, d.avgBefore),
    after: normalizeVital(d.vitalName, d.avgAfter),
  }));

  return (
    <GlassCard className="p-8" glowColor="bg-blue-500/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Pill className="text-blue-500" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground capitalize">{med.medicationName} Impact Profile</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-500">
                {med.drugCategory}
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">Introduced {new Date(med.introducedAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           {/* View Toggle Switch */}
           <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-xl border border-border">
              <button 
                onClick={() => setViewType('card')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${viewType === 'card' ? 'bg-surface-3 text-primary shadow-sm' : 'text-muted hover:text-foreground'}`}
              >
                <Activity size={12} /> Cards
              </button>
              <button 
                onClick={() => setViewType('graph')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${viewType === 'graph' ? 'bg-surface-3 text-primary shadow-sm' : 'text-muted hover:text-foreground'}`}
              >
                <TrendingUp size={12} /> Graph
              </button>
           </div>

           <div className="flex gap-2">
              {Object.entries(outcomes).map(([label, count]) => (
                <span key={label} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  label === 'Improved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 
                  label === 'Degraded' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-surface-3 text-muted border-border'
                }`}>
                  {count} {label}
                </span>
              ))}
           </div>
        </div>
      </div>

      {med.primaryMarkers.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Key Markers to Watch</p>
          <div className="flex flex-wrap gap-2">
            {med.primaryMarkers.map(marker => {
              const delta = med.vitalDeltas.find(
                d => d.vitalName.toLowerCase() === marker.toLowerCase()
              );
              return (
                <span
                  key={marker}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${
                    delta?.interpretation === 'Improved'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : delta?.interpretation === 'Degraded'
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : 'bg-surface-2 border-border text-muted'
                  }`}
                >
                  {marker}
                  {delta && (
                    <span className="ml-1 opacity-60">
                      {delta.delta > 0 ? '↑' : '↓'}{Math.abs(delta.delta).toFixed(1)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Radar Comparison */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">Vital Signs: Before vs After</p>
          <div className="h-[280px] w-full">
            {radarData.length >= 1 ? (
              <ResponsiveContainer width="99%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
                  <PolarAngleAxis dataKey="vital" tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Before" dataKey="before" stroke="var(--border)" fill="var(--border)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                  <Radar name="After" dataKey="after" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={3} />
                  <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-surface-2/30 rounded-3xl border border-dashed border-border">
                <Activity size={24} className="text-muted/40 mb-3" />
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No Post-Medication Vitals</p>
                <p className="text-[9px] text-muted/60 mt-1 max-w-[200px]">Record a standard vital (e.g. Systolic) from a visit occurring on or after {new Date(med.introducedAt).toLocaleDateString()} to activate structural analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Outcome Donut */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Overall Impact Distribution</p>
          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-foreground">{med.vitalDeltas.length}</span>
              <span className="text-[9px] font-black text-muted uppercase">Parameters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Markers Section with View Toggle */}
      {labDeltas.length > 0 && (
        <div className="mt-10 pt-10 border-t border-border/50">
           <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">Secondary Clinical Marker Correlation</p>
              <div className="text-[9px] font-extrabold text-primary uppercase tracking-widest">
                {viewType === 'graph' ? 'Analysis Chart' : 'Insight Grid'}
              </div>
           </div>

           {viewType === 'graph' ? (
              <div style={{ height: Math.min(300, labDeltas.length * 40) }}>
                 <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={labDeltas.map(d => ({ name: d.vitalName.length > 20 ? d.vitalName.slice(0, 18) + '..' : d.vitalName, val: d.delta, int: d.interpretation }))} layout="vertical" margin={{ left: 20, right: 60 }}>
                       <XAxis type="number" hide domain={['dataMin - 5', 'dataMax + 5']} />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={140} tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 700 }} />
                       <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
                       <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={16}>
                          {labDeltas.map((t, i) => <Cell key={i} fill={t.interpretation === 'Improved' ? '#22c55e' : t.interpretation === 'Degraded' ? '#ef4444' : '#6366f1'} />)}
                          <LabelList dataKey="val" position="right" style={{ fontSize: 10, fontWeight: 800, fill: 'var(--muted)' }} formatter={(v: any) => (v > 0 ? '+' : '') + v.toFixed(1) + '%'} />
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {labDeltas.map(d => {
                   const color = d.interpretation === 'Improved' ? '#22c55e' : d.interpretation === 'Degraded' ? '#ef4444' : '#6366f1';
                   return (
                     <div key={d.vitalName} className="p-4 rounded-2xl bg-surface-2/40 border border-border flex items-center justify-between group hover:bg-surface-2/60 transition-all">
                        <div className="min-w-0">
                           <p className="text-[8px] font-black text-muted uppercase truncate pr-2">{d.vitalName}</p>
                           <p className="text-xs font-black text-foreground mt-0.5">
                             {d.avgAfter % 1 === 0 ? d.avgAfter : d.avgAfter.toFixed(1)}
                           </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[10px] font-black tabular-nums" style={{ color }}>
                             {d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}%
                           </span>
                           <div className="w-8 h-1 bg-surface-3 rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${Math.min(100, Math.abs(d.delta))}%`, backgroundColor: color }} />
                           </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
           )}
        </div>
      )}
    </GlassCard>
  );
}

function StabilityLifecycle({ timeline, patterns }: { timeline: StabilityTimeline | null, patterns: AbnormalityPattern[] }) {
  if (!timeline) return <EmptyState icon={History} title="Stability Timeline" description="Long-term health stability tracking requires at least two observation quarters." />;

  return (
    <div className="space-y-8">
      {/* Quarterly Distribution */}
      <GlassCard className="p-8">
        <SectionLabel icon={Activity}>Stability Score Distribution</SectionLabel>
        <div className="h-[280px] relative">
          <ResponsiveContainer width="99%" height="100%">
            <ComposedChart data={timeline.quarters} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'var(--muted)', fontWeight: 700 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted)', fontWeight: 700 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="stabilityScore" radius={[10, 10, 0, 0]} maxBarSize={50}>
                {timeline.quarters.map((q, i) => <Cell key={i} fill={getScoreColor(q.stabilityScore)} />)}
              </Bar>
              <Line type="monotone" dataKey="stabilityScore" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Abnormality Streaks */}
      <section className="space-y-4">
        <SectionLabel icon={ShieldAlert}>Clinical Anomalies & Streaks</SectionLabel>
        {patterns.length === 0 ? (
          <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
            <CheckCircle className="text-emerald-500" size={24} />
            <div>
              <p className="text-sm font-black text-foreground">Zero Anomaly Streaks</p>
              <p className="text-[11px] font-semibold text-muted">All physiological markers have remained within valid operational ranges across all visits.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map(p => (
              <GlassCard key={p.vitalName} className="p-6" glowColor="bg-red-500/5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[12px] font-black text-foreground uppercase tracking-widest">{p.vitalName}</p>
                  <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase">
                    {p.maxConsecutiveAbnormalVisits}x Streak
                  </span>
                </div>
                <div className="space-y-4">
                  {p.streaks.map((s, i) => (
                    <div key={i} className="space-y-1.5">
                       <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                         <div className="h-full bg-red-500" style={{ width: `${(s.consecutiveCount / 5) * 100}%` }} />
                       </div>
                       <p className="text-[10px] font-bold text-muted flex justify-between">
                         <span>{new Date(s.from).toLocaleDateString()} — {new Date(s.to).toLocaleDateString()}</span>
                         <span>{s.consecutiveCount} readings</span>
                       </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
