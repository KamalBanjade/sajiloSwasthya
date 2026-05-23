'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { doctorPatientsApi, PatientListResponseDTO } from '@/lib/api/doctorPatients';
import {
    Loader2, User, AlertTriangle, Calendar,
    FileText, Search, Eye, Clock,
    UserCircle, ArrowUpDown, ChevronRight,
    FilePlus, UserPlus, Phone, MapPin, MoreHorizontal, Trash2
} from 'lucide-react';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useDoctorPatients } from '@/hooks/useAdminQueries';
import { CreatePatientModal } from '@/components/patients/CreatePatientModal';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { DirectorySkeleton } from '@/components/ui/DirectorySkeleton';
import { useConfirm } from '@/context/ConfirmContext';
function PatientsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { confirm } = useConfirm();

    const handleDeletePatient = async (p: PatientListResponseDTO) => {
        const confirmed = await confirm({
            title: 'Delete Patient Entirely',
            message: `Are you sure you want to entirely delete ${p.firstName} ${p.lastName}? This will permanently remove all their records and user account. This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (confirmed) {
            setIsDeleting(true);
            try {
                const res = await doctorPatientsApi.deletePatient(p.id);
                toast.success(res.message || 'Patient deleted successfully');
                queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patients.all() });
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete patient');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const { data: patientsData, isLoading } = useDoctorPatients(1);
    const patients = (patientsData as any) || [];

    const updateSearch = (value: string) => {
        setSearchQuery(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set('q', value);
        else params.delete('q');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            return { key, direction: 'asc' };
        });
    };

    const getSortIcon = (key: string) => (
        sortConfig?.key === key
            ? <ChevronRight className={`w-3 h-3 text-primary ${sortConfig.direction === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
            : <ArrowUpDown className="w-3 h-3 opacity-30" />
    );

    const filteredPatients = useMemo(() => {
        let result = patients.filter((p: any) =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                let aVal: any, bVal: any;
                switch (sortConfig.key) {
                    case 'name': aVal = `${a.firstName} ${a.lastName}`.toLowerCase(); bVal = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
                    case 'records': aVal = a.sharedRecordsCount; bVal = b.sharedRecordsCount; break;
                    case 'date': aVal = new Date(a.latestSharedRecordDate || 0).getTime(); bVal = new Date(b.latestSharedRecordDate || 0).getTime(); break;
                    default: return 0;
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [patients, searchQuery, sortConfig]); return (
        <PageLayout>
            <Section>
                {/* Search, Count & Create Row */}
                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by patient name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => updateSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white h-11"
                        />
                    </div>
                    <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700 items-center gap-2 hidden md:flex h-11">
                        <UserCircle className="w-4 h-4" />
                        {filteredPatients.length} Patients
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-11 px-6 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Patient</span>
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm rounded-[40px] border border-slate-100/50 dark:border-slate-800/30 overflow-hidden shadow-sm">
                    <ResponsiveTable
                        loading={isLoading}
                        data={filteredPatients}
                        keyExtractor={(p: PatientListResponseDTO) => p.id || p.email}
                        emptyState={
                            <div className="px-8 py-24 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">No patients found</p>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Try adjusting your filters or search terms</p>
                                </div>
                            </div>
                        }
                        columns={[
                            {
                                header: 'Patient Info',
                                className: 'pl-8 py-6',
                                accessor: (p: PatientListResponseDTO) => (
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-[1.25rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                                            {p.firstName?.[0]?.toUpperCase()}{p.lastName?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{p.firstName} {p.lastName}</p>
                                                {p.isPrimary && (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">{p.email}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Medical Stats',
                                accessor: (p: PatientListResponseDTO) => (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{p.sharedRecordsCount} Records</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{p.appointmentCount ?? 0} Visits</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Contact',
                                accessor: (p: PatientListResponseDTO) => (
                                    <div className="flex items-center gap-2.5 group/contact">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/contact:text-primary transition-colors">
                                            <Phone className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{p.phoneNumber || '—'}</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Recent Interaction',
                                accessor: (p: PatientListResponseDTO) => {
                                    const lastDate = p.lastAppointmentDate && p.latestSharedRecordDate
                                        ? (new Date(p.lastAppointmentDate) > new Date(p.latestSharedRecordDate) ? p.lastAppointmentDate : p.latestSharedRecordDate)
                                        : (p.lastAppointmentDate || p.latestSharedRecordDate);
                                    const isAppt = lastDate === p.lastAppointmentDate && p.lastAppointmentDate != null;

                                    if (!lastDate) return <span className="text-[12px] font-bold text-slate-300 dark:text-slate-700 italic">No activity yet</span>;

                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isAppt ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                                {isAppt ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{formatDate(lastDate)}</p>
                                                <p className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-tighter">
                                                    {isAppt ? 'Last Consult' : 'Data Upload'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                            },
                            {
                                header: 'Actions',
                                className: 'pr-8 text-right',
                                accessor: (p: PatientListResponseDTO) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/doctor/records/new?patientId=${p.id}&source=directory`)}
                                            className="h-10 px-4 rounded-2xl bg-primary text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                            title="New Record"
                                        >
                                            <FilePlus className="w-4 h-4" />
                                            <span className="font-bold text-[10px] uppercase tracking-widest">Record</span>
                                        </button>
                                        <button
                                            onClick={() => router.push(`/doctor/patients/${p.id}`)}
                                            className="h-10 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary/30 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                            title="View Profile"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="font-bold text-[10px] uppercase tracking-widest">Details</span>
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        renderMobileCard={(p: PatientListResponseDTO) => (
                            <div className="p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-white text-base">
                                        {p.firstName?.[0]}{p.lastName?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{p.firstName} {p.lastName}</p>
                                            {p.isPrimary && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-wider border border-emerald-500/20">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">{p.email}</p>
                                        {p.phoneNumber && (
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-0.5">{p.phoneNumber}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Records</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.sharedRecordsCount} Files</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                                        <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Appointments</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{p.appointmentCount} Visits</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/doctor/records/new?patientId=${p.id}&source=directory`)}
                                        className="flex-1 h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <FilePlus className="w-3.5 h-3.5" />
                                        Create Record
                                    </button>
                                    <button
                                        onClick={() => router.push(`/doctor/patients/${p.id}`)}
                                        className="flex-1 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
                                    >
                                        <Eye size={17} />
                                        Profile
                                    </button>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </Section>

            <CreatePatientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patients.all() });
                }}
                creatorRole="doctor"
            />

        </PageLayout>
    );
}

export default function DoctorPatientsPage() {
    return (
        <Suspense fallback={<DirectorySkeleton />}>
            <PatientsContent />
        </Suspense>
    );
}