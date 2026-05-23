'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="Admin">
            <DashboardLayout role="Admin">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
