'use client';

import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { AnalysisDashboard } from '@/components/analysis/AnalysisDashboard';
import { useAuthStore } from '@/store/authStore';
import { motion, Variants } from 'framer-motion';
import { BrainCircuit, Activity, ShieldCheck } from 'lucide-react';

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

export default function PatientIntelligencePage() {
    const { user } = useAuthStore();

    if (!user) return null;

    return (
        <PageLayout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="pb-12"
            >
                <motion.div variants={itemVariants}>
                    <AnalysisDashboard 
                        patientId={user.id} 
                        patientFullName={`${user.firstName} ${user.lastName}`} 
                    />
                </motion.div>
            </motion.div>
        </PageLayout>
    );
}
