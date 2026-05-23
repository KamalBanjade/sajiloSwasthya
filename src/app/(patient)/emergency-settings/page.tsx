'use client';
import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Heart,
    Users,
    Phone,
    Save,
    Eye,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Stethoscope,
    X,
    Zap,
    User,
    Info,
    RefreshCw,
    Activity,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientApi, EmergencySettingsDTO } from '@/lib/api/patient';
import { EmergencySkeleton } from '@/components/ui/EmergencySkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

// ── Schema ────────────────────────────────────────────────────────────────
const emergencySchema = z.object({
    bloodType: z.string().min(1, 'Blood type is required'),
    allergies: z.string().optional(),
    currentMedications: z.string().optional(),
    chronicConditions: z.string().optional(),
    emergencyContactName: z.string().min(2, 'Name is required'),
    emergencyContactPhone: z
        .string()
        .regex(/^\+977-\d{10}$/, 'Format: +977-XXXXXXXXXX'),
    emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
    emergencyNotesToResponders: z
        .string()
        .max(500, 'Notes must be under 500 characters')
        .optional(),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

// ── Standardized Input Component ────────────────────────────────────────
function StandardInput({
    id,
    label,
    error,
    icon: Icon,
    as: Component = 'input' as any,
    children,
    ...props
}: {
    id: string;
    label: string;
    error?: string;
    icon?: React.ComponentType<{ className?: string }>;
    as?: 'input' | 'select';
    children?: React.ReactNode;
} & any) {
    return (
        <div className="w-full space-y-2 group/field">
            <label htmlFor={id} className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.15em] block transition-colors px-1 group-focus-within/field:text-primary dark:group-focus-within/field:text-primary">
                {label}
            </label>
            <div className="relative group transition-all duration-300">
                <Component
                    id={id}
                    className={`
            w-full px-5 py-3.5 pr-12 rounded-[1.5rem] border bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white transition-all duration-300
            focus:outline-none focus:ring-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium
            hover:border-slate-400 dark:hover:border-slate-600 active:scale-[0.99]
            ${error
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500 shadow-sm shadow-rose-100/20 dark:shadow-rose-900/20'
                            : 'border-slate-200 dark:border-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none focus:ring-primary/10 focus:border-primary'
                        }
            ${Component === 'select' ? 'appearance-none' : ''}
          `}
                    {...props}
                >
                    {children}
                </Component>
                
                {Icon && (
                    <Icon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/field:text-primary transition-colors" />
                )}

                {!error && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-secondary transition-all duration-500 ease-out group-focus-within:w-[60%] opacity-0 group-focus-within:opacity-100 rounded-full" />
                )}
            </div>
            {error && <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 px-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>
    );
}

function StandardTextarea({
    id,
    label,
    error,
    ...props
}: {
    id: string;
    label: string;
    error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <div className="w-full space-y-2 group/field">
            <label htmlFor={id} className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.15em] block transition-colors px-1 group-focus-within/field:text-primary dark:group-focus-within/field:text-primary">
                {label}
            </label>
            <div className="relative group transition-all duration-300">
                <textarea
                    id={id}
                    className={`
            w-full px-6 py-6 min-h-[144px] rounded-[2rem] border bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 font-medium leading-relaxed transition-all duration-300
            focus:outline-none focus:ring-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium
            hover:border-slate-400 dark:hover:border-slate-600 resize-none
            ${error
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500 shadow-sm shadow-rose-100/20 dark:shadow-rose-900/20'
                            : 'border-slate-200 dark:border-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none focus:ring-primary/10 focus:border-primary'
                        }
          `}
                    {...props}
                />
                
                {!error && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-secondary transition-all duration-500 ease-out group-focus-within:w-[60%] opacity-0 group-focus-within:opacity-100 rounded-full" />
                )}
            </div>
            {error && <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 px-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function EmergencySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<EmergencyFormData>({
        resolver: zodResolver(emergencySchema),
        defaultValues: {
            bloodType: '',
            allergies: '',
            currentMedications: '',
            chronicConditions: '',
            emergencyContactName: '',
            emergencyContactPhone: '+977-',
            emergencyContactRelationship: '',
            emergencyNotesToResponders: '',
        },
    });

    const values = watch();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const res = await patientApi.getEmergencySettings();
                if (res.success && res.data) {
                    reset(res.data);
                    setLastUpdated(res.data.lastUpdated || null);
                }
            } catch {
                toast.error('Could not load emergency profile');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [reset]);

    const onSubmit = async (data: EmergencyFormData) => {
        setSaving(true);
        try {
            const res = await patientApi.updateEmergencySettings(data as EmergencySettingsDTO);
            if (res.success) {
                toast.success('Emergency profile saved');
                setLastUpdated(new Date().toISOString());
            } else {
                toast.error(res.message || 'Save failed');
            }
        } catch {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // ── Animations ───────────────────────────────────────────────────────────
    const container: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
    };

    const card: Variants = {
        hidden: { y: 24, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 120, damping: 18 },
        },
    };

    if (loading) {
        return (
            <EmergencySkeleton />
        );
    }

    return (
        <PageLayout>
            <div className="space-y-16 pb-40">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
                <div className="grid lg:grid-cols-12 gap-10 xl:gap-12">
                    {/* ── Left ── Medical Info ──────────────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Medical Basics */}
                        <motion.section variants={card} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-slate-300/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                    <Heart className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                    Medical Identity
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <StandardInput
                                    id="bloodType"
                                    label="Blood Type"
                                    error={errors.bloodType?.message}
                                    as="select"
                                    {...register('bloodType')}
                                >
                                    <option value="" disabled>Select blood type</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </StandardInput>

                                <StandardInput
                                    id="allergies"
                                    label="Major Allergies"
                                    placeholder="e.g. Penicillin, Peanuts"
                                    error={errors.allergies?.message}
                                    {...register('allergies')}
                                />

                                <div className="md:col-span-2">
                                    <StandardTextarea
                                        id="currentMedications"
                                        label="Current Medications"
                                        placeholder="List any ongoing medications..."
                                        error={errors.currentMedications?.message}
                                        {...register('currentMedications')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <StandardTextarea
                                        id="chronicConditions"
                                        label="Chronic Conditions"
                                        placeholder="List any chronic conditions..."
                                        error={errors.chronicConditions?.message}
                                        {...register('chronicConditions')}
                                    />
                                </div>
                            </div>
                        </motion.section>

                        {/* Notes to Responders */}
                        <motion.section variants={card} className="bg-gradient-to-br from-rose-950/40 via-slate-950/80 to-slate-950 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-rose-900/30 shadow-2xl shadow-rose-950/20 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-900/30 flex items-center justify-center text-rose-300">
                                        <AlertTriangle className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                                        Critical Notes for Responders
                                    </h2>
                                </div>

                                <StandardTextarea
                                    id="emergencyNotesToResponders"
                                    label="Important instructions (keep concise)"
                                    placeholder="Any critical info for EMTs..."
                                    error={errors.emergencyNotesToResponders?.message}
                                    {...register('emergencyNotesToResponders')}
                                />

                                <p className="mt-4 text-sm text-rose-300/80 font-medium flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Short, clear notes save critical seconds in emergencies.
                                </p>
                            </div>
                        </motion.section>
                    </div>

                    {/* ── Right ── Contact & Controls ──────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Emergency Contact */}
                        <motion.section variants={card} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-slate-300/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                    Emergency Contact
                                </h2>
                            </div>

                            <div className="space-y-7">
                                <StandardInput
                                    id="emergencyContactName"
                                    label="Full Name"
                                    placeholder="Jane Doe"
                                    error={errors.emergencyContactName?.message}
                                    icon={User}
                                    {...register('emergencyContactName')}
                                />

                                <StandardInput
                                    id="emergencyContactPhone"
                                    label="Phone Number"
                                    placeholder="+977-XXXXXXXXXX"
                                    error={errors.emergencyContactPhone?.message}
                                    icon={Phone}
                                    {...register('emergencyContactPhone', {
                                        onChange: (e) => {
                                            let val = e.target.value;
                                            if (!val.startsWith('+977-')) val = '+977-';
                                            val = '+977-' + val.slice(5).replace(/\D/g, '').slice(0, 10);
                                            setValue('emergencyContactPhone', val, { shouldDirty: true });
                                        },
                                    })}
                                />

                                <StandardInput
                                    id="emergencyContactRelationship"
                                    label="Relationship"
                                    placeholder="e.g. Spouse, Parent"
                                    error={errors.emergencyContactRelationship?.message}
                                    {...register('emergencyContactRelationship')}
                                />
                            </div>
                        </motion.section>

                        {/* Control Panel */}
                        <motion.section variants={card} className="bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-rose-950/20 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-10 border border-indigo-900/30 shadow-2xl shadow-indigo-950/20">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                        Finalize Your Lifeline
                                    </h3>
                                    <p className="mt-2 text-slate-300 text-sm">
                                        Make sure everything is accurate — lives may depend on it.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/10">
                                        <ShieldAlert className="w-8 h-8 text-indigo-400" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visibility</p>
                                            <p className="text-white font-medium">Emergency responders only</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/10">
                                        <Clock className="w-8 h-8 text-rose-400" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</p>
                                            <p className="text-white font-medium">
                                                {lastUpdated ? format(new Date(lastUpdated), 'MMM d, yyyy • HH:mm') : 'Never'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving || !isDirty}
                                        className={`
                      w-full h-16 rounded-2xl text-base font-extrabold uppercase tracking-wider
                      bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600
                      hover:brightness-110 hover:scale-[1.02] shadow-2xl shadow-indigo-600/40
                      active:scale-98 transition-all duration-200 flex items-center justify-center gap-3
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Save Lifeline Profile
                                                <CheckCircle2 className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPreviewOpen(true)}
                                        className={`
                      w-full h-16 rounded-2xl text-base font-bold border-2 border-indigo-500/40
                      hover:bg-indigo-950/40 hover:border-indigo-400/60 text-indigo-300
                      transition-all flex items-center justify-center gap-3
                    `}
                                    >
                                        <Eye className="w-5 h-5" />
                                        Preview Emergency Card
                                    </button>

                                    {isDirty && (
                                        <button
                                            type="button"
                                            onClick={() => reset()}
                                            className="text-sm text-rose-400 hover:text-rose-300 font-medium flex items-center gap-2 mx-auto"
                                        >
                                            <X className="w-4 h-4" />
                                            Discard changes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </form>

            {/* ── Preview Modal: Luxury Emergency Digital ID ──────────────────── */}
            <AnimatePresence>
                {previewOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
                            onClick={() => setPreviewOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="bg-[#0A0F1D] rounded-[3.5rem] shadow-3xl w-full max-w-4xl relative z-10 overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh] pointer-events-auto"
                        >
                            {/* Left Side: Branding & Critical Data (Bento Style) */}
                            <div className="w-full md:w-2/5 p-8 md:p-12 bg-gradient-to-b from-indigo-900/20 to-transparent flex flex-col justify-between border-r border-white/5">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Life-Line</h3>
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.6em] ml-1">Digital Identity</p>
                                        </div>
                                    </div>

                                    {/* Primary Bento Blocks */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-rose-500/10 rounded-[2.5rem] p-8 border border-rose-500/20 shadow-xl shadow-rose-500/5 relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Blood Group</p>
                                                <p className="text-7xl font-black text-white tracking-tighter leading-none">{values.bloodType || '——'}</p>
                                            </div>
                                            <Heart className="absolute -bottom-6 -right-6 w-32 h-32 text-rose-500/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                        </div>

                                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Major Allergies</p>
                                            </div>
                                            <p className="text-xl font-black text-white">{values.allergies || 'NO KNOWN ALLERGIES'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                                    <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Verified Medical Vault<br/>
                                        <span className="text-rose-500/60 font-black">Authorized Access Only</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Detailed Medical & Contact Info */}
                            <div className="w-full md:w-3/5 p-8 md:p-12 overflow-y-auto no-scrollbar space-y-10">
                                <div className="flex justify-end absolute top-8 right-8 z-20">
                                    <button 
                                        onClick={() => setPreviewOpen(false)}
                                        className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Medical Details Section */}
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Detailed Profile</h4>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Medications Bento */}
                                        <div className="bg-indigo-500/5 rounded-[2.5rem] p-8 border border-white/5 hover:border-indigo-500/20 transition-all group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                    <div className="text-[14px]">💊</div>
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest">Current Medications</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                                                {values.currentMedications || "No active medications recorded."}
                                            </p>
                                        </div>

                                        {/* Conditions Bento */}
                                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 hover:border-rose-500/20 transition-all">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <p className="text-[10px] font-black text-rose-400/80 uppercase tracking-widest">Chronic Conditions</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                                                {values.chronicConditions || "No chronic conditions disclosed."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact Section */}
                                <div className="space-y-6 pt-4 border-t border-white/5">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Authorized Contact</h4>
                                    <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                                                <Users className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-white">{values.emergencyContactName || 'NONE'}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/10">
                                                        {values.emergencyContactRelationship || 'Not Set'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:pl-22">
                                            <div className="flex-1 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                                                    <div className="text-[12px]">📞</div>
                                                </div>
                                                <span className="text-lg font-black text-white tracking-widest">{values.emergencyContactPhone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Responder Notes Bento (Always Rose to highlight importance) */}
                                {values.emergencyNotesToResponders && (
                                    <div className="bg-rose-500 p-8 rounded-[2.5rem] shadow-2xl shadow-rose-900/50 space-y-4 relative overflow-hidden group">
                                        <div className="flex items-center gap-2 text-rose-100 relative z-10">
                                            <AlertTriangle className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Responder Directives</p>
                                        </div>
                                        <p className="text-lg font-black text-white leading-tight relative z-10 italic">
                                            "{values.emergencyNotesToResponders}"
                                        </p>
                                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                    </div>
                                )}

                                <div className="mt-auto pt-8 text-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                    Last Sync: {lastUpdated ? format(new Date(lastUpdated), 'MMM d, HH:mm') : 'PENDING'} • Secure Vault
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </PageLayout>
    );
}