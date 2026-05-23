'use client';

import React from 'react';
import { Server, Lock, Fingerprint, Activity, Database } from 'lucide-react';

export default function SecurityArchitecturePage() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-20 space-y-12 animate-in fade-in duration-700">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-6">
                    <Server size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Security Architecture</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">System Cryptography & Design</p>
            </div>

            <div className="p-8 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20 bg-medical-gradient relative overflow-hidden">
                <div className="absolute inset-0 bg-medical-pattern opacity-10" />
                <div className="relative z-10 text-lg font-medium leading-relaxed">
                    Sajilo Swasthya implements a defense-in-depth security model combining military-grade encryption, immutable cryptographic signatures, and strict role anomaly monitoring. This page details the technical safeguards protecting the patient vault.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Protocol 1 */}
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5 group hover:border-emerald-500/30 transition-colors">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Data Encryption (AES-256)</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        All patient medical records are symmetrically encrypted at rest using the <strong>AES-256 (Advanced Encryption Standard)</strong> algorithm in CBC mode with securely generated initialization vectors. The primary encryption keys are managed strictly via our backend configuration enclaves, rendering unauthorized database dumps unreadable.
                    </p>
                </div>

                {/* Protocol 2 */}
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5 group hover:border-indigo-500/30 transition-colors">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Fingerprint size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Digital Signatures (RSA)</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        To guarantee non-repudiation and document integrity, every clinical record uploaded is hashed using SHA-256 and cryptographically signed via <strong>RSA public key infrastructure</strong>. The practitioner's private key generates a verifiable signature ensuring that any alteration to the document invalidates the certification hash.
                    </p>
                </div>

                {/* Protocol 3 */}
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5 group hover:border-amber-500/30 transition-colors">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Vault Object Storage</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Binary files (PDFs, Imagery) are relayed through our .NET Core API and securely stored in encrypted <strong>Tigris Object Storage</strong> buckets. Temporary access is governed by short-lived pre-signed URL tokens, severely limiting the window for potential interception or unauthorized hotlinking.
                    </p>
                </div>

                {/* Protocol 4 */}
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5 group hover:border-rose-500/30 transition-colors">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Authentication & Telemetry</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        The gateway implements strict JWT-bearer authorization with rolling refresh mechanisms. Sensitive actions (like credential regeneration or admin escalation) trigger our custom <strong>Health Analysis Service</strong> which logs telemetry and emits real-time SignalR notifications for proactive threat intervention.
                    </p>
                </div>
            </div>
        </div>
    );
}
