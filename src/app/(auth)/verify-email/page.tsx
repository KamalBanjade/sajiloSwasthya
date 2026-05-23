'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
    const { resendVerificationEmail } = useAuthStore();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) {
            toast.error('Email address not found. Please try logging in.');
            return;
        }

        setIsResending(true);
        try {
            await resendVerificationEmail(email);
            toast.success('Verification link resent!', {
                duration: 5000,
                style: {
                    borderRadius: '16px',
                    background: '#1e293b',
                    color: '#fff',
                },
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend verification link.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verify Your Email</h1>
                <p className="text-slate-500">We've sent a verification link to {email || 'your email address'}.</p>
            </div>

            <Button 
                className="w-full h-11" 
                onClick={handleResend}
                isLoading={isResending}
            >
                Resend Email
            </Button>

            <div className="text-center">
                <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    ← Back to Login
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-8 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto" />
                <div className="space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
                </div>
                <div className="h-11 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
