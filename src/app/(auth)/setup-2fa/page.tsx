'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/utils/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function Setup2FAPage() {
    const router = useRouter();
    const { user, checkAuth } = useAuthStore();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [setupData, setSetupData] = useState<{ qrCodeUri: string; manualEntryKey: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [hasConfirmedSave, setHasConfirmedSave] = useState(false);

    useEffect(() => {
        if (user?.twoFactorEnabled) {
            toast.error('Two-factor authentication is already enabled.');
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleInitiateSetup = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/auth/two-factor/setup');
            setSetupData(response.data.data);
            setStep(2);
        } catch (err) {
            toast.error('Failed to initiate 2FA setup.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (verificationCode.length !== 6) {
            toast.error('Please enter a 6-digit code.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/two-factor/enable', { code: verificationCode });
            setBackupCodes(response.data.data.backupCodes);
            setStep(4);
            toast.success('Two-factor authentication enabled!');
            await checkAuth(); // Update user state
        } catch (err) {
            toast.error('Invalid verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadBackupCodes = () => {
        const text = `Secure Medical Record System - Backup Recovery Codes\n\nUser: ${user?.email}\nGenerated on: ${new Date().toLocaleString()}\n\nCodes:\n${backupCodes.join('\n')}\n\nWARNING: Keep these codes safe. If you lose access to your authenticator, these are the only way back into your account.`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medical-system-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100">

            {/* Progress Stepper */}
            <div className="flex items-center justify-center space-x-4 mb-12">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {s}
                        </div>
                        {s < 4 && <div className={`w-8 h-0.5 mx-2 bg-slate-100 ${step > s ? 'bg-indigo-600' : ''}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Secure Your Account</h2>
                    <p className="text-slate-600">Two-factor authentication adds an extra layer of security by requiring a code from your phone whenever you sign in.</p>
                    <div className="pt-4 flex flex-col space-y-3">
                        <Button size="lg" onClick={handleInitiateSetup} isLoading={isLoading}>
                            Enable Two-Factor Now
                        </Button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-slate-500 font-medium hover:text-slate-900 transition-colors"
                            title="Skipping 2FA is not recommended."
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && setupData && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Scan QR Code</h2>
                        <p className="text-slate-600 mt-2">Open your authenticator app and scan the code below.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex justify-center">
                        <QRCodeSVG value={setupData.qrCodeUri} size={220} includeMargin={true} className="rounded-xl shadow-sm" />
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Cant scan it? Enter this key manually:</p>
                        <div className="bg-slate-100 p-4 rounded-xl font-mono text-center text-lg tracking-widest text-indigo-700 border border-slate-200">
                            {setupData.manualEntryKey}
                        </div>
                    </div>

                    <Button className="w-full h-12" size="lg" onClick={() => setStep(3)}>
                        Continue to Verification
                    </Button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Verify Identity</h2>
                        <p className="text-slate-600 mt-2">Enter the 6-digit code from your app to confirm setup.</p>
                    </div>

                    <Input
                        label="Verification Code"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="text-center text-2xl tracking-widest h-14"
                        autoFocus
                    />

                    <div className="flex space-x-4 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                        <Button className="flex-[2]" isLoading={isLoading} onClick={handleVerifyAndEnable}>Verify & Enable</Button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Setup Complete!</h2>
                        <p className="text-slate-600">Save these backup codes in a safe place. You can use them if you lose your phone.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-6 bg-slate-900 rounded-3xl">
                        {backupCodes.map((code) => (
                            <div key={code} className="bg-slate-800 text-white p-2 rounded-lg text-center font-mono tracking-tighter text-sm border border-slate-700">
                                {code}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Button variant="outline" size="sm" onClick={downloadBackupCodes}>Download</Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            navigator.clipboard.writeText(backupCodes.join('\n'));
                            toast.success('Codes copied!');
                        }}>Copy All</Button>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasConfirmedSave}
                                onChange={(e) => setHasConfirmedSave(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700">I have saved my backup codes securely</span>
                        </label>

                        <Button
                            className="w-full h-12"
                            size="lg"
                            disabled={!hasConfirmedSave}
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
