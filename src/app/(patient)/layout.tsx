'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="Patient">
            <DashboardLayout role="Patient">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
