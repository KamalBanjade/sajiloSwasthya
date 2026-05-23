import React from 'react';

export function H1({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase ${className}`} {...props}>
            {children}
        </h1>
    );
}

export function H2({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
            {children}
        </h2>
    );
}

export function H3({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function Text({ children, variant = 'body', className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement> & { variant?: 'body' | 'muted' | 'label' }) {
    const variantClass = {
        'body': 'text-base text-slate-700 dark:text-slate-300',
        'muted': 'text-sm font-medium text-slate-500 dark:text-slate-400',
        'label': 'text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500',
    }[variant];
    
    return (
        <p className={`${variantClass} ${className}`} {...props}>
            {children}
        </p>
    );
}
