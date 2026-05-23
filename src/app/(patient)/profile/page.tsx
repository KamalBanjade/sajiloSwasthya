'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { patientApi, PatientProfileData, UpdatePatientProfileRequest, SmartDoctorSuggestionDTO, DoctorSuggestionItem } from '@/lib/api/patient';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    User,
    Mail,
    Calendar,
    MapPin,
    Smartphone,
    Stethoscope,
    ChevronRight,
    Award,
    Building2,
    X,
    Edit3,
    CheckCircle2,
    Save,
    Loader2,
    Heart,
    Droplets,
    Phone,
    ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { usePatientProfile, usePatientDoctorSuggestions } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, accent = 'primary', action }: { 
    icon: React.ReactNode; 
    title: string; 
    children: React.ReactNode; 
    accent?: 'primary' | 'secondary' | 'indigo' | 'violet' | 'amber' | 'emerald' | 'fuchsia' | 'rose' | 'sky' | 'teal';
    action?: React.ReactNode;
}) {
    const themes = {
        primary: 'bg-primary group-hover:shadow-primary/20',
        secondary: 'bg-secondary group-hover:shadow-secondary/20',
        indigo: 'bg-indigo-500 group-hover:shadow-indigo-500/20',
        violet: 'bg-violet-500 group-hover:shadow-violet-500/20',
        amber: 'bg-amber-500 group-hover:shadow-amber-500/20',
        emerald: 'bg-emerald-500 group-hover:shadow-emerald-500/20',
        fuchsia: 'bg-fuchsia-500 group-hover:shadow-fuchsia-500/20',
        rose: 'bg-rose-500 group-hover:shadow-rose-500/20',
        sky: 'bg-sky-500 group-hover:shadow-sky-500/20',
        teal: 'bg-teal-500 group-hover:shadow-teal-500/20'
    };

    const lightThemes = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        indigo: 'bg-indigo-500/10 text-indigo-500',
        violet: 'bg-violet-500/10 text-violet-500',
        amber: 'bg-amber-500/10 text-amber-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        fuchsia: 'bg-fuchsia-500/10 text-fuchsia-500',
        rose: 'bg-rose-500/10 text-rose-500',
        sky: 'bg-sky-500/10 text-sky-500',
        teal: 'bg-teal-500/10 text-teal-500'
    };

    return (
        <div className="group bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm hover:shadow-premium transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-0 group-hover:h-full ${themes[accent]} transition-all duration-700`} />
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1.25rem] ${lightThemes[accent]} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] leading-tight">{title}</h2>
                        <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800 mt-2 rounded-full" />
                    </div>
                </div>
                {action && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {action}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}

export default function PatientProfilePage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { checkAuth } = useAuthStore();

    const { data: profileRes, isLoading: loadingProfile } = usePatientProfile();
    const { data: suggestionsRes, isLoading: loadingSuggestions } = usePatientDoctorSuggestions();

    const profile = profileRes?.data;
    const suggestions = suggestionsRes?.data;

    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UpdatePatientProfileRequest>({
        bloodType: '',
        address: '',
        occupation: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        chronicConditions: '',
        gender: '',
        phoneNumber: '',
        dateOfBirth: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                bloodType: profile.bloodType || '',
                address: profile.address || '',
                occupation: profile.occupation || '',
                emergencyContactName: profile.emergencyContactName || '',
                emergencyContactPhone: profile.emergencyContactPhone || '',
                allergies: profile.allergies || '',
                chronicConditions: profile.chronicConditions || '',
                gender: profile.gender || '',
                phoneNumber: profile.phoneNumber || '',
                dateOfBirth: profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'yyyy-MM-dd') : ''
            });
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await patientApi.updateProfile(formData);
            toast.success('Identity profile updated');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile() });
        } catch (error) {
            toast.error('Network synchronization error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        try {
            await patientApi.uploadProfilePicture(file);
            toast.success('Identity visual updated');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile() });
            checkAuth(); // Sync global dashboard avatar
        } catch (error) {
            toast.error('Visual synchronization error');
        }
    };

    const handleImageDelete = async () => {
        try {
            await patientApi.deleteProfilePicture();
            toast.success('Identity visual removed');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile() });
            checkAuth(); // Sync global dashboard avatar
        } catch (error) {
            toast.error('Visual removal error');
        }
    };

    const handleSetPrimary = async (doctorId: string) => {
        const loadingToast = toast.loading('Synchronizing primary specialist...');
        try {
            await patientApi.setPrimaryDoctor(doctorId);
            toast.success('Primary specialist updated', { id: loadingToast });
            queryClient.invalidateQueries({ queryKey: ['smart-suggestions'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile() });
        } catch (error) {
            toast.error('Failed to update primary specialist', { id: loadingToast });
        }
    };

    const associatedDoctors = useMemo(() => {
        if (!suggestions) return [];
        const doctors: DoctorSuggestionItem[] = [];
        const seen = new Set<string>();

        if (suggestions.primaryDoctor) {
            doctors.push(suggestions.primaryDoctor);
            seen.add(suggestions.primaryDoctor.id);
        }
        if (suggestions.upcomingAppointmentDoctor && !seen.has(suggestions.upcomingAppointmentDoctor.id)) {
            doctors.push(suggestions.upcomingAppointmentDoctor);
            seen.add(suggestions.upcomingAppointmentDoctor.id);
        }
        suggestions.recentDoctors.forEach(d => {
            if (!seen.has(d.id)) {
                doctors.push(d);
                seen.add(d.id);
            }
        });
        return doctors;
    }, [suggestions]);

    if (loadingProfile || loadingSuggestions) {
        return <ProfileSkeleton />;
    }

    return (
        <PageLayout>
            <div className="space-y-16">

            {/* Premium Header */}
            <div className={`flex flex-col md:flex-row items-center justify-between gap-8 border-b transition-all duration-700 pb-12 ${isEditing ? 'border-primary/20 bg-primary/5 rounded-[3rem] p-12 -mx-12' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="relative group">
                        <ProfilePictureUpload
                            currentImageUrl={profile?.profilePictureUrl}
                            onUpload={handleImageUpload}
                            onDelete={handleImageDelete}
                            firstName={profile?.firstName}
                            lastName={profile?.lastName}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {profile?.firstName} <span className="text-primary italic">{profile?.lastName}</span>
                            </h1>
                            {isEditing && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Editing Mode</span>
                                </motion.div>
                            )}
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{profile?.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                        className={`h-14 px-8 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 ${isEditing ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105'}`}
                    >
                        {isEditing ? <X size={18} className="mr-3" /> : <Edit3 size={18} className="mr-3" />}
                        {isEditing ? 'Cancel Sync' : 'Edit Profile'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Profile Information: Glassmorphic Cards */}
                <div className="lg:col-span-8 space-y-12">
                    <SectionCard icon={<User size={18} />} title="Personal Identity Details" accent="sky">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Sex */}
                            <div className="group p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Biological Sex</label>
                                <div className="flex items-center gap-4">
                                    {isEditing ? (
                                        <Select
                                            options={[
                                                { value: '', label: 'Select' },
                                                { value: 'Male', label: 'Male' },
                                                { value: 'Female', label: 'Female' },
                                                { value: 'Other', label: 'Other' }
                                            ]}
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            className="bg-transparent border-none font-black text-slate-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="text-sm font-black text-slate-900 dark:text-white">{profile?.gender || 'Unspecified'}</div>
                                    )}
                                </div>
                            </div>

                            {/* DOB */}
                            <div className="group p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Date of Birth</label>
                                <div className="flex items-center gap-4">
                                    <Calendar size={16} className="text-sky-500 opacity-50" />
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="bg-transparent border-none font-black text-slate-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                            {profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'dd MMMM, yyyy') : 'Establish Index'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div className="group p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 border-l-[4px] border-l-rose-500">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Blood Group Identity</label>
                                <div className="flex items-center gap-4">
                                    <Droplets size={20} className="text-rose-500" fill="currentColor" />
                                    {isEditing ? (
                                        <Select
                                            options={[
                                                { value: '', label: 'Select Type' },
                                                { value: 'A+', label: 'A+' },
                                                { value: 'A-', label: 'A-' },
                                                { value: 'B+', label: 'B+' },
                                                { value: 'B-', label: 'B-' },
                                                { value: 'AB+', label: 'AB+' },
                                                { value: 'AB-', label: 'AB-' },
                                                { value: 'O+', label: 'O+' },
                                                { value: 'O-', label: 'O-' }
                                            ]}
                                            value={formData.bloodType}
                                            onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                                            className="bg-transparent border-none font-black text-slate-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="text-lg font-black text-rose-500 uppercase tracking-tighter">{profile?.bloodType || 'A+'}</div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div className="group p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Contact Number</label>
                                <div className="flex items-center gap-4">
                                    <Smartphone size={16} className="text-sky-500 opacity-50" />
                                    {isEditing ? (
                                        <input
                                            className="bg-transparent border-none text-sm font-black text-slate-900 dark:text-white w-full outline-none focus:ring-0"
                                            value={formData.phoneNumber || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!value.startsWith('+977-')) {
                                                    setFormData({ ...formData, phoneNumber: '+977-' });
                                                    return;
                                                }
                                                const suffix = value.slice(5).replace(/\D/g, '').slice(0, 10);
                                                setFormData({ ...formData, phoneNumber: '+977-' + suffix });
                                            }}
                                            placeholder="+977-"
                                        />
                                    ) : (
                                        <div className="text-sm font-black text-slate-900 dark:text-white">{profile?.phoneNumber || 'Linked Required'}</div>
                                    )}
                                </div>
                            </div>

                            {/* Occupation */}
                            <div className="group p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 border-l-[4px] border-l-amber-500">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Current Occupation</label>
                                <div className="flex items-center gap-4">
                                    <Building2 size={20} className="text-amber-500" />
                                    {isEditing ? (
                                        <input className="bg-transparent border-none text-sm font-black text-slate-900 dark:text-white w-full outline-none focus:ring-0"
                                            value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} placeholder="E.g., Software Engineer" />
                                    ) : (
                                        <div className="text-sm font-black text-slate-900 dark:text-white">{profile?.occupation || 'Not specified'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address: Large Tactile Card */}
                        <div className={`p-8 bg-white dark:bg-slate-900/20 backdrop-blur-3xl border rounded-[2.5rem] transition-all duration-500 ${isEditing ? 'border-indigo-500 shadow-xl shadow-indigo-500/5' : 'border-slate-100 dark:border-white/5'}`}>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 block">Registered Geographic Origin</label>
                            {isEditing ? (
                                <div className="relative group/input">
                                    <MapPin size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 group-focus-within/input:scale-110 transition-transform" />
                                    <input
                                        className="w-full pl-16 h-16 bg-slate-50 dark:bg-slate-800 border-none text-base font-black rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Declare full residence..."
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                                        <MapPin size={24} />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-sans">{profile?.address || 'Location data not synchronized'}</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                </div>

                {/* Integrated Care Team: Premium Sidebar Grid */}
                <div className="lg:col-span-4 space-y-10">
                    <SectionCard icon={<Stethoscope size={18} />} title="Associated Doctors" accent="violet">
                        <div className="grid grid-cols-1 gap-4">
                            {associatedDoctors.length === 0 ? (
                                <div className="p-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-slate-800/20">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-inner">
                                        <Stethoscope size={32} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">System awaiting first clinical association</p>
                                </div>
                            ) : (
                                associatedDoctors.map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push(`/profile/doctor/${doc.id}`)}
                                        className="group cursor-pointer bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-5 rounded-3xl shadow-sm hover:shadow-premium hover:border-violet-500/50 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-lg font-black shadow-xl group-hover:bg-violet-500 group-hover:text-white transition-all duration-500 overflow-hidden">
                                                {doc.profilePictureUrl ? (
                                                    <img src={doc.profilePictureUrl} alt={doc.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <>{doc.fullName.split(' Dr. ')[1]?.charAt(0) || doc.fullName.charAt(0)}</>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate font-sans">{doc.fullName}</p>
                                                    {suggestions?.primaryDoctor?.id === doc.id && (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[7px] font-black uppercase tracking-tighter border border-emerald-500/20">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.1em] mt-1">{doc.department}</p>
                                            </div>
                                            {suggestions?.primaryDoctor?.id !== doc.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSetPrimary(doc.id);
                                                    }}
                                                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Set as Primary Specialist"
                                                >
                                                    <Heart size={14} />
                                                </button>
                                            )}
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-500 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </SectionCard>

                    {/* Emergency Protocol relocated to Sidebar */}
                    <SectionCard icon={<Heart size={18} fill="currentColor" />} title="Critical Triage Contact" accent="rose">
                        <div className="bg-rose-500 rounded-[3rem] p-10 text-white shadow-2xl shadow-rose-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40 transition-transform group-hover:scale-110 duration-700" />
                            <div className="relative z-10 space-y-8">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Designated Nominee</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 h-14 px-6 rounded-2xl text-base font-black outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/30 transition-all"
                                            value={formData.emergencyContactName}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                            placeholder="Nominee Name"
                                        />
                                    ) : (
                                        <h3 className="text-2xl font-black italic tracking-tight">{profile?.emergencyContactName || 'Establish protocol'}</h3>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Emergency Hotline</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 h-14 px-6 rounded-2xl text-base font-black outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/30 transition-all font-mono"
                                            value={formData.emergencyContactPhone}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!value.startsWith('+977-')) {
                                                    setFormData({ ...formData, emergencyContactPhone: '+977-' });
                                                    return;
                                                }
                                                const suffix = value.slice(5).replace(/\D/g, '').slice(0, 10);
                                                setFormData({ ...formData, emergencyContactPhone: '+977-' + suffix });
                                            }}
                                            placeholder="+977-"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg">
                                                <Phone size={20} fill="white" />
                                            </div>
                                            <span className="text-2xl font-black tracking-tighter tabular-nums font-mono">{profile?.emergencyContactPhone || '— — —'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>
            {/* Floating Save/Cancel Bar */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
                    >
                        <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 dark:border-slate-900/10 flex items-center justify-between gap-4">
                            <div className="flex flex-col ml-6">
                                <span className="text-[10px] font-black text-white/40 dark:text-slate-900/40 uppercase tracking-[0.2em]">Profile Synchronization</span>
                                <span className="text-xs font-black text-white dark:text-slate-900">Unsaved Identity Changes</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { setIsEditing(false); queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile() }); }}
                                    className="px-6 py-4 rounded-2xl text-[10px] font-black text-white/60 dark:text-slate-900/60 uppercase tracking-widest hover:text-white dark:hover:text-slate-900 transition-colors"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-4 bg-primary rounded-2xl flex items-center gap-3 text-[10px] font-black text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Sync Now
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </PageLayout>
    );
}
