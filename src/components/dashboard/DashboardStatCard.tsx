import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
    icon: LucideIcon;
    accentColor: string; // Tailwind class like 'bg-indigo-500'
    delay?: number;
}

export function DashboardStatCard({
    title,
    value,
    change,
    trend,
    subtitle,
    icon: Icon,
    accentColor,
    delay = 0
}: DashboardStatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.08, duration: 0.4, ease: 'easeOut' }}
            className="bg-surface rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
        >
            {/* Decorative gradient patch */}
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${accentColor}`} />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                        {title}
                    </p>
                    <h3 className="text-3xl font-black text-foreground mb-2">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>

                    {change && (
                        <div className="flex items-center gap-1">
                            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                            <span className={`text-xs font-semibold ${
                                trend === 'up' ? 'text-emerald-500' :
                                trend === 'down' ? 'text-rose-500' :
                                'text-muted'
                            }`}>
                                {change}
                            </span>
                        </div>
                    )}

                    {subtitle && (
                        <p className="text-xs text-muted mt-1">{subtitle}</p>
                    )}
                </div>

                <div className={`p-3 rounded-xl ${accentColor} text-white shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </motion.div>
    );
}
