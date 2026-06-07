'use client';
import React, { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import {
    ChevronLeft, User, Mail, Phone, Calendar,
    ShieldAlert, Activity, Clock, FileText, Loader2,
    UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';

function AdminPatientDetailContent() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewRecord, setPreviewRecord] = useState<any | null>(null);
    const [viewLoading, setViewLoading] = useState<string | null>(null);

    // Fetch user details via admin/users/{id}
    const { data: userRes, isLoading: userLoading } = useQuery({
        queryKey: ['admin', 'user', patientId],
        queryFn: () => adminApi.getUserById(patientId),
        staleTime: 1000 * 60 * 5,
    });

    // Fetch medical records via admin-accessible endpoint
    const { data: medicalRecordsRes, isLoading: recordsLoading } = useQuery({
        queryKey: ['admin', 'patient', patientId, 'records'],
        queryFn: () => medicalRecordsApi.getPatientRecordsForDoctor(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const user = userRes ?? null;
    const isLoading = userLoading;

    const medicalDataRaw = (medicalRecordsRes as any)?.data ?? (medicalRecordsRes as any)?.Data ?? [];
    const records = Array.isArray(medicalDataRaw) ? medicalDataRaw : [];

    const [activeCategory, setActiveCategory] = useState<'clinical' | 'uploads'>('clinical');

    const filteredRecords = records.filter((record: any) => {
        const isClinical =
            record.uploadedBy?.startsWith('Dr.') ||
            record.recordType?.toLowerCase().includes('auto-generated') ||
            record.recordType?.toLowerCase().includes('clinical report');

        return activeCategory === 'clinical' ? isClinical : !isClinical;
    });

    const handleViewRecord = async (record: any) => {
        try {
            setViewLoading(record.id);
            const url = await medicalRecordsApi.previewRecord(record.id);
            setPreviewUrl(url);
            setPreviewRecord(record);
        } catch {
            toast.error('Failed to load record preview');
        } finally {
            setViewLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex-1 flex flex-col space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="w-48 h-6" />
                        <Skeleton className="w-32 h-3" />
                    </div>
                </div>
                <Skeleton className="w-full h-48 rounded-[2.5rem]" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <Skeleton className="w-full h-64 rounded-[2.5rem]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Patient Not Found</h2>
                <Button variant="outline" className="mt-6" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full flex-1 flex flex-col space-y-8 animate-in fade-in duration-700">

            {/* ── PATIENT IDENTITY CARD ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                {/* Left: Identity */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 lg:border-r border-slate-50 dark:border-slate-800 lg:min-w-[380px]">
                    <div className="relative shrink-0">
                        <Avatar
                            src={user.profilePictureUrl}
                            gender={user.gender}
                            name={`${user.firstName} ${user.lastName}`}
                            size="xl"
                            className="shadow-lg shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white dark:border-slate-900 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                    <div className="text-center sm:text-left space-y-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                            {user.firstName} {user.lastName}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">{user.email}</p>
                        <div className="pt-2">
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-400/20">
                                Patient Role
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: Details Grid */}
                <div className="flex-1 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-center border-y sm:border-y-0 lg:border-y-0 border-slate-50 dark:border-slate-800">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Mail size={12} className="text-indigo-500" /> Email
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-500" /> Phone
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar size={12} className="text-rose-500" /> Joined
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <UserCheck size={12} className="text-amber-500" /> Email Status
                        </p>
                        <p className={`text-xs font-black uppercase ${user.emailConfirmed ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {user.emailConfirmed ? 'Confirmed' : 'Pending Verification'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity size={12} className="text-blue-500" /> Account Status
                        </p>
                        <p className={`text-xs font-black uppercase ${user.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {user.isActive ? 'Active' : 'Deactivated'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={12} className="text-indigo-500" /> Records
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{records.length} file{records.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="p-6 sm:p-8 bg-slate-50/30 dark:bg-slate-800/20 flex flex-row lg:flex-col justify-center gap-3">
                    <a
                        href={`mailto:${user.email}`}
                        className="flex-1 h-12 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-pointer shadow-sm"
                    >
                        <Mail size={14} /> <span className="hidden sm:inline">Email</span>
                    </a>
                    {user.phoneNumber && (
                        <a
                            href={`tel:${user.phoneNumber}`}
                            className="flex-1 h-12 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-sm"
                        >
                            <Phone size={14} /> <span className="hidden sm:inline">Call</span>
                        </a>
                    )}
                </div>
            </div>

            {/* ── MEDICAL RECORDS ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Medical Records</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Clinical Archive — {filteredRecords.length} Item{filteredRecords.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Category Toggle */}
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
                </div>

                {recordsLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="w-40 h-4" />
                                    <Skeleton className="w-24 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Records Found</p>
                        <p className="text-xs text-slate-400 mt-1">This patient has no medical records yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredRecords.map((record: any, idx: number) => (
                            <motion.div
                                key={record.id || idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="flex items-center gap-4 p-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                            >
                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {record.recordType || record.RecordType || record.displayType || 'Medical File'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(record.uploadedAt || record.UploadedAt || record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        {record.uploadedBy && (
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <User size={10} />
                                                {record.uploadedBy}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewRecord(record)}
                                    disabled={viewLoading === record.id}
                                    className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-indigo-200 transition-all font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100"
                                >
                                    {viewLoading === record.id ? <Loader2 size={14} className="animate-spin" /> : 'View'}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => { setPreviewUrl(null); setPreviewRecord(null); }}
                />
            )}
        </div>
    );
}

export default function AdminPatientDetailPage() {
    return (
        <Suspense fallback={
            <div className="w-full flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <AdminPatientDetailContent />
        </Suspense>
    );
}