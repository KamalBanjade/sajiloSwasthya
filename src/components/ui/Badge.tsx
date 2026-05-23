'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'slate';
  children: React.ReactNode;
}

export function Badge({ children, variant = 'primary', className = '', ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    secondary: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
