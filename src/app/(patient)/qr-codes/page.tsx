'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    QrCode,
    ShieldCheck,
    ShieldAlert,
    Download,
    Printer,
    RotateCw,
    Trash2,
    Copy,
    ExternalLink,
    AlertTriangle,
    Clock,
    Eye,
    CheckCircle2,
    X,
    Plus,
    Calendar,
    ChevronDown,
    Loader2
} from
    'lucide-react';
import { QRSkeleton } from '@/components/ui/QRSkeleton';
import { qrApi, QRCodeListItem, GenerateQRRequest } from '@/lib/api/qr';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/context/ConfirmContext';
import html2canvas from 'html2canvas';
import { EmergencyIDCard } from '@/components/patient/EmergencyIDCard';
import { patientApi, PatientProfileData } from '@/lib/api/patient';
import { PageLayout } from '@/components/layout/PageLayout';

export default function QRCodesPage() {
    const { confirm } = useConfirm();
    const { user } = useAuthStore();
    const router = useRouter();
    const [codes, setCodes] = useState<QRCodeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genType, setGenType] = useState<'Normal' | 'Emergency'>('Normal');
    const [genConfig, setGenConfig] = useState<GenerateQRRequest>({
        expiryDays: 30,
        format: 'png'
    });
    const [networkFrontendUrl, setNetworkFrontendUrl] = useState<string | null>(null);
    const generatingRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [patientProfile, setPatientProfile] = useState<PatientProfileData | null>(null);

    const fetchCodes = async () => {
        try {
            setLoading(true);
            const [qrRes, profileRes] = await Promise.all([
                qrApi.getMyCodes(),
                patientApi.getProfile()
            ]);
            
            if (qrRes.success) {
                setCodes(qrRes.data);
            }
            if (profileRes.success) {
                setPatientProfile(profileRes.data);
            }
            setError(null);
        } catch (err) {
            setError('Failed to fetch QR codes');
            toast.error('Failed to load access codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();

        // Fetch official network URL to ensure QR codes are reachable from doctor's mobile
        const fetchSystemInfo = async () => {
            try {
                const response = await fetch('/api/system/info');
                const data = await response.json();
                if (data.success) {
                    setNetworkFrontendUrl(data.data.frontendUrl);
                }
            } catch (e) {
                console.error("Failed to fetch system info", e);
            }
        };
        fetchSystemInfo();

        // Listen for Escape key to close modal
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowGenModal(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleRevoke = async (token: string) => {
        const confirmed = await confirm({
            title: 'Revoke QR Code',
            message: 'Are you sure you want to revoke this QR code? It will stop working immediately.',
            confirmText: 'Revoke',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const res = await qrApi.revokeToken(token);
            if (res.success) {
                toast.success("QR code revoked successfully");
                fetchCodes();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to revoke QR code");
        }
    };

    const handleGenerate = async () => {
        if (generatingRef.current) return;

        try {
            generatingRef.current = true;
            setIsGenerating(true);
            const res = genType === 'Normal' ?
                await qrApi.generateNormal(genConfig) :
                await qrApi.generateEmergency(genConfig);

            if (res.success) {
                toast.success(`${genType} QR code generated!`);
                setShowGenModal(false);
                fetchCodes();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to generate QR code");
        } finally {
            setIsGenerating(false);
            generatingRef.current = false;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
    };

    const downloadQR = async (token: string, type: 'Normal' | 'Emergency') => {
        if (type === 'Emergency') {
            const cardElement = document.getElementById('emergency-id-card-element');
            if (!cardElement) {
                toast.error("Could not find ID card element");
                return;
            }
            try {
                setIsGenerating(true);
                toast.loading('Generating high-res ID card...', { id: 'generating-card' });
                
                const canvas = await html2canvas(cardElement, {
                    scale: 3, // High resolution for printing
                    backgroundColor: null,
                    logging: false,
                    useCORS: true
                });
                const url = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = url;
                link.download = `Sajilo-Emergency-ID-${token.substring(0, 8)}.png`;
                link.click();
                
                toast.success('ID card generated successfully', { id: 'generating-card' });
            } catch (err) {
                toast.error("Failed to generate ID card image", { id: 'generating-card' });
                console.error(err);
            } finally {
                setIsGenerating(false);
            }
        } else {
            const canvas = document.getElementById(`qr-${token}`) as HTMLCanvasElement;
            if (!canvas) {
                toast.error("Could not find QR code element");
                return;
            }

            const url = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = url;
            link.download = `Sajilo-QR-${type}-${token.substring(0, 8)}.png`;
            link.click();
        }
    };

    const printQR = () => {
        window.print();
    };

    const normalCode = codes.find((c) => c.tokenType === 'Normal' && !c.isExpired);
    const emergencyCode = codes.find((c) => c.tokenType === 'Emergency' && !c.isExpired);

    if (loading) {
        return (
            <QRSkeleton />
        );
    }

    if (user && !user.totpSetupCompleted) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-12 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-black/30">
                    <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-rose-100 rounded-[32px] animate-ping opacity-20" />
                        <ShieldAlert className="w-12 h-12 text-rose-500 relative z-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                        Security Setup Required
                    </h2>
                    <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                        Before you can generate additional QR codes, you must complete your
                        initial security setup with Google Authenticator. This protects your
                        health information from unauthorized access.
                    </p>
                    <button
                        onClick={() => router.push('/complete-setup')}
                        className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">

                        <span>Complete Setup Now</span>
                        <RotateCw className="w-5 h-5" />
                    </button>

                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-8">
                        One-time setup • Takes &lt; 2 minutes
                    </p>
                </div>
            </div>);

    }

    return (
        <PageLayout>
            <div className="space-y-8">
            {/* Page Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => { setGenType('Normal'); setShowGenModal(true); }}
                    className="bg-white">

                    <Plus className="w-4 h-4 mr-2" />
                    New Normal QR
                </Button>
                <Button
                    variant="primary"
                    onClick={() => { setGenType('Emergency'); setShowGenModal(true); }}>

                    <ShieldAlert className="w-4 h-4 mr-2" />
                    New Emergency QR
                </Button>
            </div>

            {/* Featured Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Normal QR Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden group">

                    <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Standard Access</h3>
                                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Requires TOTP authentication</p>
                                </div>
                            </div>
                            {normalCode &&
                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                    Active
                                </span>
                            }
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="shrink-0 relative">
                                <div className="absolute -inset-2 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-[2.25rem] -z-10 group-hover:scale-105 transition-transform duration-500" />
                                {loading ? (
                                    <div className="w-[190px] h-[190px] flex items-center justify-center bg-indigo-50/30 rounded-[2rem]">
                                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                    </div>
                                ) : normalCode ?
                                    <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 print-only-qr">
                                        <QRCodeCanvas
                                            id={`qr-${normalCode.token}`}
                                            value={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin}/patient-access/${normalCode.token}`}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "/images/logo.webp",
                                                x: undefined,
                                                y: undefined,
                                                height: 40,
                                                width: 40,
                                                excavate: true
                                            }} />

                                    </div> :

                                    <div className="w-[212px] h-[212px] bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 gap-3">
                                        <QrCode className="w-12 h-12 opacity-20" />
                                        <p className="text-xs font-bold text-center px-4">No active standard QR code found</p>
                                    </div>
                                }
                            </div>

                            <div className="flex-1 space-y-4 w-full">
                                {normalCode ?
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                                <span>Access URL</span>
                                                <button onClick={() => {
                                                    const finalOrigin = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin;
                                                    copyToClipboard(`${finalOrigin}/patient-access/${normalCode.token}`);
                                                }} className="text-indigo-600 hover:text-indigo-700">Copy</button>
                                            </div>
                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all">
                                                {((typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin) || `http://${window.location.host}`).replace(/^https?:\/\//, '')}/patient-access/{normalCode.token}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Expires</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {format(new Date(normalCode.expiresAt), 'MMM dd, yyyy • hh:mm a')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scans</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{normalCode.accessCount} times</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4">
                                            <Button variant="outline" size="sm" onClick={() => downloadQR(normalCode.token, 'Normal')} className="rounded-xl">
                                                <Download className="w-3.5 h-3.5 mr-1.5" /> PNG
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => printQR()} className="rounded-xl">
                                                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleRevoke(normalCode.token)} className="rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Revoke
                                            </Button>
                                        </div>
                                    </> :

                                    <div className="h-full flex flex-col justify-center">
                                        <Button
                                            variant="outline"
                                            className="w-full py-6 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50/50"
                                            onClick={() => { setGenType('Normal'); setShowGenModal(true); }}>

                                            <Plus className="w-5 h-5 mr-2" />
                                            Generate Standard QR
                                        </Button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Emergency QR Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-rose-100 dark:border-white/20 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden group relative">

                    <div className="absolute top-0 right-0 p-8 pt-6">
                        <div className="animate-pulse flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.1em] border border-rose-100 dark:border-rose-500/20 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Emergency Ready
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Emergency Access</h3>
                                    <p className="text-sm font-semibold text-rose-500/80 italic flex items-center gap-1">
                                        ⚠️ Keep Secure - No Password Required
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="shrink-0 relative">
                                <div className="absolute -inset-2 bg-rose-50/50 dark:bg-rose-500/10 rounded-[2.25rem] -z-10 group-hover:scale-105 transition-transform duration-500" />
                                {loading ? (
                                    <div className="w-[212px] h-[212px] flex items-center justify-center bg-rose-50/30 rounded-[2rem]">
                                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                    </div>
                                ) : emergencyCode ?
                                    <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-rose-200 dark:border-rose-900/50 print-only-qr">
                                        <QRCodeCanvas
                                            id={`qr-${emergencyCode.token}`}
                                            value={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin}/emergency/${emergencyCode.token}`}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "/images/logo.webp",
                                                x: undefined,
                                                y: undefined,
                                                height: 40,
                                                width: 40,
                                                excavate: true
                                            }} />

                                    </div> :

                                    <div className="w-[212px] h-[212px] bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 gap-3">
                                        <QrCode className="w-12 h-12 opacity-20" />
                                        <p className="text-xs font-bold text-center px-4">No active emergency QR code found</p>
                                    </div>
                                }
                            </div>

                            <div className="flex-1 space-y-4 w-full text-left">
                                {emergencyCode ?
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Public Life-Line URL</p>
                                            <div className="px-3 py-2 bg-rose-50/30 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20 text-[10px] font-mono text-rose-700 dark:text-rose-400 break-all">
                                                {((typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin) || `http://${window.location.host}`).replace(/^https?:\/\//, '')}/emergency/{emergencyCode.token}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-widest">Expires</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {format(new Date(emergencyCode.expiresAt), 'MMM dd, yyyy • hh:mm a')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-widest">Safety Scan</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{emergencyCode.lastAccessedAt ? format(new Date(emergencyCode.lastAccessedAt), 'MMM dd, yyyy • hh:mm a') : 'Never used'}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4">
                                            <Button variant="outline" size="sm" onClick={() => downloadQR(emergencyCode.token, 'Emergency')} className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50">
                                                <Download className="w-3.5 h-3.5 mr-1.5" /> ID Card Size
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => printQR()} className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50">
                                                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Tag
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleRevoke(emergencyCode.token)} className="rounded-xl text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Revoke
                                            </Button>
                                        </div>
                                    </> :

                                    <div className="h-full flex flex-col justify-center">
                                        <Button
                                            variant="outline"
                                            className="w-full py-6 border-dashed border-rose-200 text-rose-600 hover:bg-rose-50/50"
                                            onClick={() => { setGenType('Emergency'); setShowGenModal(true); }}>

                                            <ShieldAlert className="w-5 h-5 mr-2" />
                                            Setup Emergency Access
                                        </Button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* History Table */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Code History</h2>
                    </div>

                    <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['All', 'Normal', 'Emergency'].map((f) =>
                            <button key={f} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">
                                {f}
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100/80 dark:bg-slate-800/50 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-700/50">
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Created</th>
                                <th className="px-8 py-4">Expiry</th>
                                <th className="px-8 py-4">Scans</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                            {loading ?
                                Array(3).fill(0).map((_, i) =>
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 h-16 bg-slate-50/10" />
                                    </tr>
                                ) :
                                codes.length === 0 ?
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                                            No QR codes generated yet.
                                        </td>
                                    </tr> :

                                    codes.map((code) =>
                                        <tr key={code.token} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    {code.tokenType === 'Normal' ?
                                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></div> :

                                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ShieldAlert className="w-4 h-4" /></div>
                                                    }
                                                    <span className="font-bold text-slate-700">{code.tokenType}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {code.isExpired ?
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-100 italic">Expired</span> :

                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 px-2 py-0.5 rounded bg-emerald-50">Active</span>
                                                }
                                            </td>
                                            <td className="px-8 py-5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-slate-200">{format(new Date(code.createdAt), 'MMM dd, yyyy')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{format(new Date(code.createdAt), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-slate-200">{format(new Date(code.expiresAt), 'MMM dd, yyyy')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{format(new Date(code.expiresAt), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{code.accessCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleRevoke(code.token)}
                                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">

                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generation Modal */}
            <AnimatePresence>
                {showGenModal &&
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowGenModal(false)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100">

                            <div className="p-8 pb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${genType === 'Normal' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <QrCode className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Generate {genType} QR</h3>
                                    </div>
                                    <button onClick={() => setShowGenModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Duration</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[30, 60, 90, 365].map((days) =>
                                                <button
                                                    key={days}
                                                    onClick={() => setGenConfig({ ...genConfig, expiryDays: days })}
                                                    className={`px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${genConfig.expiryDays === days ?
                                                        'border-secondary bg-secondary/5 text-secondary shadow-sm' :
                                                        'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`
                                                    }>

                                                    {days === 365 ? '1 Year' : `${days} Days`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Output Format</label>
                                        <div className="flex gap-3">
                                            {['png', 'svg'].map((f) =>
                                                <button
                                                    key={f}
                                                    onClick={() => setGenConfig({ ...genConfig, format: f as 'png' | 'svg' })}
                                                    className={`flex-1 px-4 py-3 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${genConfig.format === f ?
                                                        'border-indigo-600 bg-indigo-50/50 text-indigo-700' :
                                                        'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`
                                                    }>

                                                    {f}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {genType === 'Emergency' &&
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4">
                                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                            <p className="text-xs font-bold text-rose-700 leading-relaxed">
                                                Emergency QR codes bypass authentication. Proceed only if you understand that anyone with the physical code can view your critical medical info.
                                            </p>
                                        </div>
                                    }
                                </div>
                            </div>

                            <div className="p-8 pt-6 flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-2xl py-4" onClick={() => setShowGenModal(true)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" className="flex-1 rounded-2xl py-4" isLoading={isGenerating} onClick={handleGenerate}>
                                    Generate QR
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                }
            </AnimatePresence>
            <style jsx global>{`
                @media print {
                    body > *:not(.print-only-qr) {
                        display: none !important;
                    }
                    .print-only-qr {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        display: block !important;
                        border: none !important;
                        padding: 0 !important;
                        z-index: 9999 !important;
                    }
                    .print-only-qr canvas {
                        width: 400px !important;
                        height: 400px !important;
                    }
                }
            `}</style>

            {/* Hidden Emergency ID Card for Download */}
            {user && emergencyCode && (
                <div className="absolute -left-[9999px] top-0 pointer-events-none">
                    <EmergencyIDCard 
                        firstName={user.firstName}
                        lastName={user.lastName}
                        patientId={user.id}
                        dateOfBirth={user.dateOfBirth?.toString() || ''}
                        bloodType={patientProfile?.bloodType || user.bloodType}
                        address={patientProfile?.address}
                        occupation={patientProfile?.occupation}
                        emergencyContactName={patientProfile?.emergencyContactName}
                        emergencyContactRelationship={patientProfile?.emergencyContactRelationship}
                        emergencyContactPhone={patientProfile?.emergencyContactPhone}
                        accessUrl={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : networkFrontendUrl || window.location.origin}/emergency/${emergencyCode.token}`}
                    />
                </div>
            )}
            </div>
        </PageLayout>
    );
}