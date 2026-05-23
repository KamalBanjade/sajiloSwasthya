'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
    CheckCircleIcon,
    ClipboardIcon,
    ChevronRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/utils/axios';
import { useConfirm } from '@/context/ConfirmContext';

interface SetupData {
    totpQRData: string;
    totpSecretManual: string;
}

import { motion, AnimatePresence } from 'framer-motion';

export default function CompleteSetupPage() {
    const { confirm } = useConfirm();
    const router = useRouter();
    const { user, checkAuth } = useAuthStore();
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [totpScanned, setTotpScanned] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            await checkAuth();
            if (user?.twoFactorEnabled && (user as any).totpSetupCompleted) {
                router.push('/dashboard');
                return;
            }

            try {
                const response = await axiosInstance.get('auth/setup-data');
                if (response.data.success) {
                    const apiData = response.data.data;
                    const formattedData = {
                        totpQRData: apiData.totpSetupQRData,
                        totpSecretManual: apiData.totpSecretManual
                    };
                    setSetupData(formattedData);
                    setIsLoading(false);
                } else {
                    toast.error('Could not fetch setup data. Please log in again.');
                    router.push('/login');
                }
            } catch (error) {
                toast.error('Setup data not found. Please log in or register again.');
                router.push('/login');
            }
        };

        checkStatus();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleCompleteSetup = async () => {
        if (!totpScanned || verificationCode.length !== 6) {
            toast.error('Please complete all steps and verify your code.');
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post('auth/complete-setup', {
                totpCode: verificationCode,
                totpScanned: true,
                medicalQRSaved: true
            });

            await checkAuth();
            toast.success('Security setup completed!');
            sessionStorage.removeItem('registrationSetupData');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed. Please check your code.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !setupData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Secure Setup...</p>
            </div>
        );
    }

    const canComplete = totpScanned && verificationCode.length === 6;

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[550px]"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] sm:rounded-[40px] shadow-2xl border border-slate-50 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[80px]" />

                    {/* Integrated Logo Section */}
                    <div className="relative z-10 text-center space-y-1 mb-6">
                        <div className="flex justify-center mb-2">
                            <div className="p-2 bg-gradient-to-b from-secondary/10 to-white/0 dark:from-secondary/20 dark:to-transparent rounded-xl">
                                <img
                                    src="/images/logo.webp"
                                    alt="Sajilo Swasthya"
                                    className="h-10 w-auto object-contain drop-shadow-sm dark:brightness-110"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="relative w-fit mx-auto">
                                <img
                                    src="/images/sajilo.webp"
                                    alt="Sajilo"
                                    className="h-12 w-auto object-contain translate-x-[-12px] dark:brightness-110"
                                />
                                <span className="absolute text-[12px] font-semibold text-secondary dark:text-secondary-light tracking-[0.05em] font-amita inline-block" style={{ bottom: '2px', right: '-16px' }}>
                                    स्वास्थ्य
                                </span>
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 font-black text-[8px] uppercase tracking-[0.3em] mt-1">Security Onboarding</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Two Column Grid for Desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-slate-50 dark:border-slate-800/50 pt-6">
                            {/* QR Code Section */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3"
                            >
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                    <QRCodeSVG 
                                        value={setupData.totpQRData} 
                                        size={150} 
                                        level="H"
                                        imageSettings={{
                                            src: "/images/logo.webp",
                                            x: undefined,
                                            y: undefined,
                                            height: 35,
                                            width: 35,
                                            excavate: true,
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Scan QR</span>
                                </div>
                            </motion.div>

                            {/* Manual Entry & Instructions */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Setup App</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        Scan the code or enter the key manually into your Authenticator app.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Secret Key</span>
                                        <button
                                            onClick={() => copyToClipboard(setupData.totpSecretManual)}
                                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 hover:underline flex items-center gap-1 transition-colors"
                                        >
                                            <ClipboardIcon className="w-3 h-3" /> Copy
                                        </button>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                        <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 tracking-widest uppercase">
                                            {setupData.totpSecretManual}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Verification Code Section */}
                        <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-center text-2xl font-black tracking-[0.4em] focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900 dark:text-white"
                                placeholder="000000"
                            />
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="px-1">
                            <label className="flex items-center gap-3 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 cursor-pointer group/check transition-all hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20">
                                <input
                                    type="checkbox"
                                    checked={totpScanned}
                                    onChange={(e) => setTotpScanned(e.target.checked)}
                                    className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary transition-all cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-100 group-hover:text-primary transition-colors">
                                        I've Added the Account to Authenticator
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium tracking-tight">Verify you see the 6-digit code in your app</span>
                                </div>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={handleCompleteSetup}
                                disabled={!canComplete || isSubmitting}
                                className={`w-full h-14 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-300 ${canComplete
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-emerald-600 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? 'Verifying Securely...' : 'Complete Secure Setup'}
                                <ChevronRightIcon className={`w-5 h-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                            </button>

                            <div className="text-center">
                                <button
                                    onClick={async () => {
                                        const confirmed = await confirm({
                                            title: 'Skip for now?',
                                            message: "You'll need to set this up later to share records.",
                                            confirmText: 'Skip Setup',
                                            type: 'warning'
                                        });
                                        if (confirmed) router.push('/dashboard');
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors underline underline-offset-4 uppercase tracking-widest"
                                >
                                    Setup Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
