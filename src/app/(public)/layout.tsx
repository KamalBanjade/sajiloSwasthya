'use client';

import React from 'react';
import Link from 'next/link';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo.webp" alt="Logo" className="h-9 w-auto object-contain" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Sajilo</span>
                                <span className="text-lg font-black text-indigo-600 tracking-tight uppercase">स्वास्थ्य</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">About</Link>
                        <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Contact</Link>
                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                        <Link href="/login" className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Sign In</Link>
                        <Link href="/register" className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all">Get Started</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <GlobalFooter />
        </div>
    );
}
