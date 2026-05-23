'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axiosInstance from '@/lib/utils/axios';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function ConfirmEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const confirmEmail = async () => {
            const userId = searchParams.get('userId');
            const token = searchParams.get('token');

            if (!userId || !token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                const response = await axiosInstance.get(`/auth/confirm-email`, {
                    params: { userId, token }
                });

                if (response.data.success) {
                    setStatus('success');
                    setMessage('Your email has been successfully verified! You can now log in to your account.');
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'Email verification failed.');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'An error occurred during verification. The link may have expired.');
            }
        };

        confirmEmail();
    }, [searchParams]);

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-8">
            {status === 'loading' && (
                <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h1 className="text-2xl font-bold text-slate-900">Verifying...</h1>
                    <p className="text-slate-500">{message}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verified!</h1>
                        <p className="text-slate-500">{message}</p>
                    </div>
                    <Button className="w-full h-11" onClick={() => router.push('/login')}>
                        Go to Login
                    </Button>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verification Failed</h1>
                        <p className="text-slate-500">{message}</p>
                    </div>
                    <Button className="w-full h-11" variant="outline" onClick={() => router.push('/login')}>
                        Back to Login
                    </Button>
                    <p className="text-sm text-slate-500">
                        Need help? <Link href="/register" className="text-indigo-600 hover:underline">Try registering again</Link>
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        }>
            <ConfirmEmailContent />
        </Suspense>
    );
}
