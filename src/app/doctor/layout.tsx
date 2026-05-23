'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="Doctor">
            <DashboardLayout role="Doctor">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
