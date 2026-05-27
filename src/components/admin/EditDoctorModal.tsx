'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Save, User, Stethoscope, BadgeCheck, Phone,
    Loader2, ChevronDown, CheckCircle2, ShieldCheck, Mail, Star, Award, Building2, Briefcase, Globe, Activity, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Doctor, UpdateDoctorRequest } from '@/types/admin';
import { departmentApi, Department as DeptEntity } from '@/lib/api/department';
import { adminApi } from '@/lib/api';
import { DoctorExtendedProfile } from '@/lib/api';
import toast from 'react-hot-toast';

interface EditDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: Doctor | null;
    onSave: (id: string, data: UpdateDoctorRequest) => Promise<void>;
}

export const EditDoctorModal: React.FC<EditDoctorModalProps> = ({
    isOpen,
    onClose,
    doctor,
    onSave
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'extended'>('basic');
    const [formData, setFormData] = useState<UpdateDoctorRequest>({
        firstName: '', lastName: '', nmcLicense: '', department: '',
        specialization: '', qualificationDetails: '', isActive: true, phoneNumber: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<DeptEntity[]>([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);
    const [extendedProfile, setExtendedProfile] = useState<DoctorExtendedProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('basic');
            fetchDepartments();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && doctor && activeTab === 'extended') {
            fetchExtendedProfile(doctor.userId);
        }
    }, [isOpen, doctor, activeTab]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, onClose]);

    const fetchDepartments = async () => {
        try {
            setIsFetchingDepts(true);
            const res = await departmentApi.getAll();
            if (res.success) setDepartments(res.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setIsFetchingDepts(false);
        }
    };

    const fetchExtendedProfile = async (id: string) => {
        if (extendedProfile) return; // Already fetched
        try {
            setIsLoadingProfile(true);
            const res = await adminApi.getDoctorProfile(id);
            if (res) setExtendedProfile(res);
        } catch (error) {
            console.error('Failed to load extended profile', error);
            toast.error('Could not load extended profile details');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (doctor) {
            setFormData({
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                nmcLicense: doctor.nmcLicense,
                department: doctor.department,
                specialization: doctor.specialization,
                qualificationDetails: doctor.qualificationDetails || '',
                isActive: doctor.isActive,
                phoneNumber: ''
            });
            setExtendedProfile(null);
        }
    }, [doctor]);

    if (!isOpen || !doctor) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(doctor.userId, formData);
            toast.success('Practitioner details updated');
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update details');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dr. {doctor.firstName} {doctor.lastName}</h3>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">Clinical Registry Record</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${
                                activeTab === 'basic' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            Basic Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('extended')}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${
                                activeTab === 'extended' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            Extended Profile (Read-Only)
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'basic' ? (
                        <form id="edit-doctor-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                                        <Input
                                            required
                                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white h-10 text-sm dark:text-white"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                                        <Input
                                            required
                                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white h-10 text-sm dark:text-white"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">NMC License</label>
                                    <div className="relative">
                                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                                        <Input
                                            required
                                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white h-10 text-sm dark:text-white"
                                            value={formData.nmcLicense}
                                            onChange={(e) => setFormData({ ...formData, nmcLicense: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Department</label>
                                    <div className="relative">
                                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={16} />
                                        <select
                                            required
                                            className="w-full pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-900 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all h-10 text-sm appearance-none flex items-center dark:text-white"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            disabled={isFetchingDepts}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.filter(d => d.isActive).map(dept => (
                                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Specialization</label>
                                <Input
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white h-10 text-sm dark:text-white"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Qualification Details</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white rounded-md p-3 text-sm min-h-[80px] outline-none transition-all dark:text-white"
                                    value={formData.qualificationDetails}
                                    onChange={(e) => setFormData({ ...formData, qualificationDetails: e.target.value })}
                                    placeholder="Degrees, certifications, and experience..."
                                />
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 space-y-6">
                            {isLoadingProfile ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="animate-spin text-slate-300" size={32} />
                                    <p className="text-xs font-bold text-slate-400">Loading extended profile...</p>
                                </div>
                            ) : extendedProfile ? (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* Completion Score */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Completion</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${extendedProfile.profileCompletionScore}%` }} />
                                                </div>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{extendedProfile.profileCompletionScore}%</span>
                                            </div>
                                        </div>
                                        {extendedProfile.missingProfileFields.length > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Missing Fields</p>
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{extendedProfile.missingProfileFields.length} items</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sections */}
                                    <div className="space-y-6">
                                        {/* Bio */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Biography</p>
                                            {extendedProfile.biography ? (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{extendedProfile.biography}</p>
                                            ) : <p className="text-xs text-slate-400 italic">No biography provided.</p>}
                                        </div>

                                        {/* Arrays Row 1 */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={14}/> Education ({extendedProfile.education.length})</p>
                                                <div className="space-y-2">
                                                    {extendedProfile.education.map((e, i) => (
                                                        <div key={i} className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                                                            <p className="text-slate-500 dark:text-slate-400">{e.institution}</p>
                                                        </div>
                                                    ))}
                                                    {extendedProfile.education.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14}/> Experience ({extendedProfile.experience.length})</p>
                                                <div className="space-y-2">
                                                    {extendedProfile.experience.map((e, i) => (
                                                        <div key={i} className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                                                            <p className="text-slate-500 dark:text-slate-400">{e.institution}</p>
                                                        </div>
                                                    ))}
                                                    {extendedProfile.experience.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrays Row 2 */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Award size={14}/> Certifications ({extendedProfile.professionalCertifications.length})</p>
                                                <div className="space-y-2">
                                                    {extendedProfile.professionalCertifications.map((c, i) => (
                                                        <div key={i} className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                                                            <p className="text-slate-500 dark:text-slate-400">{c.issuingBody} {c.year ? `(${c.year})` : ''}</p>
                                                        </div>
                                                    ))}
                                                    {extendedProfile.professionalCertifications.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star size={14}/> Awards ({extendedProfile.awards.length})</p>
                                                <div className="space-y-2">
                                                    {extendedProfile.awards.map((a, i) => (
                                                        <div key={i} className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="font-bold text-slate-900 dark:text-white">{a.title}</p>
                                                            <p className="text-slate-500 dark:text-slate-400">{a.institution}</p>
                                                        </div>
                                                    ))}
                                                    {extendedProfile.awards.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Simple Arrays */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Languages</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {extendedProfile.languages.map(l => (
                                                        <span key={l} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-md dark:text-slate-350">{l}</span>
                                                    ))}
                                                    {extendedProfile.languages.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Procedures</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {extendedProfile.procedures.map(p => (
                                                        <span key={p} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md">{p}</span>
                                                    ))}
                                                    {extendedProfile.procedures.length === 0 && <p className="text-xs text-slate-400 italic">None provided.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-500 font-bold">Failed to load extended profile data.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 pb-4 px-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-transparent border-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-doctor-form"
                        disabled={isSaving || activeTab === 'extended'}
                        className={`bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg px-6 h-10 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'extended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Basic Info
                    </Button>
                </div>
            </div>
        </div>
    );
};
