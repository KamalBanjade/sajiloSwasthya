'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/auth';

import { MedicalLoader } from '@/components/ui/MedicalLoader';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    requireTwoFactor?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    requireTwoFactor = false
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, hasChecked, checkAuth } = useAuthStore();

    useEffect(() => {
        // Initial auth check if not already loaded
        if (!hasChecked) {
            checkAuth();
        }
    }, [hasChecked, checkAuth]);

    useEffect(() => {
        if (!hasChecked || isLoading) return;

        // 1. Check Authentication
        if (!isAuthenticated) {
            // Don't redirect if we are already on login or register or public pages
            if (pathname !== '/login' && pathname !== '/register') {
                const returnUrl = encodeURIComponent(pathname);
                router.push(`/login?returnUrl=${returnUrl}`);
            }
            return;
        }

        // 2. Check Role Authorization
        if (requiredRole && user?.role !== requiredRole) {
            router.push('/unauthorized');
            return;
        }

        // 3. Check Two-Factor Enforcement
        if (requireTwoFactor && !user?.twoFactorEnabled) {
            router.push('/setup-2fa');
            return;
        }
    }, [isAuthenticated, isLoading, user, requiredRole, requireTwoFactor, router, pathname]);

    // Optimization: If we have a user and are authenticated (from persistence), 
    // don't show the loader even if a background check (isLoading) is happening.
    const showLoader = (!hasChecked || isLoading) && !isAuthenticated;

    if (showLoader) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl z-[9999]">
                <MedicalLoader />
            </div>
        );
    }

    // If we are authenticated and meet requirements, or if we are checking
    // but haven't redirected yet, we show nothing or children.
    // Actually, we should only show children if authenticated.
    if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
        return null;
    }

    // If role check fails, don't show children while redirecting
    if (requiredRole && user?.role !== requiredRole) {
        return null;
    }

    // If 2FA mandatory but not enabled
    if (requireTwoFactor && !user?.twoFactorEnabled) {
        return null;
    }

    return <>{children}</>;
};
