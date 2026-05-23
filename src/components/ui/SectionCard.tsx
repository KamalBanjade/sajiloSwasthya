import React from 'react';

export type SectionCardAccent = 'primary' | 'secondary' | 'indigo' | 'violet' | 'amber' | 'emerald' | 'fuchsia' | 'rose' | 'sky' | 'teal';

interface SectionCardProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    desc?: string; // Shorthand
    children: React.ReactNode;
    accent?: SectionCardAccent;
    action?: React.ReactNode;
    className?: string;
}

const themes: Record<SectionCardAccent, string> = {
    primary: 'bg-primary group-hover:shadow-primary/20',
    secondary: 'bg-secondary group-hover:shadow-secondary/20',
    indigo: 'bg-indigo-500 group-hover:shadow-indigo-500/20',
    violet: 'bg-violet-500 group-hover:shadow-violet-500/20',
    amber: 'bg-amber-500 group-hover:shadow-amber-500/20',
    emerald: 'bg-emerald-500 group-hover:shadow-emerald-500/20',
    fuchsia: 'bg-fuchsia-500 group-hover:shadow-fuchsia-500/20',
    rose: 'bg-rose-500 group-hover:shadow-rose-500/20',
    sky: 'bg-sky-500 group-hover:shadow-sky-500/20',
    teal: 'bg-teal-500 group-hover:shadow-teal-500/20'
};

const lightThemes: Record<SectionCardAccent, string> = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    violet: 'bg-violet-500/10 text-violet-500',
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-500',
    rose: 'bg-rose-500/10 text-rose-500',
    sky: 'bg-sky-500/10 text-sky-500',
    teal: 'bg-teal-500/10 text-teal-500'
};

export function SectionCard({ 
    icon, 
    title, 
    description,
    desc,
    children, 
    accent = 'primary', 
    action,
    className = "" 
}: SectionCardProps) {
    return (
        <div className={`group/card bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm hover:shadow-premium transition-all duration-500 relative overflow-hidden ${className}`}>
            <div className={`absolute top-0 left-0 w-2 h-0 group-hover/card:h-full ${themes[accent]} transition-all duration-700`} />
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1.25rem] ${lightThemes[accent]} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] leading-tight">{title}</h2>
                        {(description || desc) && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-70">
                                {description || desc}
                            </p>
                        )}
                        <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800 mt-2 rounded-full" />
                    </div>
                </div>
                {action && (
                    <div className="relative z-20">
                        {action}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
