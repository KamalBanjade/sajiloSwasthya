'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { patientApi } from '@/lib/api/patient';
import { DoctorExtendedProfile } from '@/lib/api';
import {
    Mail, Phone, Award, Building2, ArrowLeft, ShieldCheck, CheckCircle2,
    Stethoscope, GraduationCap, Briefcase, Star, Globe, Activity, Clock,
    MapPin, Users, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { usePatientDoctorDetail } from '@/hooks/useAdminQueries';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { useAuthStore } from '@/store/authStore';
import { ChatPanel } from '@/components/chat/ChatPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, accent = 'primary', action }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    accent?: 'primary' | 'secondary' | 'indigo' | 'violet' | 'amber' | 'emerald' | 'fuchsia' | 'rose' | 'sky' | 'teal' | 'slate' | 'orange' | 'red';
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
        teal: 'bg-teal-500 group-hover:shadow-teal-500/20',
        slate: 'bg-slate-500 group-hover:shadow-slate-500/20',
        orange: 'bg-orange-500 group-hover:shadow-orange-500/20',
        red: 'bg-red-500 group-hover:shadow-red-500/20'
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
        teal: 'bg-teal-500/10 text-teal-500',
        slate: 'bg-slate-500/10 text-slate-500',
        orange: 'bg-orange-500/10 text-orange-500',
        red: 'bg-red-500/10 text-red-500'
    };

    return (
        <div className="group bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[3rem] p-10 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-700 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-0 group-hover:h-full ${themes[accent]} transition-all duration-700 opacity-60`} />
            <div className="flex items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${lightThemes[accent]} flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-sm border border-current/5`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-[0.5em] leading-tight opacity-80">{title}</h2>
                        <div className={`h-0.5 w-6 ${themes[accent]} opacity-20 mt-3 rounded-full group-hover:w-12 transition-all duration-700`} />
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

export default function PatientDoctorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const doctorId = params.id as string;
    const { user } = useAuthStore();

    const { data: doctorRes, isLoading, isError } = usePatientDoctorDetail(doctorId);
    const doctor = doctorRes?.data;

    useEffect(() => {
        if (isError) {
            toast.error('Could not retrieve doctor profile');
            router.push('/profile');
        }
    }, [isError, router]);

    if (isLoading) {
        return <ProfileSkeleton />;
    }
    
    if (!doctor) return null;

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 space-y-12">

            {/* Hero */}
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-12 group/hero px-8">
                <div className="relative">
                    <div className="w-48 h-48 bg-slate-900 dark:bg-white rounded-[4rem] flex items-center justify-center text-white dark:text-slate-900 text-7xl font-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover/hero:scale-105 group-hover/hero:-rotate-3 relative z-10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700" />
                        {doctor.profilePictureUrl ? (
                            <img 
                                src={doctor.profilePictureUrl} 
                                alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <>{doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}</>
                        )}
                    </div>
                    {/* Floating Decorative Elements */}
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700" />

                    <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-primary rounded-[1.5rem] border-[6px] border-slate-50 dark:border-slate-900 flex items-center justify-center shadow-xl z-20">
                        <CheckCircle2 size={28} className="text-white" />
                    </div>
                </div>

                <div className="text-center lg:text-left space-y-6 flex-1">
                    <div className="space-y-2">
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-center lg:justify-start gap-3">
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-[0.3em]">Verified Medical Professional</span>
                        </motion.div>
                        <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight font-sans">
                            Dr. {doctor.firstName} <span className="text-primary italic">{doctor.lastName}</span>
                        </h1>
                        <div className="flex items-center justify-center lg:justify-start gap-4">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em]">{doctor.specialization}</p>
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">{doctor.departmentName}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                        <div className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm flex items-center gap-3 group/stat hover:border-primary/30 transition-all">
                            <Building2 size={14} className="text-primary group-hover/stat:scale-110 transition-transform" />
                            <span className="dark:text-white/80">{doctor.departmentName}</span>
                        </div>
                        <div className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm flex items-center gap-3 group/stat hover:border-amber-500/30 transition-all">
                            <Award size={14} className="text-amber-500 group-hover/stat:scale-110 transition-transform" />
                            <span className="dark:text-white/80">NMC LIC #{doctor.nmcLicense}</span>
                        </div>
                        {doctor.yearsOfExperience && (
                            <div className="px-5 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                <Briefcase size={14} /> {doctor.yearsOfExperience}+ Years Practice
                            </div>
                        )}
                        {doctor.acceptsNewPatients && (
                            <div className="px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                                <Users size={14} /> Intake Active
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* ── LEFT ── */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Biography */}
                    {doctor.biography && (
                        <SectionCard icon={<Briefcase size={18} />} title="Clinical Biography" accent="primary">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{doctor.biography}</p>
                        </SectionCard>
                    )}

                    {/* Education */}
                    {doctor.education.length > 0 && (
                        <SectionCard icon={<GraduationCap size={18} />} title="Academic Background" accent="indigo">
                            <div className="space-y-1">
                                {doctor.education.map((edu, i) => (
                                    <div key={i} className="flex gap-6 group/item">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover/item:scale-125 transition-transform" />
                                            {i < doctor.education.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 dark:bg-white/10 mt-1" />}
                                        </div>
                                        <div className="pb-8 flex-1">
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{edu.title}</p>
                                            {edu.institution && <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{edu.institution}</p>}
                                            {(edu.startYear || edu.endYear) && (
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 italic">{edu.startYear}{edu.endYear ? ` — ${edu.endYear}` : ''}</p>
                                            )}
                                            {edu.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-sans">{edu.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Experience */}
                    {doctor.experience.length > 0 && (
                        <SectionCard icon={<Stethoscope size={18} />} title="Clinical Experience" accent="teal">
                            <div className="space-y-1">
                                {doctor.experience.map((exp, i) => (
                                    <div key={i} className="flex gap-6 group/item">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-teal-500 mt-1.5 shrink-0 group-hover/item:scale-125 transition-transform" />
                                            {i < doctor.experience.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 dark:bg-white/10 mt-1" />}
                                        </div>
                                        <div className="pb-8 flex-1">
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{exp.title}</p>
                                            {exp.institution && <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">{exp.institution}</p>}
                                            {(exp.startYear || exp.endYear) && (
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 italic">{exp.startYear}{exp.endYear ? ` — ${exp.endYear}` : ''}</p>
                                            )}
                                            {exp.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-sans">{exp.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Certifications */}
                    {doctor.professionalCertifications.length > 0 && (
                        <SectionCard icon={<ShieldCheck size={18} />} title="Certifications & Fellowships" accent="violet">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {doctor.professionalCertifications.map((cert, i) => (
                                    <motion.div key={i} whileHover={{ scale: 1.02, y: -2 }} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-violet-500/30 transition-all duration-300">
                                        <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-500 shrink-0 shadow-sm border border-violet-500/10">
                                            <Award size={22} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{cert.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 opacity-60 italic">{cert.issuingBody}{cert.year ? ` · ${cert.year}` : ''}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Awards */}
                    {doctor.awards.length > 0 && (
                        <SectionCard icon={<Star size={18} />} title="Awards & Recognition" accent="amber">
                            <div className="space-y-4">
                                {doctor.awards.map((award, i) => (
                                    <div key={i} className="group/award flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-amber-500/30 transition-all duration-300">
                                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0 mt-0.5 group-hover/award:scale-110 transition-transform"><Star size={18} /></div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{award.title}</p>
                                            {award.institution && <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 uppercase tracking-wide">{award.institution}</p>}
                                            {award.startYear && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 italic">{award.startYear}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Procedures */}
                    {doctor.procedures.length > 0 && (
                        <SectionCard icon={<Activity size={18} />} title="Procedures & Expertise" accent="rose">
                            <div className="flex flex-wrap gap-3">
                                {doctor.procedures.map((proc, i) => (
                                    <span key={i} className="px-5 py-2.5 bg-rose-500/10 rounded-full border border-rose-500/20 text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:scale-105 transition-transform cursor-default">{proc}</span>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Custom Attributes */}
                    {doctor.customAttributes.length > 0 && (
                        <SectionCard icon={<Sparkles size={18} />} title="Additional Information" accent="slate">
                            <div className="space-y-4">
                                {doctor.customAttributes.map((attr, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-white/5 group/attr hover:border-slate-500/30 transition-all">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] min-w-[140px] group-hover/attr:text-slate-500/80 transition-colors">{attr.key}</span>
                                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{attr.value}</span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR ── */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Consultation Card */}
                    {(doctor.consultationFee || doctor.consultationHours || doctor.consultationLocation) && (
                        <div className="bg-slate-900 dark:bg-white rounded-[3rem] p-10 text-white dark:text-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center shadow-lg"><Clock size={22} /></div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Consultation Profile</span>
                                        <h3 className="text-sm font-black uppercase tracking-widest mt-1">Clinical Availability</h3>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {doctor.consultationFee && (
                                        <div className="flex items-center gap-4 p-5 bg-white/5 dark:bg-slate-900/5 rounded-2xl border border-white/5 dark:border-slate-900/5 hover:border-primary/20 transition-all duration-500 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-xs">रू</div>
                                            <span className="text-sm font-black tracking-tight">{doctor.consultationFee.replace(/Rs\.?\s*/i, '')}</span>
                                        </div>
                                    )}
                                    {doctor.consultationHours && (
                                        <div className="flex items-center gap-4 p-5 bg-white/5 dark:bg-slate-900/5 rounded-2xl border border-white/5 dark:border-slate-900/5 hover:border-teal-500/20 transition-all duration-500 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 dark:text-teal-600"><Clock size={16} /></div>
                                            <span className="text-sm font-black tracking-tight">{doctor.consultationHours}</span>
                                        </div>
                                    )}
                                    {doctor.consultationLocation && (
                                        <div className="flex items-center gap-4 p-5 bg-white/5 dark:bg-slate-900/5 rounded-2xl border border-white/5 dark:border-slate-900/5 hover:border-sky-500/20 transition-all duration-500 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 dark:text-sky-600"><MapPin size={16} /></div>
                                            <span className="text-sm font-black tracking-tight">{doctor.consultationLocation}</span>
                                        </div>
                                    )}
                                </div>


                                {doctor.acceptsNewPatients !== undefined && (
                                    <div className={`flex items-center justify-between gap-4 p-6 rounded-[2rem] border transition-all duration-500 ${doctor.acceptsNewPatients ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doctor.acceptsNewPatients ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                                <Users size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${doctor.acceptsNewPatients ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Patient Index</span>
                                                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${doctor.acceptsNewPatients ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {doctor.acceptsNewPatients ? 'Accepting Now' : 'Maximum Capacity'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-glow ${doctor.acceptsNewPatients ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact */}
                    {/* Contact */}
                    <SectionCard icon={<Mail size={20} />} title="Clinical Contact" accent="emerald">
                        <div className="space-y-4">
                            <div className="group/contact flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Mail size={16} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Sync Email</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate font-sans">{doctor.email}</p>
                                </div>
                            </div>
                            {doctor.contactNumber && (
                                <div className="group/contact flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Phone size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Hotline</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{doctor.contactNumber}</p>
                                    </div>
                                </div>
                            )}
                            {doctor.hospitalAffiliation && (
                                <div className="group/contact flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Building2 size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Institution</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate font-sans">{doctor.hospitalAffiliation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Languages */}
                    {doctor.languages.length > 0 && (
                        <SectionCard icon={<Globe size={20} />} title="Clinical Languages" accent="orange">
                            <div className="flex flex-wrap gap-2.5">
                                {doctor.languages.map((lang, i) => (
                                    <span key={i} className="px-4 py-2 bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 rounded-xl text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">{lang}</span>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Credentials Banner */}
                    <div className="p-10 bg-slate-900 dark:bg-white rounded-[3rem] text-white dark:text-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-1000">
                            <ShieldCheck size={200} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><Award size={18} /></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">NMC Accreditation</span>
                            </div>
                            <p className="text-3xl font-black italic tracking-tighter leading-tight">Registered Medical Practitioner</p>
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/20 rounded-xl border border-primary/30">
                                <ShieldCheck size={14} className="text-primary" />
                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{doctor.nmcLicense}</span>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Clinical Data Integrity</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed font-sans italic relative z-10">
                            This clinician is a verified member of your Care Team. All record access is audit-logged and protected by decentralized encryption in accordance with global HIPAA/GDPR standards.
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Integration */}
            {user && doctor && (
                <ChatPanel 
                    currentUserId={user.id}
                    otherUserId={doctor.userId}
                    otherUserName={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                    otherUserRole="Doctor"
                />
            )}
        </div>
    );
}
