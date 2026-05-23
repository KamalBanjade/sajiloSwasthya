'use client';

import React, { useState } from 'react';
import { useAdminPatients } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { adminApi } from '@/lib/api';
import {
    Search,
    User,
    UserCheck,
    Edit2,
    CheckCircle2,
    XCircle,
    Mail,
    Phone,
    Plus,
    Filter,
    UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatePatientModal } from '@/components/patients/CreatePatientModal';

interface UserOverview {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailConfirmed: boolean;
    createdAt: string;
    phoneNumber?: string;
}


export default function AdminPatientsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const activeIsActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

    const { data: patientsRes, isLoading, isPlaceholderData } = useAdminPatients(page, searchTerm, activeIsActive);

    const patients = patientsRes?.data || [];
    const pagination = patientsRes?.pagination || {
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    const handleToggleStatus = async (user: UserOverview) => {
        try {
            const res = await adminApi.updateUserStatus(user.id, !user.isActive);
            if (res.success) {
                toast.success(res.message);
                queryClient.invalidateQueries({ queryKey: queryKeys.admin.patients.all() });
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <PageLayout>
            <Section>
                <Stack spacing="lg">
                    {/* Toolbar */}
                    <Stack direction={{ base: 'col', lg: 'row' } as any} align="center" spacing="md" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <form onSubmit={handleSearch} className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search patients by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
                            />
                        </form>

                        <Stack direction={{ base: 'col', sm: 'row' } as any} align="center" spacing="md" className="w-full lg:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="w-full sm:w-48 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>

                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden lg:block" />

                            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest border border-emerald-100 dark:border-emerald-800/50 whitespace-nowrap">
                                {pagination.totalCount} Patients
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="h-10 px-5 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Create Patient</span>
                            </button>
                        </Stack>
                    </Stack>

                    {/* Table Container */}
                    <div>
                        <ResponsiveTable
                            loading={isLoading || isPlaceholderData}
                            data={patients}
                            keyExtractor={(p) => p.id}
                            emptyState={
                                <div className="text-center py-24 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <Text variant="body" className="text-gray-500 font-bold uppercase tracking-widest text-xs">No patients found</Text>
                                    <button onClick={() => setSearchTerm('')} className="text-emerald-600 font-black text-xs uppercase underline">Clear search</button>
                                </div>
                            }
                            columns={[
                                {
                                    header: 'Patient Info',
                                    accessor: (p) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm uppercase">
                                                {p.firstName[0]}{p.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.firstName} {p.lastName}</p>
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 lowercase">{p.email}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Contact',
                                    accessor: (p) => (
                                        <div className="flex flex-col gap-1">
                                            {p.phoneNumber ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    <Text variant="body" className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.phoneNumber}</Text>
                                                </div>
                                            ) : (
                                                <Text variant="label" className="text-[10px] text-slate-300 italic">No phone provided</Text>
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Status',
                                    accessor: (p) => (
                                        <button
                                            onClick={() => handleToggleStatus(p)}
                                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${p.isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic'
                                                }`}
                                        >
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    )
                                },
                                {
                                    header: 'Joined Date',
                                    accessor: (p) => (
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    className: 'text-right',
                                    accessor: (p) => (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
                                                title="View Health Profile"
                                                onClick={() => window.location.href = `/admin/patients/${p.id}`}
                                            >
                                                <UserCheck size={18} />
                                            </Button>
                                        </div>
                                    )
                                }
                            ]}
                            renderMobileCard={(p) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 space-y-5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base uppercase">
                                            {p.firstName[0]}{p.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <H3 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{p.firstName} {p.lastName}</H3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                <Text variant="label" className="text-[10px] lowercase text-gray-400 truncate">{p.email}</Text>
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Text variant="label" className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</Text>
                                            <Text variant="body" className={`text-xs font-black uppercase ${p.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {p.isActive ? 'Active' : 'Disabled'}
                                            </Text>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Text variant="label" className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</Text>
                                            <Text variant="body" className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </Text>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest"
                                            onClick={() => window.location.href = `/admin/patients/${p.id}`}
                                        >
                                            Full Profile
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all
                                                ${p.isActive
                                                    ? 'bg-rose-50 text-rose-500 border-rose-100'
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                            onClick={() => handleToggleStatus(p)}
                                        >
                                            {p.isActive ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        />

                        {/* Pagination */}
                        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Text variant="label" className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} patients
                            </Text>
                            <Stack direction="row" spacing="sm">
                                <Button
                                    disabled={page <= 1}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50 shadow-sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    disabled={page >= pagination.totalPages}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50 shadow-sm"
                                >
                                    Next
                                </Button>
                            </Stack>
                        </div>
                    </div>
                </Stack>
            </Section>
            <CreatePatientModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.admin.patients.all() });
                }}
                creatorRole="admin"
            />
        </PageLayout>
    );
}
