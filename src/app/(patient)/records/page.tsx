'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
    MedicalRecordResponseDTO,
    UpdateMedicalRecordMetadataDTO,
    GroupedMedicalRecordsDTO,
    RecordSectionDTO,
    patientApi,
    medicalRecordsApi
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { usePatientRecordsGroups } from '@/hooks/useAdminQueries';
import { queryKeys } from '@/lib/queryKeys';
import { RecordsTimeline } from '@/components/patient/RecordsTimeline';
import { RecordCard } from '@/components/patient/RecordCard';
import {
    RefreshCw,
    UploadCloud,
    ArrowUpCircle,
    Bell,
    Calendar,
    Clock,
    UserCircle,
    CheckCircle,
    AlertCircle,
    X,
    FileText,
    ChevronDown
} from 'lucide-react';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useConfirm } from '@/context/ConfirmContext';
import { formatDate, normalizeUTC } from '@/lib/utils/dateUtils';
import { VaultSkeleton } from '@/components/ui/VaultSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

function PatientRecordsPageInner() {
    const queryClient = useQueryClient();
    const {
        data: recordsResponse,
        isLoading: loading,
        error: queryError
    } = usePatientRecordsGroups();

    const groupedData = recordsResponse?.data || null;
    const error = queryError ? 'Failed to fetch medical records' : null;

    const [editingRecord, setEditingRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [previewRecord, setPreviewRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { confirm } = useConfirm();

    // Filter State
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Edit State
    const [editDesc, setEditDesc] = useState('');
    const [editRecordType, setEditRecordType] = useState('');

    // Category State
    const [activeCategory, setActiveCategory] = useState<'clinical' | 'uploads'>('clinical');


    // Flatten records for activity timeline
    const allRecords = React.useMemo(() => {
        if (!groupedData) return [];
        return groupedData.sections.flatMap(s => s.records);
    }, [groupedData]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setEditingRecord(null);
        };
        if (editingRecord) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [editingRecord]);

    const handleDownload = useCallback(async (id: string, fileName: string) => {
        try {
            await medicalRecordsApi.downloadRecord(id);
        } catch (err) {
            toast.error(`Failed to download ${fileName}. Ensure you have the right permissions.`);
        }
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Record',
            message: 'Are you sure you want to delete this record? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            await medicalRecordsApi.deleteRecord(id);
            toast.success('Record deleted successfully.');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.records.all() });
        } catch (err) {
            toast.error('Failed to delete record');
        }
    }, [confirm, queryClient]);

    const handleEditOpen = useCallback((record: MedicalRecordResponseDTO) => {
        setEditingRecord(record);
        setEditDesc(record.description || '');
        setEditRecordType(record.recordType || 'Other');
    }, []);

    const handleEditSave = useCallback(async () => {
        if (!editingRecord) return;
        try {
            const payload: UpdateMedicalRecordMetadataDTO = {
                description: editDesc,
                recordType: editRecordType,
            };
            await medicalRecordsApi.updateRecordMetadata(editingRecord.id, payload);
            setEditingRecord(null);
            toast.success('Record details updated.');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.records.all() });
        } catch (err) {
            toast.error('Failed to update record details');
        }
    }, [editingRecord, editDesc, editRecordType, queryClient]);

    const handleSubmitRecord = useCallback(async (record: MedicalRecordResponseDTO) => {
        const confirmed = await confirm({
            title: 'Submit for Review',
            message: 'Ready to send this record to the doctor for certification?',
            confirmText: 'Submit Now',
            type: 'primary'
        });
        if (!confirmed) return;

        try {
            await medicalRecordsApi.submitForReview(record.id);
            toast.success('Record submitted for review.');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.records.all() });
        } catch (err) {
            toast.error('Failed to submit record.');
        }
    }, [confirm, queryClient]);

    const handleView = useCallback((record: MedicalRecordResponseDTO, url: string) => {
        setPreviewRecord(record);
        setPreviewUrl(url);
    }, []);

    // Stable callback for timeline date selection — defined here (not inside JSX) to satisfy Rules of Hooks
    const handleDateSelect = useCallback((dateStr: string) => {
        setFromDate(dateStr);
        setToDate(dateStr);

        const dayRecords = allRecords.filter(r =>
            new Date(normalizeUTC(r.uploadedAt)).toISOString().split('T')[0] === dateStr
        );
        const hasClinical = dayRecords.some(r =>
            r.uploadedBy?.startsWith('Dr.') ||
            r.recordType?.toLowerCase().includes('auto-generated') ||
            r.recordType?.toLowerCase().includes('clinical report')
        );
        const hasUpload = dayRecords.some(r => {
            const isClinical =
                r.uploadedBy?.startsWith('Dr.') ||
                r.recordType?.toLowerCase().includes('auto-generated') ||
                r.recordType?.toLowerCase().includes('clinical report');
            return !isClinical;
        });
        setActiveCategory(prev => {
            if (prev === 'clinical' && !hasClinical && hasUpload) return 'uploads';
            if (prev === 'uploads' && !hasUpload && hasClinical) return 'clinical';
            return prev;
        });
    }, [allRecords]);

    return (
        <PageLayout>
            <div className="space-y-10 pb-16">
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-3 text-sm font-bold border border-rose-100 dark:border-rose-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Unified Control Card: Filters, Upload, Toggles */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group transition-all duration-500 hover:shadow-2xl hover:border-secondary/20">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />

                <div className="p-6 space-y-7">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-6 justify-between">
                        {/* 1. Date Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            <div className="flex items-center gap-2.5 shrink-0">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Calendar className="w-4.5 h-4.5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Time Range</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Filter history</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                                    />
                                </div>

                                {(fromDate || toDate) && (
                                    <button
                                        onClick={() => { setFromDate(''); setToDate(''); }}
                                        className="px-3 py-1.5 text-[11px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg uppercase tracking-widest transition-all"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex justify-center order-first xl:order-none">
                            <Link
                                href="/records/upload"
                                className="group/btn relative flex items-center gap-3 px-6 py-2.5 border-2 border-secondary/30 text-secondary rounded-xl font-black text-[11px] tracking-widest uppercase transition-all duration-300 hover:border-secondary hover:bg-secondary/5 active:scale-95 overflow-hidden shadow-sm hover:shadow-md"
                            >
                                <div className="p-1 bg-secondary/10 rounded-lg group-hover/btn:rotate-[15deg] transition-transform duration-500">
                                    <UploadCloud className="w-3.5 h-3.5 text-secondary" />
                                </div>
                                <span>Secure Upload</span>
                            </Link>
                        </div>

                        {/* 3. Category Toggle */}
                        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shrink-0 self-center xl:self-auto shadow-inner">
                            <button
                                onClick={() => setActiveCategory('clinical')}
                                className={`
                                    px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-500
                                    ${activeCategory === 'clinical'
                                        ? 'bg-white dark:bg-slate-700 text-secondary shadow-[0_5px_15px_-5px_rgba(0,0,0,0.1)] scale-100'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                                `}
                            >
                                Clinical
                            </button>
                            <button
                                onClick={() => setActiveCategory('uploads')}
                                className={`
                                    px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-500
                                    ${activeCategory === 'uploads'
                                        ? 'bg-white dark:bg-slate-700 text-secondary shadow-[0_5px_15px_-5px_rgba(0,0,0,0.1)] scale-100'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                                `}
                            >
                                Uploads
                            </button>
                        </div>
                    </div>

                    {/* Activity History — Always visible */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-2 px-1 py-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex-1">
                                Activity History
                            </span>
                        </div>

                        <ActivityTimeline
                            records={allRecords}
                            onDateSelect={handleDateSelect}
                        />
                    </div>
                </div>
            </div>


            {/* Main Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loading && !groupedData ? (
                    <VaultSkeleton />
                ) : groupedData ? (
                    <FilteredTimeline
                        data={groupedData}
                        fromDate={fromDate}
                        toDate={toDate}
                        category={activeCategory}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onEdit={handleEditOpen}
                        onSubmit={handleSubmitRecord}
                        onView={handleView}
                    />
                ) : null}
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => {
                        setPreviewRecord(null);
                        setPreviewUrl(null);
                    }}
                />
            )}

            {/* Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Metadata</h3>
                            <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Record Category</label>
                                <select
                                    value={editRecordType}
                                    onChange={(e) => setEditRecordType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="Lab Report">Lab Report</option>
                                    <option value="Prescription">Prescription</option>
                                    <option value="X-Ray">X-Ray</option>
                                    <option value="CT Scan">CT Scan</option>
                                    <option value="MRI">MRI</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-medium text-sm focus:ring-2 focus:ring-primary outline-none h-32"
                                />
                            </div>
                        </div>

                        <div className="p-6 flex gap-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleEditSave}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-md"
                            >
                                Save Updates
                            </button>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </PageLayout>
    );
}

function ActivityTimeline({ 
    records, 
    onDateSelect 
}: { 
    records: MedicalRecordResponseDTO[],
    onDateSelect: (date: string) => void 
}) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const timelineData = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find earliest upload or default to 90 days ago
        let earliestDate = new Date(today);
        earliestDate.setDate(today.getDate() - 90);

        if (records.length > 0) {
            const firstUploadTime = records.reduce(
                (min, r) => Math.min(min, new Date(normalizeUTC(r.uploadedAt)).getTime()),
                Infinity
            );
            const firstUploadDate = new Date(firstUploadTime);
            firstUploadDate.setHours(0, 0, 0, 0);
            
            // Set start to exactly 1 month before the first upload
            earliestDate = new Date(firstUploadDate);
            earliestDate.setMonth(earliestDate.getMonth() - 1);
        }

        // Performance Optimization: Group records by date string FIRST
        const recordsByDate = new Map<string, { hasClinical: boolean; hasUpload: boolean; count: number }>();
        
        for (const r of records) {
            const dateStr = new Date(normalizeUTC(r.uploadedAt)).toISOString().split('T')[0];
            const isClinical = r.uploadedBy?.startsWith('Dr.') ||
                               r.recordType?.toLowerCase().includes('auto-generated') ||
                               r.recordType?.toLowerCase().includes('clinical report');
            
            const existing = recordsByDate.get(dateStr) || { hasClinical: false, hasUpload: false, count: 0 };
            existing.count++;
            if (isClinical) existing.hasClinical = true;
            else existing.hasUpload = true;
            
            recordsByDate.set(dateStr, existing);
        }

        const data = [];
        const diffDays = Math.ceil((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
        
        for (let i = diffDays; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const stats = recordsByDate.get(dateStr) || { hasClinical: false, hasUpload: false, count: 0 };

            data.push({
                date,
                dateStr,
                hasClinical: stats.hasClinical,
                hasUpload: stats.hasUpload,
                count: stats.count
            });
        }
        return data;
    }, [records]);

    // Auto-scroll to end (today) on mount
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [timelineData]);

    return (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-end mb-4 px-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-md shadow-secondary/20" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clinical Team</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-md shadow-primary/20" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Your Uploads</span>
                    </div>
                </div>
            </div>

            <div className="relative group/timeline min-h-[140px]">
                <div 
                    ref={scrollRef}
                    className="flex items-end gap-2.5 overflow-x-auto pb-4 pt-6 px-10 scrollbar-hide scroll-smooth"
                    style={{ 
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                    }}
                >
                    {timelineData.map((day, idx) => {
                        const isToday = day.date.getTime() === new Date().setHours(0, 0, 0, 0);
                        const isFirstOfMonth = day.date.getDate() === 1;
                        const isFirstOfYear = isFirstOfMonth && day.date.getMonth() === 0;

                        return (
                            <div
                                key={idx}
                                className="flex flex-col items-center shrink-0 min-w-[34px]"
                            >
                                {/* 1. The Interactive Dot with Tooltip */}
                                <div className="h-10 flex items-center justify-center relative group/dot">
                                    <div
                                        onClick={() => onDateSelect(day.dateStr)}
                                        className={`
                                            cursor-pointer transition-all duration-300 hover:scale-125
                                            ${day.hasClinical ? 'w-5.5 h-5.5 bg-secondary ring-6 ring-secondary/10 shadow-xl shadow-secondary/30 rounded-full' :
                                              day.hasUpload ? 'w-5.5 h-5.5 bg-primary ring-6 ring-primary/10 shadow-xl shadow-primary/30 rounded-full' :
                                              'w-3 h-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-400 rounded-full'}
                                            ${isToday ? 'animate-pulse ring-offset-4 ring-2 ring-slate-400' : ''}
                                        `}
                                    />
                                    
                                    {day.count > 0 && (
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover/dot:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-2xl border border-white/10 scale-0 group-hover/dot:scale-100 min-w-max">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="uppercase tracking-tighter">{formatDate(day.date.toISOString())}</span>
                                                <span className="text-[9px] text-emerald-400 font-black">{day.count} {day.count === 1 ? 'RECORD' : 'RECORDS'}</span>
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-b-[8px] border-b-slate-900 dark:border-b-slate-700" />
                                        </div>
                                    )}
                                </div>

                                {/* 2. The Month/Year Label (Always below tooltip range) */}
                                <div className="h-8 mt-5 border-t border-slate-100 dark:border-slate-800/50 w-full flex items-center justify-center relative">
                                    {isFirstOfMonth && (
                                        <div className={`flex flex-col items-center leading-none ${isFirstOfYear ? 'text-primary' : 'text-slate-400'}`}>
                                            <span className="text-[11px] font-black uppercase tracking-tighter pt-1.5">
                                                {day.date.toLocaleString('default', { month: 'short' })}
                                            </span>
                                            {isFirstOfYear && (
                                                <span className="text-[10px] font-black opacity-80">{day.date.getFullYear()}</span>
                                            )}
                                        </div>
                                    )}
                                    {isFirstOfMonth && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-slate-200 dark:bg-slate-700" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function PatientRecordsPage() {
    return (
        <Suspense fallback={<VaultSkeleton />}>
            <PatientRecordsPageInner />
        </Suspense>
    );
}
const FilteredTimeline = React.memo(function FilteredTimeline({
    data,
    fromDate,
    toDate,
    category,
    onDownload,
    onDelete,
    onEdit,
    onSubmit,
    onView
}: {
    data: GroupedMedicalRecordsDTO;
    fromDate: string;
    toDate: string;
    category: 'clinical' | 'uploads';
    onDownload: any;
    onDelete: any;
    onEdit: (record: MedicalRecordResponseDTO) => void;
    onSubmit: (record: MedicalRecordResponseDTO) => void;
    onView: (record: MedicalRecordResponseDTO, url: string) => void;
}) {
    const filteredSections = React.useMemo(() => {
        const start = fromDate ? new Date(fromDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = toDate ? new Date(toDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return data.sections.map((section: any) => {
            const filteredRecords = section.records.filter((record: MedicalRecordResponseDTO) => {
                // 1. Date Filter
                const recordDate = new Date(normalizeUTC(record.uploadedAt));
                if (start && recordDate < start) return false;
                if (end && recordDate > end) return false;

                // 2. Category Filter (Smart Logic)
                const isClinical =
                    record.uploadedBy?.startsWith('Dr.') ||
                    record.recordType?.toLowerCase().includes('auto-generated') ||
                    record.recordType?.toLowerCase().includes('clinical report');

                if (category === 'clinical' && !isClinical) return false;
                if (category === 'uploads' && isClinical) return false;

                return true;
            });

            return {
                ...section,
                records: filteredRecords,
                recordCount: filteredRecords.length
            };
        }).filter((section: any) => section.records.length > 0);
    }, [data, fromDate, toDate, category]);

    const { attentionRequired, mainTimeline } = React.useMemo(() => {
        const allRecords: MedicalRecordResponseDTO[] = filteredSections.flatMap((s: any) => s.records);

        // Draft (0) or Pending (1) go to attention required
        const urgent = allRecords.filter(r => r.state === 0 || r.state === 1);

        // Certified (2), Emergency (3), Archived (4) go to main timeline
        return {
            attentionRequired: urgent,
            mainTimeline: filteredSections
        };
    }, [filteredSections]);

    if (filteredSections.length === 0) {
        return (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 border-dashed">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No Records Found</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {category === 'clinical'
                        ? 'No professional clinical reports available yet.'
                        : 'You haven\'t uploaded any personal medical documents.'}
                </p>
                {(fromDate || toDate) && (
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 text-xs font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-0.5"
                    >
                        Clear Date Filters
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Urgent Section */}
            {attentionRequired.length > 0 && !fromDate && !toDate && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="p-2 bg-primary rounded-lg shadow-md">
                            <Bell className="w-5 h-5 text-white animate-bounce" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Awaiting Action</h2>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Found {attentionRequired.length} items requiring review</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attentionRequired.map(record => (
                            <RecordCard
                                key={`urgent-${record.id}`}
                                record={record}
                                onDownload={onDownload}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onSubmit={onSubmit}
                                onView={onView}
                            />
                        ))}
                    </div>

                    <div className="border-b-4 border-dashed border-slate-100 dark:border-slate-800 my-8" />
                </div>
            )}

            <RecordsTimeline
                data={{
                    totalCount: filteredSections.reduce((acc, s) => acc + s.recordCount, 0),
                    sections: mainTimeline
                }}
                onDownload={onDownload}
                onDelete={onDelete}
                onEdit={onEdit}
                onSubmit={onSubmit}
                onView={onView}
            />
        </div>
    );
});
