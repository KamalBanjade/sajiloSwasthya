'use client';

import React from 'react';

export function GlobalFooter() {
    return (
        <footer className="w-full pb-4 pt-2 flex flex-col items-center justify-center gap-4">
            {/* Minimal Policy Links */}
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] transition-opacity">
                <a href="/policies/privacy" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Privacy</a>
                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                <a href="/policies/terms" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Terms</a>
                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                <a href="/policies/security" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Security</a>
            </div>

            {/* Subtle Copyright Signature */}
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.25em]">
                &copy; 2026 <span className="text-slate-400 dark:text-slate-500">Sajilo स्वास्थ्य</span>
            </p>
        </footer>
    );
}
