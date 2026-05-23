'use client';

import React, { useState, useEffect } from 'react';
import { departmentApi, Department } from '@/lib/api/department';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Building2,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Users as UsersIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Card } from '@/components/ui/Card';

export default function AdminDepartmentsPage() {
    const { confirm } = useConfirm();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await departmentApi.getAll();
            if (res.success) {
                setDepartments(res.data);
            }
        } catch (error) {
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setForm({
                name: dept.name,
                description: dept.description || '',
                isActive: dept.isActive
            });
        } else {
            setEditingDept(null);
            setForm({
                name: '',
                description: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingDept) {
                const res = await departmentApi.update(editingDept.id, form);
                if (res.success) {
                    toast.success('Department updated');
                    fetchDepartments();
                    setShowModal(false);
                }
            } else {
                const res = await departmentApi.create(form);
                if (res.success) {
                    toast.success('Department created');
                    fetchDepartments();
                    setShowModal(false);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Department',
            message: 'Are you sure you want to delete this department?',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const res = await departmentApi.delete(id);
            if (res.success) {
                toast.success('Department deleted');
                fetchDepartments();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout>
            <Section>
                <Stack spacing="lg">
                    {/* Unified Toolbar */}
                    <Stack direction={{ base: 'col', lg: 'row' } as any} align="center" spacing="md" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search for departments or specialties..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>

                        <Stack direction="row" align="center" spacing="md" className="w-full lg:w-auto">
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border border-slate-100 dark:border-slate-700">
                                {filteredDepartments.length} Departments
                            </div>

                            <Button
                                onClick={() => handleOpenModal()}
                                className="flex-1 lg:flex-none h-12 px-6 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Department
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Table Container */}
                    <div>
                        <ResponsiveTable
                            loading={loading}
                            data={filteredDepartments}
                            keyExtractor={(dept) => dept.id}
                            emptyState={
                                <div className="text-center py-24 bg-gray-50/50 dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <Text variant="body" className="text-gray-500 font-light">No departments found</Text>
                                    {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 font-black text-xs uppercase underline mt-4 block mx-auto">Clear search</button>}
                                </div>
                            }
                            columns={[
                                {
                                    header: 'Department',
                                    accessor: (dept) => (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${dept.isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{dept.name}</p>
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">ID: {dept.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Description',
                                    accessor: (dept) => (
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic line-clamp-1 max-w-xs">
                                            {dept.description || 'No description'}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Stats',
                                    accessor: (dept) => (
                                        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                                            <UsersIcon className="w-3.5 h-3.5" />
                                            {dept.doctorCount || 0} Staff
                                        </span>
                                    )
                                },
                                {
                                    header: 'Status',
                                    accessor: (dept) => (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${dept.isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic'}`}>
                                            {dept.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    accessor: (dept) => (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenModal(dept)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            renderMobileCard={(dept) => (
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dept.isActive ? 'bg-blue-100 text-blue-600 shadow-lg shadow-blue-500/10' : 'bg-gray-100 text-gray-400'}`}>
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <H3 className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tight">{dept.name}</H3>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <UsersIcon className="w-3 h-3" />
                                                    {dept.doctorCount || 0} Staff Members
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleOpenModal(dept)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(dept.id)} className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <Text variant="label" className="text-[8px] mb-1">Functional Description</Text>
                                        <p className="text-xs text-gray-500 line-clamp-2 font-light italic">
                                            {dept.description || 'No description provided'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${dept.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            {dept.isActive ? 'Operating' : 'Disabled'}
                                        </span>
                                        <Text variant="label" className="text-[10px] lowercase text-gray-300">ID: {dept.id}</Text>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </Stack>
            </Section>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/30 to-transparent">
                                <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                                    {editingDept ? 'Edit Unit' : 'Create New Unit'}
                                </h2>
                                <p className="text-gray-500 mt-1 text-sm font-light">Enter department information</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 ml-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light"
                                        placeholder="e.g. Cardiology"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 ml-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-light resize-none"
                                        placeholder="Briefly describe the unit's clinical focus..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">Visibility Status</span>
                                        <span className="text-xs text-gray-500 font-light">Allow this unit to appear in dropdowns</span>
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
                                        onClick={() => setShowModal(false)}
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
                                            editingDept ? 'Update Unit' : 'Create Unit'
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
