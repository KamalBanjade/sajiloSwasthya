import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

interface DoctorStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'error';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  trend?: 'up' | 'down' | 'neutral';
  pulseAnimation?: boolean;
  delay?: number;
}

export function DoctorStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  priority = 'medium',
  trend,
  pulseAnimation = false,
  delay = 0
}: DoctorStatCardProps) {
  const colorClasses: Record<string, { accent: string; glow: string }> = {
    primary: { accent: 'bg-indigo-500', glow: 'bg-indigo-500/20' },
    secondary: { accent: 'bg-teal-500', glow: 'bg-teal-500/20' },
    accent: { accent: 'bg-blue-500', glow: 'bg-blue-500/20' },
    warning: { accent: 'bg-amber-500', glow: 'bg-amber-500/20' },
    success: { accent: 'bg-emerald-500', glow: 'bg-emerald-500/20' },
    error: { accent: 'bg-rose-500', glow: 'bg-rose-500/20' }
  };
  
  const selectedColors = colorClasses[color] || colorClasses.primary;
  
  return (
    <motion.div
        variants={itemVariants}
        transition={{ delay: delay * 0.07 }}
        className={`group relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-4 lg:p-5 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-sm cursor-default`}
    >
        {pulseAnimation && (
            <div className="absolute top-3 right-3 z-20">
                <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                </span>
            </div>
        )}

        {/* Soft glow */}
        <div className={`absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 blur-2xl ${selectedColors.glow}`} />

        {/* Decorative icon watermark */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-[0.03] pointer-events-none text-slate-900 dark:text-white">
            <Icon className="w-20 h-20" />
        </div>

        <div className="relative z-10 flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${selectedColors.accent} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-4 h-4" />
            </div>
            {trend && trend !== 'neutral' && (
                <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${trend === 'up'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                    {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {trend === 'up' ? 'Up' : 'Down'}
                </span>
            )}
        </div>

        <div className="relative z-10">
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-0.5 leading-none">
                {value}
            </div>
            <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</div>
            {subtitle && <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">{subtitle}</div>}
        </div>
    </motion.div>
  );
}
