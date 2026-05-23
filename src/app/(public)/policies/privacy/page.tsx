'use client';

import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-12 animate-in fade-in duration-700">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-6">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Effective Date: April 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-lg font-medium leading-relaxed">
                        At <strong>Sajilo Swasthya</strong>, we recognize that medical data is among the most sensitive information an individual possesses. Our fundamental architecture is designed around the principle of minimal trust and maximum privacy. 
                        This mandate dictates how we collect, process, and cryptographically protect your health intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Database className="w-8 h-8 text-indigo-500" />
                        <h3 className="text-xl font-bold">1. Data Stewardship</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            We act as custodians, not owners, of your data. The architecture structurally prevents unauthorized secondary usage. Data is vaulted within secure enclaves and never utilized for unauthorized analytics or commercial targeting.
                        </p>
                    </div>
                    <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Lock className="w-8 h-8 text-emerald-500" />
                        <h3 className="text-xl font-bold">2. Patient-Centric Consent</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Access to your clinical records requires explicit, revocable authorization. You retain absolute transparency over who views your data, with immutable audit logs detailing every interaction within the network.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 mt-12">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Eye className="w-6 h-6 text-primary" />
                            Information Collection
                        </h2>
                        <ul className="mt-4 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
                            <li><strong>Clinical Data:</strong> Encounter notes, lab results, imagery, and prescriptions uploaded by verified medical practitioners.</li>
                            <li><strong>Identity Data:</strong> Name, contact details, and demographic markers required for strict identity verification.</li>
                            <li><strong>Audit Metadata:</strong> IP addresses and device fingerprints collected solely for security anomaly detection and audit logging.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold">Regulatory Alignment</h2>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                            This system is engineered to exceed standard medical compliance frameworks. Our cryptographic implementation ensures that patient data confidentiality, integrity, and availability are maintained according to strict global healthcare standards.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
