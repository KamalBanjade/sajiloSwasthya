'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { queryKeys } from '@/lib/queryKeys';
import {
    Plus,
    Search,
    User,
    Shield,
    Stethoscope,
    UserCheck,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Mail,
    Phone,
    Calendar,
    Filter,
    ArrowUpDown,
    Check,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';


import { useAdminUsers } from '@/hooks/useAdminQueries';
import { adminApi, UserOverview } from '@/lib/api';

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserOverview | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
    });

    const { data: usersData, isLoading: loading, refetch } = useAdminUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
    });

    const users = usersData?.data || [];
    const totalCount = usersData?.pagination?.totalCount || 0;
    const totalPages = usersData?.pagination?.totalPages || 1;

    // Form state for editing
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        isActive: true
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleToggleStatus = async (user: UserOverview) => {
        try {
            const res = await adminApi.updateUserStatus(user.id, !user.isActive);
            if (res.success) {
                toast.success(res.message);
                queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all() });
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleOpenEdit = (user: UserOverview) => {
        setEditingUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber || '',
            isActive: user.isActive
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSaving(true);
        try {
            const res = await adminApi.updateUser(editingUser.id, form);
            if (res.success) {
                toast.success('User updated');
                queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all() });
                setShowEditModal(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Admin': return <Shield className="w-4 h-4 text-purple-500" />;
            case 'Doctor': return <Stethoscope className="w-4 h-4 text-blue-500" />;
            case 'Patient': return <User className="w-4 h-4 text-green-500" />;
            default: return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Doctor': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Patient': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <PageLayout>
            <Section>
                <Stack spacing="lg">
                    {/* Unified Filter & Action Toolbar */}
                    <Stack direction={{ base: 'col', lg: 'row' } as any} align="center" spacing="md" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <form onSubmit={handleSearch} className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or identity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                            />
                        </form>

                        <Stack direction={{ base: 'col', sm: 'row' } as any} align="center" spacing="md" className="w-full lg:w-auto">
                            <Stack direction="row" spacing="sm" className="w-full sm:w-auto">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 dark:text-slate-400 text-xs font-bold min-w-[140px] cursor-pointer"
                                >
                                    <option value="">All Roles</option>
                                    <option value="Admin">Administrators</option>
                                    <option value="Doctor">Doctors</option>
                                    <option value="Patient">Patients</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 dark:text-slate-400 text-xs font-bold min-w-[140px] cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </Stack>

                        </Stack>
                    </Stack>

                    {/* Table Container */}
                    <div>
                        <ResponsiveTable
                            loading={loading}
                            data={users}
                            keyExtractor={(user: UserOverview) => user.id}
                            emptyState={
                                <div className="text-center py-24">
                                    <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <Text variant="body" className="text-gray-500 font-light">No users found matching your criteria</Text>
                                </div>
                            }
                            columns={[
                                {
                                    header: 'User',
                                    skeleton: (
                                        <div className="flex items-center gap-3 animate-pulse">
                                            <Skeleton className="w-9 h-9 rounded-xl" />
                                            <div className="space-y-1.5 pt-1">
                                                <Skeleton className="h-3 w-28" />
                                                <Skeleton className="h-2 w-32 opacity-60" />
                                            </div>
                                        </div>
                                    ),
                                    accessor: (user) => (
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${user.role === 'Admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                                user.role === 'Doctor' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Role',
                                    skeleton: <Skeleton className="h-6 w-20 rounded-lg" />,
                                    accessor: (user) => (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {user.role}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Status',
                                    skeleton: <Skeleton className="h-5 w-16 rounded-md" />,
                                    accessor: (user) => (
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${user.isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic'
                                                }`}
                                        >
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    )
                                },
                                {
                                    header: 'Joined',
                                    skeleton: <Skeleton className="h-4 w-24" />,
                                    accessor: (user) => (
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    skeleton: <Skeleton className="h-8 w-8 rounded-lg" />,
                                    accessor: (user) => (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
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
                                                <div className="flex items-center gap-1">
                                                    <Skeleton className="w-3 h-3 rounded-full" />
                                                    <Skeleton className="h-2 w-40" />
                                                </div>
                                            </div>
                                        </div>
                                        <Skeleton className="w-10 h-10 rounded-xl" />
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-24 rounded-xl" />
                                            <Skeleton className="h-8 w-24 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <Skeleton className="h-2 w-12 ml-auto" />
                                            <Skeleton className="h-5 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            renderMobileCard={(user) => (
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-light ${user.role === 'Admin' ? 'bg-purple-100 text-purple-600 shadow-sm' :
                                                user.role === 'Doctor' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'bg-green-100 text-green-600 shadow-sm'
                                                }`}>
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                {user.role}
                                            </span>
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${user.isActive
                                                    ? 'bg-green-50 text-green-600 border-green-100'
                                                    : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}
                                            >
                                                {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Joined</span>
                                            <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />

                        <div className="px-6 py-4 flex flex-col sm:row items-center justify-between gap-4">
                            <Text variant="label" className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, totalCount)} of {totalCount} users
                            </Text>
                            <Stack direction="row" spacing="sm">
                                <Button
                                    disabled={pagination.page <= 1}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <Button
                                    disabled={pagination.page >= totalPages}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    className="px-4 h-10 border border-gray-100 dark:border-slate-800 rounded-xl disabled:opacity-50"
                                >
                                    Next
                                </Button>
                            </Stack>
                        </div>
                    </div>
                </Stack>
            </Section>

            {/* Edit Modal (Standardized) */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/30 to-transparent">
                                <h2 className="text-2xl font-light text-gray-900 tracking-tight">Update User Profile</h2>
                                <p className="text-gray-500 mt-1 text-sm font-light">Manage account details for {editingUser?.email}</p>
                            </div>

                            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.firstName}
                                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.lastName}
                                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={form.phoneNumber}
                                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        placeholder="+977 1234567890"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">Account Active</span>
                                        <span className="text-xs text-gray-500 font-light italic">Allow user to log in</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${form.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 font-medium flex items-center justify-center"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Update User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageLayout>
    );
}
