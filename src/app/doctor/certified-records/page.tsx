'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import {
    FileText,
    Search,
    Download,
    ShieldCheck,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { useDoctorCertifiedRecords } from '@/hooks/useAdminQueries';
import { motion, AnimatePresence } from 'framer-motion';

import { MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { PageLayout, Section } from '@/components/layout/PageLayout';

export default function CertifiedRecordsPage() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [recordType, setRecordType] = useState('');
    const [activeCategory, setActiveCategory] = useState<'clinical' | 'uploads'>('clinical');

    const { data: recordsData, isLoading: loading } = useDoctorCertifiedRecords();
    const records = (recordsData as MedicalRecordResponseDTO[]) || [];

    const filteredRecords = records.filter((record: MedicalRecordResponseDTO) => {
        const matchesSearch =
            record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.originalFileName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = recordType === '' || record.recordType === recordType;

        // Category Logic (Clinical vs Uploads)
        const isClinical =
            record.uploadedBy?.startsWith('Dr.') ||
            record.recordType?.toLowerCase().includes('auto-generated') ||
            record.recordType?.toLowerCase().includes('clinical report');

        const matchesCategory = activeCategory === 'clinical' ? isClinical : !isClinical;

        return matchesSearch && matchesType && matchesCategory;
    });

    const handleDownload = async (recordId: string, fileName: string) => {
        try {
            await medicalRecordsApi.downloadRecordForDoctor(recordId);
        } catch (error) {
            toast.error('Failed to download secure record');
        }
    };

    const handlePreview = async (recordId: string) => {
        setLoadingRecordId(recordId);
        try {
            const url = await medicalRecordsApi.previewRecordForDoctor(recordId);
            if (url) setPreviewUrl(url);
        } catch (error) {
            // handled by API
        } finally {
            setLoadingRecordId(null);
        }
    };

    return (
        <PageLayout>
            <Section className="space-y-6">
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by patient name or file..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white"
                        />
                    </div>

                    {/* Category Toggle Integrated */}
                    <div className="inline-flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner shrink-0">
                        <button
                            onClick={() => setActiveCategory('clinical')}
                            className={`
                                px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                                ${activeCategory === 'clinical'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
                            `}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'clinical' ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'}`} />
                            Clinical Reports
                        </button>
                        <button
                            onClick={() => setActiveCategory('uploads')}
                            className={`
                                px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                                ${activeCategory === 'uploads'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
                            `}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'uploads' ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'}`} />
                            Patient Uploads
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeCategory === 'uploads' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full lg:w-auto"
                            >
                                <select
                                    value={recordType}
                                    onChange={(e) => setRecordType(e.target.value)}
                                    className="h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-primary transition-all cursor-pointer min-w-[160px] w-full"
                                >
                                    <option value="">All Categories</option>
                                    <option value="Lab Report">Lab Reports</option>
                                    <option value="Prescription">Prescriptions</option>
                                    <option value="Imaging">Imaging / Scans</option>
                                    <option value="Discharge Summary">Discharge Summaries</option>
                                    <option value="Other">Other</option>
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Table */}
                <ResponsiveTable<MedicalRecordResponseDTO>
                    loading={loading}
                    data={filteredRecords}
                    keyExtractor={(r) => r.id}
                    emptyState={
                        <div className="px-8 py-16 text-center">
                            <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">No certified records found</p>
                        </div>
                    }
                    columns={[
                        {
                            header: 'Document',
                            accessor: (r: MedicalRecordResponseDTO) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-slate-800 text-primary flex items-center justify-center flex-shrink-0">
                                        <FileText size={15} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.originalFileName}</p>
                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{r.recordType} · {r.fileSizeFormatted}</p>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: 'Patient',
                            accessor: (r: MedicalRecordResponseDTO) => (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{r.patientName}</p>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">ID: {r.patientId?.substring(0, 8)}</p>
                                </div>
                            )
                        },
                        {
                            header: 'Certified',
                            accessor: (r: MedicalRecordResponseDTO) => (
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        {r.certifiedAt ? format(new Date(r.certifiedAt), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <ShieldCheck size={10} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                            {r.isCertified ? (r.certifiedBy ? `Dr. ${r.certifiedBy}` : 'Verified') : 'Verified'}
                                        </span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: 'Actions',
                            className: 'text-right',
                            accessor: (r: MedicalRecordResponseDTO) => (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handlePreview(r.id)}
                                        disabled={loadingRecordId === r.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/10 disabled:opacity-50 active:scale-95"
                                    >
                                        {loadingRecordId === r.id ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
                                        {loadingRecordId === r.id ? 'Loading' : 'View'}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(r.id, r.originalFileName)}
                                        className="inline-flex items-center gap-1.5 p-2 text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                                    >
                                        <Download size={15} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    renderMobileCard={(r: MedicalRecordResponseDTO) => (
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{r.originalFileName}</p>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{r.recordType}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize truncate">{r.patientName}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {r.certifiedAt ? format(new Date(r.certifiedAt), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <ShieldCheck size={10} className="text-emerald-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                            {r.isCertified ? (r.certifiedBy ? `Dr. ${r.certifiedBy}` : 'Verified') : 'Verified'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePreview(r.id)}
                                    disabled={loadingRecordId === r.id}
                                    className="flex-1 h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loadingRecordId === r.id ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                                    {loadingRecordId === r.id ? 'Loading...' : 'View Record'}
                                </button>
                                <button
                                    onClick={() => handleDownload(r.id, r.originalFileName)}
                                    className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                />

                {previewUrl && (
                    <FullScreenRecordModal
                        pdfUrl={previewUrl}
                        onClose={() => setPreviewUrl(null)}
                    />
                )}
            </Section>
        </PageLayout>
    );
}
