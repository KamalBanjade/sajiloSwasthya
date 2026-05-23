'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    doctorApi, 
    DoctorExtendedProfile, 
    UpdateDoctorExtendedProfileRequest, 
    DoctorProfileSection, 
    DoctorCertificationItem, 
    DoctorCustomAttribute 
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import {
    User, Mail, Phone, Building2, Award, Stethoscope, Edit2, Edit3, Save, Plus, X,
    GraduationCap, Briefcase, Star, Globe, CheckCircle2, ShieldCheck, Loader2, Check,
    Activity, Clock, MapPin, DollarSign, Users, Sparkles, ChevronRight, Trash2, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MedicalLoader } from '@/components/ui/MedicalLoader';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { SectionCard } from '@/components/ui/SectionCard';
import { useDoctorProfile } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProfileCompletionRing({ score, missing }: { score: number; missing: string[] }) {
    const color = score >= 80 ? '#00A388' : score >= 50 ? '#f59e0b' : '#ef4444';
    const circum = 2 * Math.PI * 42;
    const filled = (score / 100) * circum;

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 group">
                <div 
                    className="absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-1000 animate-pulse" 
                    style={{ backgroundColor: color }}
                />
                <svg className="w-32 h-32 -rotate-90 relative z-10" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800/50" />
                    <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={`${filled} ${circum - filled}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-3xl font-black tracking-tighter" style={{ color }}>{score}%</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Score</span>
                </div>
            </div>
            {missing.length > 0 && (
                <div className="space-y-2 w-full">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-1">Critical Gaps</p>
                    <div className="grid grid-cols-1 gap-2">
                        {missing.map((field) => (
                            <div key={field} className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/5 dark:to-transparent rounded-xl border-l-[3px] border-amber-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{field}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// ── Timeline Section (Education / Experience / Awards) ──────────────────────
function TimelineSection({
    items, isEditing, onAdd, onRemove, onUpdate, placeholders, hideEndYear, accent = 'primary'
}: {
    items: DoctorProfileSection[];
    isEditing: boolean;
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, field: keyof DoctorProfileSection, value: string) => void;
    placeholders: { title: string; institution: string; description: string };
    hideEndYear?: boolean;
    accent?: string;
}) {
    const accentColors: Record<string, string> = {
        primary: 'bg-primary',
        indigo: 'bg-indigo-500',
        violet: 'bg-violet-500',
        amber: 'bg-amber-500'
    };

    return (
        <div className="space-y-4">
            {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                    {isEditing ? (
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm hover:border-indigo-500/30 transition-all duration-500 space-y-5">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Entry Title / Role</label>
                                    <input className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        value={item.title} onChange={e => onUpdate(i, 'title', e.target.value)} placeholder={placeholders.title} />
                                </div>
                                <button onClick={() => onRemove(i)} className="w-11 h-11 shrink-0 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institution / Organization</label>
                                <div className="relative">
                                    <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            value={item.institution || ''} onChange={e => onUpdate(i, 'institution', e.target.value)} placeholder={placeholders.institution} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{hideEndYear ? "Date / Year" : "Start Year"}</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            value={item.startYear || ''} onChange={e => onUpdate(i, 'startYear', e.target.value)} placeholder={hideEndYear ? "Year" : "e.g. 2018"} />
                                    </div>
                                </div>
                                
                                {!hideEndYear && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Year</label>
                                        <div className="relative">
                                            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                value={item.endYear || ''} onChange={e => onUpdate(i, 'endYear', e.target.value)} placeholder="e.g. 2022 or Present" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Description</label>
                                <textarea className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-none"
                                    value={item.description || ''} onChange={e => onUpdate(i, 'description', e.target.value)} placeholder={placeholders.description} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-5">
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${accentColors[accent] || accentColors.primary} mt-1.5 shrink-0`} />
                                {i < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 dark:bg-white/5 mt-1" />}
                            </div>
                            <div className="pb-6 flex-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                                {item.institution && <p className="text-xs font-bold text-primary mt-0.5">{item.institution}</p>}
                                {(item.startYear || item.endYear) && (
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {item.startYear} {(!hideEndYear && item.endYear) ? `— ${item.endYear}` : ''}
                                    </p>
                                )}
                                {item.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.description}</p>}
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
            {!isEditing && items.length === 0 && (
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center py-4">No entries yet</p>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DoctorProfilePage() {
    const queryClient = useQueryClient();
    const { data: profileRes, isLoading: queryLoading } = useDoctorProfile();
    const profile = profileRes?.data;

    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Editable form state (mirrors the profile)
    const [bio, setBio] = useState('');
    const [yearsExp, setYearsExp] = useState('');
    const [contact, setContact] = useState('');
    const [hospital, setHospital] = useState('');
    const [fee, setFee] = useState('');
    const [hours, setHours] = useState('');
    const [location, setLocation] = useState('');
    const [acceptsNew, setAcceptsNew] = useState(true);
    const [education, setEducation] = useState<DoctorProfileSection[]>([]);
    const [experience, setExperience] = useState<DoctorProfileSection[]>([]);
    const [certifications, setCertifications] = useState<DoctorCertificationItem[]>([]);
    const [awards, setAwards] = useState<DoctorProfileSection[]>([]);
    const [procedures, setProcedures] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [customAttrs, setCustomAttrs] = useState<DoctorCustomAttribute[]>([]);
    const [newProc, setNewProc] = useState('');
    const [newLang, setNewLang] = useState('');

    useEffect(() => {
        if (profile && !isEditing) {
            setBio(profile.biography || '');
            setYearsExp(profile.yearsOfExperience?.toString() || '');
            setContact(profile.contactNumber || '');
            setHospital(profile.hospitalAffiliation || '');
            setFee(profile.consultationFee || '');
            setHours(profile.consultationHours || '');
            setLocation(profile.consultationLocation || '');
            setAcceptsNew(profile.acceptsNewPatients ?? true);
            setEducation(profile.education || []);
            setExperience(profile.experience || []);
            setCertifications(profile.professionalCertifications || []);
            setAwards(profile.awards || []);
            setProcedures(profile.procedures || []);
            setLanguages(profile.languages || []);
            setCustomAttrs(profile.customAttributes || []);
        }
    }, [profile, isEditing]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: UpdateDoctorExtendedProfileRequest = {
                contactNumber: contact,
                hospitalAffiliation: hospital,
                biography: bio,
                yearsOfExperience: yearsExp ? parseInt(yearsExp) : undefined,
                consultationFee: fee,
                consultationHours: hours,
                consultationLocation: location,
                acceptsNewPatients: acceptsNew,
                education,
                experience,
                professionalCertifications: certifications,
                awards,
                procedures,
                languages,
                customAttributes: customAttrs,
            };
            await doctorApi.updateProfile(payload);
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.profile() });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        try {
            await doctorApi.uploadProfilePicture(file);
            toast.success('Clinical identity visual updated');
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.profile() });
        } catch (error) {
            toast.error('Visual synchronization error');
        }
    };

    const handleImageDelete = async () => {
        try {
            await doctorApi.deleteProfilePicture();
            toast.success('Clinical identity visual removed');
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.profile() });
        } catch (error) {
            toast.error('Visual removal error');
        }
    };

    const cancelEdit = () => {
        if (profile) {
            setBio(profile.biography || '');
            setYearsExp(profile.yearsOfExperience?.toString() || '');
            setContact(profile.contactNumber || '');
            setHospital(profile.hospitalAffiliation || '');
            setFee(profile.consultationFee || '');
            setHours(profile.consultationHours || '');
            setLocation(profile.consultationLocation || '');
            setAcceptsNew(profile.acceptsNewPatients ?? true);
            setEducation(profile.education || []);
            setExperience(profile.experience || []);
            setCertifications(profile.professionalCertifications || []);
            setAwards(profile.awards || []);
            setProcedures(profile.procedures || []);
            setLanguages(profile.languages || []);
            setCustomAttrs(profile.customAttributes || []);
        }
        setIsEditing(false);
    };

    // Section helpers
    const makeSection = (): DoctorProfileSection => ({ title: '', institution: '', startYear: '', endYear: '', description: '' });
    const makeCert = (): DoctorCertificationItem => ({ name: '', issuingBody: '', year: '', description: '' });

    const updateSection = (arr: DoctorProfileSection[], set: React.Dispatch<React.SetStateAction<DoctorProfileSection[]>>, i: number, field: keyof DoctorProfileSection, val: string) => {
        const next = [...arr]; next[i] = { ...next[i], [field]: val }; set(next);
    };

    if (queryLoading || !profile) {
        return <ProfileSkeleton />;
    }

    if (!profile) return null;

    return (
        <PageLayout className="relative space-y-12 overflow-hidden">
            {/* Background Decorative Blurs */}
            <motion.div 
                animate={{ 
                    x: [0, 30, 0], 
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[120px] -z-10" 
            />
            <motion.div 
                animate={{ 
                    x: [0, -40, 0], 
                    y: [0, 30, 0],
                    scale: [1, 1.15, 1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[140px] -z-10" 
            />
            <motion.div 
                animate={{ 
                    x: [0, 50, 0], 
                    y: [0, -20, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-fuchsia-500/[0.03] rounded-full blur-[100px] -z-10" 
            />
            <motion.div 
                animate={{ 
                    x: [0, -20, 0], 
                    y: [0, 60, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[120px] -z-10" 
            />

            {/* ── HEADER ── */}
            <div className={`group relative rounded-[4rem] p-12 overflow-hidden backdrop-blur-md shadow-premium border transition-all duration-700 ${isEditing ? 'bg-indigo-50/70 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-500/30' : 'bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-white/5'}`}>
                {isEditing && (
                    <div className="absolute top-8 right-8 z-30 flex items-center gap-2 px-4 py-1.5 bg-indigo-500 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/40 animate-pulse">
                        <Edit2 size={12} /> Editing Mode
                    </div>
                )}
                <div className="absolute inset-0 bg-medical-pattern opacity-10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col lg:flex-row items-center gap-10 text-center lg:text-left">
                        <div className="relative">
                            <ProfilePictureUpload
                                currentImageUrl={profile.profilePictureUrl}
                                onUpload={handleImageUpload}
                                onDelete={handleImageDelete}
                                firstName={profile.firstName}
                                lastName={profile.lastName}
                            />
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">Verified Practitioner</p>
                                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                                    Dr. {profile.firstName} <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">{profile.lastName}</span>
                                </h1>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                <span className="px-5 py-2 bg-primary/10 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-primary/10">
                                    {profile.specialization}
                                </span>
                                <span className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {profile.departmentName}
                                </span>
                                <span className="px-5 py-2 bg-emerald-500/10 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-500/10">
                                    NMC #{profile.nmcLicense}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isEditing && (
                            <Button onClick={cancelEdit} className="h-14 px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 shadow-sm transition-all">
                                Cancel
                            </Button>
                        )}
                        <Button
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                            disabled={saving}
                            className={`h-16 px-12 rounded-[1.75rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-elevated active:scale-95 flex items-center gap-4
                                ${isEditing ? 'bg-secondary text-white hover:bg-secondary/90' : 'bg-primary text-white hover:bg-primary/90'}`}
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : isEditing ? <Save size={20} /> : <Edit3 size={20} />}
                            {isEditing ? 'Sync Profile' : 'Modify Identity'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* ── LEFT: Main Content ── */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Biography */}
                    <SectionCard icon={<User size={18} />} title="Professional Biography">
                        {isEditing ? (
                            <textarea
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-primary min-h-[120px] resize-none"
                                value={bio} onChange={e => setBio(e.target.value)}
                                placeholder="Write a compelling professional biography that patients and colleagues will see..."
                            />
                        ) : (
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                                {bio || <span className="text-slate-300 dark:text-slate-600 italic">No biography added yet. Click Edit Profile to add one.</span>}
                            </p>
                        )}
                    </SectionCard>

                    {/* Education */}
                    <SectionCard 
                        icon={<GraduationCap size={18} />} title="Academic Background" accent="indigo"
                        action={isEditing && (
                            <button onClick={() => setEducation([...education, makeSection()])} 
                                className="px-4 py-2 bg-indigo-500 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 uppercase tracking-widest">
                                <Plus size={14} /> Add Education
                            </button>
                        )}
                    >
                        <TimelineSection
                            items={education} isEditing={isEditing}
                            onAdd={() => setEducation([...education, makeSection()])}
                            onRemove={i => setEducation(education.filter((_, idx) => idx !== i))}
                            onUpdate={(i, f, v) => updateSection(education, setEducation, i, f, v)}
                            placeholders={{ title: 'Degree (e.g. MBBS, MD, PhD)', institution: 'University / Institution', description: 'Additional notes...' }}
                            accent="indigo"
                        />
                    </SectionCard>

                    {/* Experience */}
                    <SectionCard 
                        icon={<Briefcase size={18} />} title="Clinical Experience" accent="violet"
                        action={isEditing && (
                            <button onClick={() => setExperience([...experience, makeSection()])} 
                                className="px-4 py-2 bg-violet-500 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-violet-600 shadow-lg shadow-violet-500/20 transition-all active:scale-95 uppercase tracking-widest">
                                <Plus size={14} /> Add Experience
                            </button>
                        )}
                    >
                        <TimelineSection
                            items={experience} isEditing={isEditing}
                            onAdd={() => setExperience([...experience, makeSection()])}
                            onRemove={i => setExperience(experience.filter((_, idx) => idx !== i))}
                            onUpdate={(i, f, v) => updateSection(experience, setExperience, i, f, v)}
                            placeholders={{ title: 'Role / Position', institution: 'Hospital / Clinic', description: 'Responsibilities and achievements...' }}
                            accent="violet"
                        />
                    </SectionCard>

                    {/* Certifications */}
                    <SectionCard 
                        icon={<Award size={18} />} title="Certifications & Fellowships" accent="amber"
                        action={isEditing && (
                            <button onClick={() => setCertifications([...certifications, makeCert()])} 
                                className="px-4 py-2 bg-amber-500 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 uppercase tracking-widest">
                                <Plus size={14} /> Add Certification
                            </button>
                        )}
                    >
                        <div className="space-y-4">
                            {certifications.map((cert, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    {isEditing ? (
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                                            <div className="flex gap-2">
                                                <input className="flex-1 h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black outline-none focus:border-amber-500 transition-all"
                                                    value={cert.name} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], name: e.target.value }; setCertifications(n); }} placeholder="Certification / Diploma / Fellowship Name" title="Certification Name" />
                                                <button onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))} className="w-10 h-10 shrink-0 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:border-amber-500 shadow-sm"
                                                    value={cert.issuingBody || ''} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], issuingBody: e.target.value }; setCertifications(n); }} placeholder="Issuing Organization" title="Organization" />
                                                <input className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:border-amber-500 shadow-sm"
                                                    value={cert.year || ''} onChange={e => { const n = [...certifications]; n[i] = { ...n[i], year: e.target.value }; setCertifications(n); }} placeholder="Year of Issue" title="Year" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-5 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/10 transition-colors hover:bg-amber-500/10">
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500"><Award size={24} /></div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{cert.name}</p>
                                                <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mt-0.5">{cert.issuingBody}{cert.year ? ` · ${cert.year}` : ''}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {!isEditing && certifications.length === 0 && <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center py-4">No certifications added yet</p>}
                        </div>
                    </SectionCard>

                    {/* Awards */}
                    <SectionCard 
                        icon={<Star size={18} />} title="Awards & Recognition" accent="rose"
                        action={isEditing && (
                            <button onClick={() => setAwards([...awards, makeSection()])} 
                                className="px-4 py-2 bg-rose-500 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all active:scale-95 uppercase tracking-widest">
                                <Plus size={14} /> Add Award
                            </button>
                        )}
                    >
                        <TimelineSection
                            items={awards} isEditing={isEditing}
                            onAdd={() => setAwards([...awards, makeSection()])}
                            onRemove={i => setAwards(awards.filter((_, idx) => idx !== i))}
                            onUpdate={(i, f, v) => updateSection(awards, setAwards, i, f, v)}
                            placeholders={{ title: 'Award Name', institution: 'Awarding Organization', description: 'Additional details or context...' }}
                            hideEndYear={true}
                            accent="rose"
                        />
                    </SectionCard>

                    {/* Procedures */}
                    <SectionCard 
                        icon={<Activity size={18} />} title="Procedures & Expertise" accent="emerald"
                        action={isEditing && (
                            <div className="flex gap-2">
                                <input
                                    className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/50 w-48 shadow-sm transition-all"
                                    value={newProc} onChange={e => setNewProc(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newProc.trim()) { setProcedures([...procedures, newProc.trim()]); setNewProc(''); } }}
                                    placeholder="Enter procedure..."
                                />
                                <button onClick={() => { if (newProc.trim()) { setProcedures([...procedures, newProc.trim()]); setNewProc(''); } }}
                                    className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"><Plus size={16} /></button>
                            </div>
                        )}
                    >
                        <div className="flex flex-wrap gap-3">
                            {procedures.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group/proc hover:bg-emerald-500 transition-colors">
                                    <span className="text-xs font-black text-emerald-600 group-hover/proc:text-white">{p}</span>
                                    {isEditing && <button onClick={() => setProcedures(procedures.filter((_, idx) => idx !== i))} className="text-emerald-600/60 group-hover/proc:text-white/80 hover:scale-110 transition-all"><X size={12} /></button>}
                                </div>
                            ))}
                            {!isEditing && procedures.length === 0 && <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest py-2 italic font-sans">No procedures listed</p>}
                        </div>
                    </SectionCard>

                    {/* Custom Attributes */}
                    <SectionCard 
                        icon={<Sparkles size={18} />} title="Custom Profile Highlights" accent="fuchsia"
                        action={isEditing && (
                            <button onClick={() => setCustomAttrs([...customAttrs, { key: '', value: '' }])} 
                                className="px-4 py-2 bg-fuchsia-500 rounded-xl flex items-center gap-2 text-[10px] font-black text-white hover:bg-fuchsia-600 shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95 uppercase tracking-widest">
                                <Plus size={14} /> Add Highlight
                            </button>
                        )}
                    >
                        <div className="space-y-3">
                            {customAttrs.map((attr, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    {isEditing ? (
                                        <>
                                            <input className="flex-1 h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-fuchsia-500/50 shadow-sm transition-all"
                                                value={attr.key} onChange={e => { const n = [...customAttrs]; n[i] = { ...n[i], key: e.target.value }; setCustomAttrs(n); }} placeholder="Label (e.g. Research Focus)" title="Label" />
                                            <input className="flex-1 h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-fuchsia-500/50 shadow-sm transition-all"
                                                value={attr.value} onChange={e => { const n = [...customAttrs]; n[i] = { ...n[i], value: e.target.value }; setCustomAttrs(n); }} placeholder="Detail / Value" title="Value" />
                                            <button onClick={() => setCustomAttrs(customAttrs.filter((_, idx) => idx !== i))} className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center gap-3 p-3 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/10 transition-all hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/20 group/attr">
                                            <span className="text-[10px] font-black text-fuchsia-600/70 uppercase tracking-widest min-w-[140px] group-hover/attr:text-fuchsia-600 transition-colors font-sans">{attr.key}</span>
                                            <span className="h-4 w-px bg-fuchsia-200 dark:bg-fuchsia-800/30" />
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{attr.value}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!isEditing && customAttrs.length === 0 && <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center py-2">No custom highlights added</p>}
                        </div>
                    </SectionCard>
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Profile Completion */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-opacity group-hover:opacity-100" />
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-[1rem] bg-secondary/10 flex items-center justify-center text-secondary"><Sparkles size={18} /></div>
                            <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Identity Strength</h2>
                        </div>
                        <ProfileCompletionRing score={profile.profileCompletionScore} missing={profile.missingProfileFields} />
                    </div>

                    {/* Consultation Info */}
                    <div className="group relative rounded-[3rem] p-[1px] bg-gradient-to-br from-primary to-secondary shadow-elevated overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-medical-pattern opacity-10 pointer-events-none" />
                        <div className="relative bg-slate-900 dark:bg-slate-900 rounded-[2.9rem] p-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary"><Clock size={20} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Consultation</h3>
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-0.5">Scheduling Hub</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="relative group/box">
                                            <input className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-white/20 text-white transition-all"
                                                value={fee} onChange={e => setFee(e.target.value)} placeholder="Consultation Fee" />
                                            <DollarSign className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <div className="relative group/box">
                                            <input className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-white/20 text-white transition-all"
                                                value={hours} onChange={e => setHours(e.target.value)} placeholder="Consultation Hours" />
                                            <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <div className="relative group/box">
                                            <input className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-white/20 text-white transition-all"
                                                value={location} onChange={e => setLocation(e.target.value)} placeholder="Consultation Location" />
                                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group-hover:bg-white/10 transition-all">
                                            <span className="text-[11px] font-black text-white/80 uppercase tracking-widest font-sans">New Clients</span>
                                            <div className={`w-12 h-7 rounded-full transition-all duration-500 relative ${acceptsNew ? 'bg-secondary' : 'bg-white/10'}`} onClick={() => setAcceptsNew(!acceptsNew)}>
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-500 ${acceptsNew ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <DollarSign size={18} className="text-secondary" />
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-sans">Fee</span>
                                            </div>
                                            <span className="text-sm font-black text-white tracking-tight">{fee || 'Not Set'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Clock size={18} className="text-secondary" />
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-sans">Hours</span>
                                            </div>
                                            <span className="text-sm font-black text-white tracking-tight">{hours || 'Not Set'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <MapPin size={18} className="text-secondary" />
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-sans">Clinic</span>
                                            </div>
                                            <span className="text-sm font-black text-white tracking-tight">{location || 'Not Set'}</span>
                                        </div>
                                        <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${acceptsNew ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                                            <Users size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                {acceptsNew ? 'Accepting New Patients' : 'Roster Full'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="group bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm transition-all duration-500 hover:shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-sky-500 transition-all duration-700" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-[1rem] bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500"><Phone size={18} /></div>
                            <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Connection</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 transition-colors group/item hover:bg-sky-500/10">
                                <Mail size={16} className="text-sky-500 opacity-50 group-hover/item:opacity-100 transition-opacity" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate font-sans">{profile.email}</span>
                            </div>
                            {isEditing ? (
                                <div className="space-y-3 pt-2">
                                    <input className="w-full h-11 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold font-sans outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                                        value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone Number" />
                                    <input className="w-full h-11 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold font-sans outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                                        value={hospital} onChange={e => setHospital(e.target.value)} placeholder="Hospital Affiliation" />
                                    <input className="w-full h-11 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold font-sans outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                                        value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="Experience (Years)" type="number" />
                                </div>
                            ) : (
                                <>
                                    {contact && (
                                        <div className="flex items-center gap-4 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 transition-colors group/item hover:bg-sky-500/10">
                                            <Phone size={16} className="text-sky-500 opacity-50 group-hover/item:opacity-100 transition-opacity" /><span className="text-xs font-bold text-slate-900 dark:text-white font-sans">{contact}</span>
                                        </div>
                                    )}
                                    {hospital && (
                                        <div className="flex items-center gap-4 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 transition-colors group/item hover:bg-sky-500/10">
                                            <Building2 size={16} className="text-sky-500 opacity-50 group-hover/item:opacity-100 transition-opacity" /><span className="text-xs font-bold text-slate-900 dark:text-white font-sans">{hospital}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="group bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm transition-all duration-500 hover:shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-teal-500 transition-all duration-700" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-[1rem] bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500"><Globe size={18} /></div>
                            <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">Languages</h2>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {languages.map((lang, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-teal-500/5 dark:bg-teal-500/10 rounded-2xl group/tag hover:bg-teal-500 transition-colors">
                                    <span className="text-[10px] font-black text-teal-500 group-hover:text-white uppercase tracking-widest">{lang}</span>
                                    {isEditing && <button onClick={() => setLanguages(languages.filter((_, idx) => idx !== i))} className="text-teal-500/50 hover:text-rose-500 transition-colors"><X size={12} /></button>}
                                </div>
                            ))}
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <input className="h-9 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-teal-500/50 w-32 uppercase tracking-widest"
                                        value={newLang} onChange={e => setNewLang(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && newLang.trim()) { setLanguages([...languages, newLang.trim()]); setNewLang(''); } }}
                                        placeholder="ADD NEW..." />
                                    <button onClick={() => { if (newLang.trim()) { setLanguages([...languages, newLang.trim()]); setNewLang(''); } }}
                                        className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-white hover:bg-teal-500/90 transition-colors shadow-lg shadow-teal-500/20"><Plus size={14} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Badge */}
                    <div className="group relative p-8 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-500/10 dark:to-transparent rounded-[2.5rem] border border-emerald-500/10 transition-all duration-500 hover:border-emerald-500/30 overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><ShieldCheck size={20} /></div>
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Sajilo Swasthya Verified</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-sans italic opacity-80 pl-2 border-l-2 border-emerald-200 dark:border-emerald-500/20">
                            Your clinical identity is audited and cryptographically secured on our sovereign medical network.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SAVE / CANCEL FLOATING BAR ── */}
            {isEditing && (
                <motion.div 
                    initial={{ y: 100, x: "-50%" }} 
                    animate={{ y: 0, x: "-50%" }} 
                    className="fixed bottom-12 left-1/2 z-[60] flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-indigo-200 dark:border-indigo-500/30 shadow-2xl min-w-[320px] justify-center"
                >
                    <button 
                        onClick={cancelEdit}
                        className="px-8 py-4 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        Discard Changes
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-4 bg-indigo-500 rounded-2xl flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </motion.div>
            )}
        </PageLayout>
    );
}
