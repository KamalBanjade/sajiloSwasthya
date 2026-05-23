'use client';

import React, { useState, Suspense } from 'react';
import { MedicalRecordResponseDTO } from '@/lib/api';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import {
    ClipboardDocumentCheckIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { ChevronRight } from 'lucide-react';
import { useDoctorPendingRecords } from '@/hooks/useAdminQueries';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { DirectorySkeleton } from '@/components/ui/DirectorySkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

function PendingRecordsContent() {
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: recordsRes, isLoading } = useDoctorPendingRecords();

    const records = (recordsRes as any) || [];

    const handleReviewSuccess = () => {
        // Invalidation is now handled inside the modal component
    };

    const filteredRecords = records.filter((r: MedicalRecordResponseDTO) =>
        r.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageLayout className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 group w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search records or patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700">
                        {filteredRecords.length} Pending
                    </div>
                </div>
            </div>

            <ResponsiveTable
                loading={isLoading}
                data={filteredRecords}
                keyExtractor={(r: MedicalRecordResponseDTO) => r.id}
                emptyState={
                    <div className="px-8 py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/60 rounded-3xl flex items-center justify-center">
                            <ClipboardDocumentCheckIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Queue is Clear</p>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">All submitted records have been reviewed.</p>
                    </div>
                }
                columns={[
                    {
                        header: 'Document',
                        accessor: (r) => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 dark:bg-primary/5 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                    <DocumentTextIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.originalFileName}</p>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{r.fileSizeFormatted}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Patient',
                        accessor: (r) => (
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.patientName || 'Anonymous'}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Type',
                        accessor: (r) => (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {r.recordType || 'Other'}
                            </span>
                        )
                    },
                    {
                        header: 'Received',
                        accessor: (r) => (
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )
                    },
                    {
                        header: 'Action',
                        className: 'text-right',
                        accessor: (r) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedRecord(r)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/10 active:scale-95"
                                >
                                    Review
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        )
                    }
                ]}
                renderMobileCard={(r) => (
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                <DocumentTextIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{r.originalFileName}</p>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{r.fileSizeFormatted}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.patientName || 'Anonymous'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Received</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{new Date(r.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedRecord(r)}
                            className="w-full h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            Review Record
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            />

            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </PageLayout>
    );
}

export default function PendingRecordsPage() {
    return (
        <Suspense fallback={<DirectorySkeleton />}>
            <PendingRecordsContent />
        </Suspense>
    );
}
