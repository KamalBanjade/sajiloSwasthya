import React from 'react';
import { GlobalFooter } from '@/components/layout/GlobalFooter';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen bg-medical-gradient relative overflow-hidden flex flex-col p-4 sm:p-6">
            <div className="absolute inset-0 bg-medical-pattern pointer-events-none opacity-50" />

            <div className="flex-1 relative z-10 w-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex flex-col items-center justify-between overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8">
                    <div className="flex-1 flex items-center justify-center w-full py-4">
                        {children}
                    </div>
                    <GlobalFooter />
                </div>
            </div>
        </div>
    );
}
