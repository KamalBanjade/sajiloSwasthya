'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    User,
    X,
    Lock,
    Hash,
    Fingerprint,
} from 'lucide-react';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import toast from 'react-hot-toast';

interface VerificationResult {
    isValid: boolean;
    message: string;
    isCertified: boolean;
    certifiedBy: string;
    certifiedAt: string;
    recordHash: string;
    signature: string;
    hashMatchesCurrentFile: boolean;
    integrityStatus: string;
}

interface RecordVerificationBadgeProps {
    recordId: string;
    isCertified: boolean;
    onVerificationComplete?: (isValid: boolean) => void;
}

/* ── Portal-based Modal ────────────────────────────────────────── */
function VerificationModal({
    result,
    onClose,
}: {
    result: VerificationResult;
    onClose: () => void;
}) {
    const isValid = result.isValid;

    // Lock body scroll when open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header Banner ── */}
                <div className={`relative px-8 pt-8 pb-6 ${isValid
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/40'
                    : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/60 dark:to-rose-950/40'
                    }`}>
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>

                    {/* Icon + title */}
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 p-3.5 rounded-2xl shadow-lg ${isValid
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                            }`}>
                            {isValid ? <ShieldCheck size={28} strokeWidth={2} /> : <ShieldAlert size={28} strokeWidth={2} />}
                        </div>
                        <div className="pt-1">
                            <h3 className={`text-xl font-black tracking-tight ${isValid
                                ? 'text-emerald-900 dark:text-emerald-50'
                                : 'text-red-900 dark:text-red-50'
                                }`}>
                                {isValid ? 'Authenticity Confirmed' : 'Security Warning'}
                            </h3>
                            <p className={`text-sm mt-1 font-medium leading-snug ${isValid
                                ? 'text-emerald-700/80 dark:text-emerald-300/80'
                                : 'text-red-700/80 dark:text-red-300/80'
                                }`}>
                                {result.message}
                            </p>
                        </div>
                    </div>

                    {/* Status pill */}
                    <div className={`inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${isValid
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                        {isValid
                            ? <><CheckCircle2 size={13} /> Integrity Status: {result.integrityStatus}</>
                            : <><XCircle size={13} /> Integrity Status: {result.integrityStatus}</>
                        }
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="px-8 py-6 space-y-5">

                    {/* Signer info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <User size={11} /> Certified By
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {result.certifiedBy || 'Unknown Doctor'}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <Calendar size={11} /> Signed At
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {result.certifiedAt
                                    ? new Date(result.certifiedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Verification checklist */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 bg-slate-100/60 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Verification Checklist
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Fingerprint size={15} className="text-indigo-400" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Digital Signature Valid</span>
                                </div>
                                {result.integrityStatus !== 'Invalid Signature'
                                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                                    : <XCircle size={18} className="text-red-500" />}
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Hash size={15} className="text-indigo-400" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">File Content Intact (Hash)</span>
                                </div>
                                {result.hashMatchesCurrentFile
                                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                                    : <XCircle size={18} className="text-red-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Cryptographic proof */}
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3">
                            <Lock size={10} /> Cryptographic Proof
                        </div>
                        <div className="space-y-2">
                            <div>
                                <span className="text-[9px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">SHA-256 Hash</span>
                                <p className="mt-0.5 text-[10px] font-mono text-indigo-800 dark:text-indigo-300 break-all leading-relaxed opacity-80 bg-white/50 dark:bg-indigo-900/20 rounded-lg px-2 py-1">
                                    {result.recordHash || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">RSA Signature (preview)</span>
                                <p className="mt-0.5 text-[10px] font-mono text-indigo-800 dark:text-indigo-300 break-all leading-relaxed opacity-80 bg-white/50 dark:bg-indigo-900/20 rounded-lg px-2 py-1">
                                    {result.signature ? `${result.signature.substring(0, 80)}…` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onClose}
                        className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white transition-all active:scale-[0.98] shadow-lg ${isValid
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/30'
                            : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-200 dark:shadow-black/30'
                            }`}
                    >
                        Understood
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

/* ── Main Badge Component ──────────────────────────────────────── */
export const RecordVerificationBadge: React.FC<RecordVerificationBadgeProps> = ({
    recordId,
    isCertified,
    onVerificationComplete
}) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleVerify = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const response = await medicalRecordsApi.verifySignature(recordId);
            const data = response.data;
            setResult(data);
            setShowDetails(true);

            if (data.isValid) {
                toast.success('Record verified authentic!');
            } else if (data.integrityStatus === 'File Tampered') {
                toast.error('TAMPERING DETECTED: File content changed!', { duration: 6000 });
            } else {
                toast.error('Verification failed: Invalid signature.');
            }

            if (onVerificationComplete) {
                onVerificationComplete(data.isValid);
            }
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Verification service unavailable.');
        } finally {
            setLoading(false);
        }
    };

    if (!isCertified) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-tight">
                <ShieldQuestion size={12} />
                Uncertified
            </span>
        );
    }

    return (
        <>
            <button
                onClick={handleVerify}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border shadow-sm
                    ${result
                        ? (result.isValid
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50')
                        : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-900 shadow-lg'
                    }`}
            >
                <div className="flex items-center justify-center shrink-0">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> :
                        result ? (result.isValid ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />) :
                            <ShieldCheck size={12} />}
                </div>
                <span className="leading-none pt-[1px]">
                    {loading ? 'Verifying...' : result ? (result.isValid ? 'Certified Authentic' : 'Tampered!') : 'Certified'}
                </span>
            </button>

            {showDetails && result && (
                <VerificationModal
                    result={result}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    );
};
