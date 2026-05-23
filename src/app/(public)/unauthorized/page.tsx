'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center space-y-8 bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-none"
            >
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-rose-100 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20 shadow-lg shadow-rose-500/10">
                        <ShieldAlert size={48} strokeWidth={1.5} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Restricted</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                        You do not have the required permissions to view this secure medical module. Your access attempt has been logged for security purposes.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/">
                        <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white border-none font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 group">
                            <Home className="w-4 h-4 mr-2" />
                            Return to Dashboard
                        </Button>
                    </Link>
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        Sajilo स्वास्थ्य Security Protocol
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
