'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAdminDoctors } from '@/hooks/useAdminQueries';
import { adminApi } from '@/lib/api';
import { Doctor, UpdateDoctorRequest } from '@/types/admin';

import { Input } from '@/components/ui/Input';
import {
    Search,
    UserPlus,
    ShieldCheck,
    RefreshCw,
    Edit,
    Calendar,
    BadgeCheck,
    AlertCircle,
    UserX,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Plus,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';

import { RegenerateKeysModal } from '@/components/admin/RegenerateKeysModal';
import { EditDoctorModal } from '@/components/admin/EditDoctorModal';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Card } from '@/components/ui/Card';
import { InviteDoctorModal } from '@/components/admin/InviteDoctorModal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DoctorListPage() {
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [department, setDepartment] = useState('');
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<{ id: string, name: string } | null>(null);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { data: doctorsData, isLoading: loading, refetch } = useAdminDoctors({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        department: department || undefined,
        isActive
    });

    const doctors = doctorsData?.data || [];
    const totalCount = doctorsData?.pagination?.totalCount || 0;
    const totalPages = doctorsData?.pagination?.totalPages || 1;

    const handleToggleStatus = async (doc: any) => {
        const action = doc.isActive ? 'deactivate' : 'reactivate';
        const confirmed = await confirm({
            title: `${doc.isActive ? 'Deactivate' : 'Reactivate'} Staff`,
            message: `Are you sure you want to ${action} Dr. ${doc.firstName} ${doc.lastName}?`,
            confirmText: doc.isActive ? 'Deactivate' : 'Reactivate',
            type: doc.isActive ? 'danger' : 'primary'
        });
        if (!confirmed) return;

        setTogglingId(doc.userId);
        try {
            await adminApi.updateDoctor(doc.userId, {
                firstName: doc.firstName,
                lastName: doc.lastName,
                nmcLicense: doc.nmcLicense,
                department: doc.department,
                specialization: doc.specialization,
                qualificationDetails: doc.qualificationDetails,
                isActive: !doc.isActive,
                phoneNumber: doc.phoneNumber
            });
            toast.success(`Account ${doc.isActive ? 'deactivated' : 'reactivated'} successfully`);
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors.all() });
        } catch (error) {
            console.error('Failed to toggle doctor status:', error);
            toast.error(`Failed to ${action} account`);
        } finally {
            setTogglingId(null);
        }
    };

    const handleRotateKeysClick = (id: string, name: string) => {
        setSelectedDoctor({ id, name });
        setIsRotateModalOpen(true);
    };

    const handleEditClick = (doc: Doctor) => {
        setEditingDoctor(doc);
        setIsEditModalOpen(true);
    };

    const handleSaveDoctor = async (id: string, data: UpdateDoctorRequest) => {
        await adminApi.updateDoctor(id, data);
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors.all() });
    };

    const handleConfirmRotation = async () => {
        if (!selectedDoctor) return;

        try {
            await adminApi.regenerateKeys(selectedDoctor.id);
            toast.success('Keys regenerated successfully');
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors.all() });
        } catch (error) {
            console.error('Failed to rotate keys:', error);
            toast.error('Key regeneration failed');
            throw error;
        }
    };

    return (
        <PageLayout>
            <Section>
                <Stack spacing="lg">
                    {/* Toolbar */}
                    <Stack direction={{ base: 'col', lg: 'row' } as any} align="center" spacing="md" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, specialty, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                            />
                        </div>

                        <Stack direction={{ base: 'col', sm: 'row' } as any} align="center" spacing="md" className="w-full lg:w-auto">
                            <select
                                value={department}
                                onChange={(e) => {
                                    setDepartment(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full sm:w-48 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer shadow-sm"
                            >
                                <option value="">All Departments</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="General Medicine">General Medicine</option>
                            </select>

                            <select
                                value={isActive === undefined ? 'all' : isActive ? 'active' : 'inactive'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setIsActive(val === 'all' ? undefined : val === 'active');
                                    setPage(1);
                                }}
                                className="w-full sm:w-48 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer shadow-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>

                            <Button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="w-full sm:w-auto h-12 px-6 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Onboard Doctor
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Table Container */}
                    <div>
                        <ResponsiveTable
                            loading={loading}
                            data={doctors}
                            keyExtractor={(doc) => doc.userId}
                            emptyState={
                                <div className="text-center py-24 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                                        <Search className="w-8 h-8" />
                                    </div>
                                    <Text variant="body" className="text-gray-500 font-bold uppercase tracking-widest text-xs">No medical staff found</Text>
                                    <button onClick={() => setSearchTerm('')} className="text-indigo-600 font-black text-xs uppercase underline">Clear Search</button>
                                </div>
                            }
                            columns={[
                                {
                                    header: 'Name & Email',
                                    skeleton: (
                                        <div className="flex flex-col animate-pulse gap-1.5 pt-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40 opacity-60" />
                                        </div>
                                    ),
                                    accessor: (doc: any) => (
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dr. {doc.firstName} {doc.lastName}</p>
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{doc.email}</p>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Credentials',
                                    skeleton: (
                                        <div className="flex flex-col animate-pulse gap-1.5 pt-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-20 opacity-60" />
                                        </div>
                                    ),
                                    accessor: (doc: any) => (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                <BadgeCheck size={13} className="text-primary" strokeWidth={3} />
                                                {doc.nmcLicense}
                                            </span>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mt-0.5">{doc.department}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Status',
                                    className: 'text-center',
                                    skeleton: <div className="flex justify-center"><Skeleton className="h-5 w-16 rounded-md" /></div>,
                                    accessor: (doc: any) => doc.isActive ? (
                                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400 italic">
                                            Inactive
                                        </span>
                                    )
                                },
                                {
                                    header: 'Key State',
                                    skeleton: <Skeleton className="h-4 w-20" />,
                                    accessor: (doc: any) => doc.hasKeys ? (
                                        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-black tracking-widest uppercase">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            RSA-2048
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-black tracking-widest uppercase">
                                            <AlertCircle size={14} />
                                            No Key
                                        </span>
                                    )
                                },
                                {
                                    header: 'Added',
                                    skeleton: <Skeleton className="h-4 w-24" />,
                                    accessor: (doc: any) => (
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    className: 'text-right',
                                    skeleton: <div className="flex justify-end gap-2"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /></div>,
                                    accessor: (doc: any) => (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
                                                title="Regenerate Keys"
                                                onClick={() => handleRotateKeysClick(doc.userId, `${doc.firstName} ${doc.lastName}`)}
                                            >
                                                <RefreshCw size={18} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
                                                title="Edit Details"
                                                onClick={() => handleEditClick(doc)}
                                            >
                                                <Edit size={18} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-10 w-10 p-0 rounded-xl border transition-all flex items-center justify-center active:scale-95
                                                    ${doc.isActive
                                                        ? 'bg-white dark:bg-slate-900 text-rose-500 border-rose-100 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white'
                                                        : 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500 hover:bg-slate-800'
                                                    }`}
                                                title={doc.isActive ? 'Deactivate' : 'Activate'}
                                                onClick={() => handleToggleStatus(doc)}
                                                disabled={togglingId === doc.userId}
                                            >
                                                {togglingId === doc.userId ? (
                                                    <RefreshCw size={16} className="animate-spin" />
                                                ) : doc.isActive ? (
                                                    <UserX size={18} strokeWidth={2.5} />
                                                ) : (
                                                    <UserCheck size={18} strokeWidth={2.5} />
                                                )}
                                            </Button>
                                        </div>
                                    )
                                }
                            ]}
                            renderMobileSkeleton={() => (
                                <div className="p-6 space-y-5 animate-pulse">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-2xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-2 w-20" />
                                            </div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-12 rounded-2xl" />
                                        <Skeleton className="h-12 rounded-2xl" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="flex-1 h-12 rounded-xl" />
                                        <Skeleton className="w-12 h-12 rounded-xl" />
                                        <Skeleton className="w-12 h-12 rounded-xl" />
                                    </div>
                                </div>
                            )}
                            renderMobileCard={(doc: any) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 space-y-5"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white text-base border border-slate-100 dark:border-slate-700">
                                                {doc.firstName?.[0]}{doc.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <H3 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">Dr. {doc.firstName} {doc.lastName}</H3>
                                                <Text variant="label" className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{doc.department}</Text>
                                            </div>
                                        </div>
                                        {doc.isActive ? (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Text variant="label" className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">License No.</Text>
                                            <Text variant="body" className="text-[11px] font-black text-slate-900 dark:text-white">{doc.nmcLicense}</Text>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Text variant="label" className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Key State</Text>
                                            <Text variant="body" className={`text-[11px] font-black uppercase ${doc.hasKeys ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {doc.hasKeys ? 'Active RSA' : 'No Key'}
                                            </Text>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRotateKeysClick(doc.userId, `${doc.firstName} ${doc.lastName}`)}
                                            className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest"
                                        >
                                            Rotate Keys
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(doc)}
                                            className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(doc)}
                                            disabled={togglingId === doc.userId}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all
                                                ${doc.isActive
                                                    ? 'bg-white dark:bg-slate-900 text-rose-500 border-rose-100 dark:border-rose-800'
                                                    : 'bg-emerald-600 text-white border-emerald-500'}`}
                                        >
                                            {togglingId === doc.userId ? <RefreshCw size={16} className="animate-spin" /> : doc.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        />

                        {/* Pagination */}
                        <div className="px-6 py-4 flex flex-col sm:row items-center justify-between gap-4">
                            <Text variant="label" className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                            </Text>
                            <Stack direction="row" spacing="sm">
                                <Button
                                    disabled={page <= 1}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50 shadow-sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    disabled={page >= totalPages}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50 shadow-sm"
                                >
                                    Next
                                </Button>
                            </Stack>
                        </div>
                    </div>
                </Stack>
            </Section>

            <RegenerateKeysModal
                isOpen={isRotateModalOpen}
                onClose={() => setIsRotateModalOpen(false)}
                onConfirm={handleConfirmRotation}
                doctorName={selectedDoctor?.name || 'Doctor'}
            />
            <EditDoctorModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                doctor={editingDoctor}
                onSave={handleSaveDoctor}
            />
            <InviteDoctorModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors.all() })}
            />
        </PageLayout>
    );
}
