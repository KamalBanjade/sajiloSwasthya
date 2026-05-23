import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'glass' | 'ghost';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, variant = 'default', padding = 'md', className = '', ...props }: CardProps) {
    const variantClass = {
        'default': 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm',
        'elevated': 'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none',
        'glass': 'bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30',
        'ghost': 'bg-transparent border-dashed border-2 border-slate-200 dark:border-slate-800',
    }[variant];

    const paddingClass = {
        'none': 'p-0',
        'sm': 'p-3 sm:p-4',
        'md': 'p-4 sm:p-8',
        'lg': 'p-6 sm:p-10',
    }[padding];

    return (
        <div className={`rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden transition-all duration-300 ${variantClass} ${paddingClass} ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`flex flex-col space-y-1.5 mb-4 sm:mb-6 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`text-lg sm:text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={`text-sm text-slate-500 dark:text-slate-400 font-medium ${className}`} {...props}>
            {children}
        </p>
    );
}
