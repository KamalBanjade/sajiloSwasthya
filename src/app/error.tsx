'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to our production logger
        logger.error('Frontend application error', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">Something went wrong</h1>
                    <p className="text-slate-500">
                        An unexpected error occurred in the application. Our team has been notified.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => reset()} className="h-11 px-8">
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="h-11 px-8"
                    >
                        Go Home
                    </Button>
                </div>

                <p className="text-xs text-slate-400">
                    Error ID: {error.digest || 'Internal Client Error'}
                </p>
            </div>
        </div>
    );
}
