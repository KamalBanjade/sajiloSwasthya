'use client';

import React from 'react';
import { Scale, FileText, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-12 animate-in fade-in duration-700">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-6">
                    <Scale size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Effective Date: April 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    By accessing or navigating the Sajilo Swasthya clinical network, you agree to bound by these terms. 
                    This platform serves as a secure cryptographic relay and storage layer for medical records connecting verified practitioners and patients.
                </p>

                <div className="space-y-6">
                    <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold">1. Professional Accountability (Doctors)</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Medical professionals utilizing this network cryptographically sign records using their RSA private keys. 
                                By affixing a signature, the practitioner attests to the clinical accuracy and integrity of the uploaded document at that moment in time. 
                                Falsification of records or sharing of credentials will result in immediate termination of network access.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold">2. Authorized Access (Patients)</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Patients are granted exclusive reading access to their clinical repository. 
                                You are responsible for safeguarding your authentication credentials and TOTP vectors. 
                                Medical decisions should always be made in direct consultation with a licensed practitioner, not solely based on automated intelligence outputs from this system.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <FileText className="w-6 h-6 text-primary shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold">3. System Limitations</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                While we guarantee high availability and cryptographic immutability of stored documents via Tigris and AES-256 protocols, 
                                Sajilo Swasthya is not liable for clinical errors resulting from misdiagnoses entered by medical professionals into the system.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
