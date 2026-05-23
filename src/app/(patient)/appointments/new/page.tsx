'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, CreateAppointmentDTO, DailyAvailability } from '@/lib/api/appointments';
import { patientApi, DoctorSuggestionItem, SmartDoctorSuggestionDTO, DoctorBasicInfo } from '@/lib/api/patient';
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    ChevronRight,
    CheckCircle2,
    Zap,
    CalendarDays,
    Activity,
    ShieldCheck,
    Search,
    Sunrise,
    Sun,
    Sunset,
    ChevronLeft,
} from 'lucide-react';
import { format, addDays, startOfMonth, addMonths, isBefore, startOfDay, getDay, isSameDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, normalizeUTC } from '@/lib/utils/dateUtils';
import { addMinutes } from 'date-fns';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getSlotHour(slotIso: string): number {
    // Convert UTC ISO to local time hour for grouping
    return new Date(slotIso).getHours();
}

interface SlotGroup {
    label: string;
    icon: React.ElementType;
    iconColor: string;
    slots: any[];
}

function groupSlots(slots: any[]): SlotGroup[] {
    const morning: any[] = [];
    const afternoon: any[] = [];
    const evening: any[] = [];

    for (const slot of slots) {
        const h = getSlotHour(slot.startTime);
        if (h < 12) morning.push(slot);
        else if (h < 17) afternoon.push(slot);
        else evening.push(slot);
    }

    const groups: SlotGroup[] = [];
    if (morning.length) groups.push({ label: 'Morning', icon: Sunrise, iconColor: 'text-amber-500', slots: morning });
    if (afternoon.length) groups.push({ label: 'Afternoon', icon: Sun, iconColor: 'text-emerald-500', slots: afternoon });
    if (evening.length) groups.push({ label: 'Evening', icon: Sunset, iconColor: 'text-violet-500', slots: evening });

    return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BookAppointmentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // Form state
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [appointmentDate, setAppointmentDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [appointmentTime, setAppointmentTime] = useState<string>('');
    const [reasonForVisit, setReasonForVisit] = useState<string>('');
    const [duration, setDuration] = useState<number>(30);
    const [department, setDepartment] = useState<string>('');

    // UI state
    const [isChangingDoctor, setIsChangingDoctor] = useState(false);
    const [reasonBasedSuggestions] = useState<DoctorSuggestionItem[]>([]);

    // Month visible in the DayPicker (for fetching availability per month)
    const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));
    const visibleMonth = format(calendarMonth, 'yyyy-MM');

    // ── Initial load effects ──────────────────────────────────────────────────
    useEffect(() => {
        const doctorIdParam = searchParams.get('doctorId');
        const reasonParam = searchParams.get('reason');
        if (doctorIdParam) { setSelectedDoctorId(doctorIdParam); setIsChangingDoctor(false); }
        if (reasonParam) setReasonForVisit(reasonParam);
    }, [searchParams]);

    // ── Data Queries ──────────────────────────────────────────────────────────
    const { data: suggestionsResponse } = useQuery({
        queryKey: ['smart-suggestions'],
        queryFn: () => appointmentsApi.getSmartSuggestions(),
        staleTime: 60000,
    });
    const suggestions = suggestionsResponse?.data as SmartDoctorSuggestionDTO;

    const { data: doctorsResponse } = useQuery({
        queryKey: ['doctors-by-dept', department],
        queryFn: () => patientApi.getDoctorsByDepartment(department),
        enabled: !!department,
    });
    const doctors = doctorsResponse?.data || [];

    // Monthly availability (for disabling unavailable dates in picker)
    const { data: monthlyAvailResponse } = useQuery({
        queryKey: ['monthly-avail', selectedDoctorId, visibleMonth],
        queryFn: () => appointmentsApi.getMonthlyAvailability(selectedDoctorId, visibleMonth),
        enabled: !!selectedDoctorId,
        staleTime: 300000,
    });

    const availableDates = useMemo<Set<string>>(() => {
        const s = new Set<string>();
        (monthlyAvailResponse?.data || []).forEach((d: DailyAvailability) => {
            if (d.isAvailable) s.add(d.date.split('T')[0]);
        });
        return s;
    }, [monthlyAvailResponse]);

    // Time slots for selected date
    const { data: slotsResponse, isLoading: slotsLoading } = useQuery({
        queryKey: ['doctor-slots', selectedDoctorId, appointmentDate, duration],
        queryFn: () => appointmentsApi.getAvailability(selectedDoctorId, appointmentDate, duration),
        enabled: !!selectedDoctorId && !!appointmentDate,
    });
    const availableSlots = slotsResponse?.data || [];

    // Grouped view of available slots
    const slotGroups = useMemo(() => groupSlots(availableSlots.filter((s: any) => s.isAvailable)), [availableSlots]);

    // Active tab — reset whenever groups change (e.g. new date selected)
    const [activeGroupLabel, setActiveGroupLabel] = useState<string>('');
    useEffect(() => {
        if (slotGroups.length > 0) setActiveGroupLabel(slotGroups[0].label);
        else setActiveGroupLabel('');
    }, [slotGroups]);

    const activeGroup = slotGroups.find(g => g.label === activeGroupLabel) ?? slotGroups[0];

    // ── Pre-selection logic ───────────────────────────────────────────────────
    useEffect(() => {
        if (suggestions?.recommendedDoctor && !selectedDoctorId && !searchParams.get('doctorId')) {
            setSelectedDoctorId(suggestions.recommendedDoctor.id);
        }
    }, [suggestions, selectedDoctorId, searchParams]);

    useEffect(() => { setAppointmentTime(''); }, [appointmentDate, selectedDoctorId, duration]);

    // ── Mutation ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: async (data: CreateAppointmentDTO) => {
            const bookingToast = toast.loading('Verifying availability and securing your slot...', {
                style: {
                    borderRadius: '16px',
                    background: '#1e293b',
                    color: '#fff',
                },
            });
            try {
                const result = await appointmentsApi.requestAppointment(data);
                toast.success('Appointment confirmed instantly!', {
                    id: bookingToast,
                    icon: '⚡',
                });
                return result;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to book appointment', {
                    id: bookingToast,
                });
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
            queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
            router.push('/appointments');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctorId || !appointmentDate || !appointmentTime || !reasonForVisit) {
            toast.error('Please fill in all required fields');
            return;
        }
        createMutation.mutate({
            doctorId: selectedDoctorId,
            appointmentDate: normalizeUTC(appointmentTime),
            duration,
            reasonForVisit,
        });
    };

    const selectedDoctor =
        [suggestions?.recommendedDoctor, suggestions?.primaryDoctor, ...suggestions?.recentDoctors || [], ...reasonBasedSuggestions]
            .find(d => d?.id === selectedDoctorId) ||
        doctors.find(d => d.id === selectedDoctorId);

    // ── Animation variants ────────────────────────────────────────────────────
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } as any }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto px-4 py-4 md:py-6 space-y-6 md:space-y-10 pb-20"
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── Left Panel ─────────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-10">

                    {/* Section 1 & 2: Doctor Selection + Reason */}
                    <motion.section variants={itemVariants} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Specialist Selection</h2>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest h-9 rounded-xl px-5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none"
                                    onClick={(e) => { e.preventDefault(); setIsChangingDoctor(!isChangingDoctor); }}
                                >
                                    {isChangingDoctor ? 'Return' : 'Change Specialist'}
                                </Button>
                            </div>

                            <AnimatePresence mode="wait">
                                {!isChangingDoctor ? (
                                    <React.Fragment key="selected-group">
                                        <motion.div
                                            key="selected"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 bg-emerald-50/40 dark:bg-emerald-500/5 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-500/10 flex items-center gap-5 transition-all group-hover:bg-emerald-50/80 dark:group-hover:!bg-emerald-500/10 group-hover:border-emerald-200/50 shadow-sm"
                                    >
                                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none overflow-hidden">
                                            {selectedDoctor?.profilePictureUrl ? (
                                                <img 
                                                    src={selectedDoctor.profilePictureUrl} 
                                                    alt="Doctor" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                ('fullName' in (selectedDoctor || {}) ? (selectedDoctor as DoctorSuggestionItem).fullName?.split(' ').pop()?.[0] : (selectedDoctor as DoctorBasicInfo)?.firstName?.[0]) || 'D'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                                    {('fullName' in (selectedDoctor || {}) ? (selectedDoctor as DoctorSuggestionItem).fullName : `Dr. ${(selectedDoctor as DoctorBasicInfo)?.firstName} ${(selectedDoctor as DoctorBasicInfo)?.lastName || ''}`) || 'Choose a Specialist'}
                                                </p>
                                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                            </div>
                                            <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest truncate">
                                                {('department' in (selectedDoctor || {}) ? (selectedDoctor as DoctorSuggestionItem).department : department) || 'Clinical Department Required'}
                                            </p>
                                        </div>
                                    </motion.div>
                                    {selectedDoctorId && !suggestions?.primaryDoctor && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 ml-6 flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-rose-500/80 uppercase tracking-widest">First interaction: will be set as primary specialist</span>
                                        </motion.div>
                                    )}
                                </React.Fragment>
                            ) : (
                                    <motion.div
                                        key="selector"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="space-y-6"
                                    >
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <select
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] h-12 pl-10 pr-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Search Clinical Dept</option>
                                                {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Dermatology'].map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {department ? (
                                                doctors.map(d => (
                                                    <button
                                                        key={d.id}
                                                        type="button"
                                                        onClick={() => { setSelectedDoctorId(d.id); setIsChangingDoctor(false); }}
                                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-[10px] font-black overflow-hidden shrink-0">
                                                            {d.profilePictureUrl ? (
                                                                <img src={d.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                `${d.firstName[0]}${d.lastName[0]}`
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Dr. {d.firstName} {d.lastName}</span>
                                                        </div>
                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                                    </button>
                                                ))
                                            ) : suggestions?.recentDoctors?.length ? (
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Recently Consulted Specialists</p>
                                                    {suggestions.recentDoctors.map(d => (
                                                        <button
                                                            key={d.id}
                                                            type="button"
                                                            onClick={() => { setSelectedDoctorId(d.id); setIsChangingDoctor(false); }}
                                                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
                                                        >
                                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-[10px] font-black overflow-hidden shrink-0">
                                                                {d.profilePictureUrl ? (
                                                                    <img src={d.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    d.fullName.split(' ').pop()?.[0]
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase truncate">{d.fullName}</p>
                                                                <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">{d.department}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center opacity-60">
                                                    <User className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a department above</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Reason */}
                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">2. Reason for Clinical Review</label>
                                <textarea
                                    value={reasonForVisit}
                                    onChange={(e) => setReasonForVisit(e.target.value)}
                                    placeholder="Describe your symptoms or reason for follow-up..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all h-32 resize-none placeholder:text-slate-400/70 shadow-inner"
                                    required
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* Section 3: Duration */}
                    <motion.section variants={itemVariants} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-premium">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-emerald-500" />
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Consultation Phase</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[15, 30, 45, 60].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDuration(d)}
                                        className={`py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${duration === d
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none scale-[1.02]'
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {d} Min Slot
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </div>

                {/* ── Right Panel ─────────────────────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-8 lg:space-y-10">
                    <motion.section
                        variants={itemVariants}
                        className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3.5rem] p-8 md:p-12 border border-white dark:border-slate-800 shadow-2xl space-y-12 transition-all"
                    >

                        {/* ── Date Picker ─────────────────────────────────────────────────── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">4. Scheduling Timeline</h2>
                            </div>
                        </div>

                        {/* ── DayPicker Calendar ─────────────────────────────── */}
                        <style>{`
                            .rdp-root {
                                --rdp-accent-color: #10b981;
                                --rdp-accent-background-color: #10b98118;
                                width: 100%;
                                max-width: 100%;
                                font-size: 13px;
                            }
                            .rdp-month { width: 100%; }
                            .rdp-month_grid { width: 100%; border-collapse: separate; border-spacing: 4px; }
                            .rdp-month_caption {
                                display: none; /* We'll use our own side header */
                            }
                            .rdp-weekday {
                                font-size: 0.55rem; font-weight: 900;
                                text-transform: uppercase; letter-spacing: 0.15em;
                                opacity: 0.4; padding-bottom: 0.6rem;
                            }
                            /* Sat is the ONLY holiday in Nepal — Red branding throughout the column */
                            .rdp-weekday:nth-child(7) { color: #ef4444 !important; opacity: 1 !important; }
                            .rdp-day { padding: 3px; }
                            .rdp-day_button {
                                width: 100%; aspect-ratio: 1;
                                border-radius: 12px;
                                font-size: 0.82rem; font-weight: 900;
                                transition: all 0.2s cubic-bezier(.4,0,.2,1);
                                border: 1.5px solid transparent; 
                                cursor: pointer;
                                background: rgba(148,163,184,0.04);
                                color: inherit;
                            }
                            /* Available Dates — Vibrant pop + subtle border */
                            .rdp-day_button:not([disabled]) {
                                background: rgba(16,185,129,0.06);
                                border-color: rgba(16,185,129,0.2);
                                color: #10b981;
                            }
                            .rdp-day_button:hover:not([disabled]) {
                                background: #10b98130; 
                                color: #10b981; 
                                transform: scale(1.1) translateY(-2px);
                                box-shadow: 0 4px 12px #10b98125;
                            }
                            /* Selected Date */
                            .rdp-selected .rdp-day_button {
                                background: linear-gradient(135deg,#10b981,#059669) !important;
                                color: white !important;
                                border-color: transparent !important;
                                box-shadow: 0 8px 25px #10b98160;
                                transform: scale(1.1);
                                opacity: 1 !important;
                                cursor: pointer !important;
                            }
                            /* Today — Active border, always high-vis */
                            .rdp-today:not(.rdp-selected) .rdp-day_button {
                                border: 2.5px solid #10b981 !important;
                                color: #10b981 !important;
                                background: #10b98112 !important;
                                opacity: 1 !important;
                            }
                            /* Disabled / Unavailable — Extreme dimming + Not Allowed cursor */
                            .rdp-disabled .rdp-day_button:not(.rdp-today) {
                                opacity: 0.1 !important; 
                                cursor: not-allowed !important; 
                                background: transparent !important;
                                filter: grayscale(1);
                                border: none !important;
                            }
                            /* Saturday Holiday styling — High-Vibrant Red text (No dimming, no grayscale) */
                            .rdp-weekday:nth-child(7) { color: #811f1fff !important; opacity: 1 !important; }
                            .rdp-week td:nth-child(7) .rdp-day_button { 
                                color: #811f1fff !important; 
                                font-weight: 1000 !important;
                                cursor: not-allowed !important;
                                opacity: 1 !important;
                                background: transparent !important;
                                border: none !important;
                                box-shadow: none !important;
                                filter: none !important; /* Remove grayscale */
                            }
                            .rdp-outside .rdp-day_button { opacity: 0; pointer-events: none; }
                            
                            /* Hide Redundant Navigation */
                            .rdp-nav {
                                display: none !important;
                            }
                        `}</style>

                        {/* ── Scheduling Hub (Calendar + Insights) ─────────────────────────── */}
                        <div className="rounded-[2.5rem] bg-slate-100/40 dark:bg-slate-800/25 border border-slate-200/50 dark:border-slate-700/30 overflow-hidden shadow-inner translate-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-12">
                                {/* Left Side: The Interaction */}
                                <div className="md:col-span-7 p-4 md:p-6 lg:p-8 bg-white/40 dark:bg-slate-800/10 md:border-r border-slate-200/50 dark:border-slate-700/30">
                                    <div className="flex items-center justify-between mb-4 md:mb-8">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                                            Interactive Calendar
                                        </p>
                                    </div>

                                    <DayPicker
                                        mode="single"
                                        selected={appointmentDate ? new Date(appointmentDate + 'T12:00:00') : undefined}
                                        onSelect={(day) => { if (day) setAppointmentDate(format(day, 'yyyy-MM-dd')); }}
                                        month={calendarMonth}
                                        onMonthChange={(month) => setCalendarMonth(startOfMonth(month))}
                                        disabled={(day) => {
                                            // 1. Never disable Today
                                            if (isSameDay(day, new Date())) return false;
                                            // 2. Disable Saturday (Day 6) - Holiday
                                            if (getDay(day) === 6) return true;
                                            // 3. Disable past dates
                                            if (isBefore(startOfDay(day), startOfDay(new Date()))) return true;
                                            // 4. Disable if no availability
                                            if (selectedDoctorId && availableDates.size > 0)
                                                return !availableDates.has(format(day, 'yyyy-MM-dd'));
                                            return false;
                                        }}
                                        showOutsideDays
                                        className="text-slate-900 dark:text-white"
                                    />
                                </div>

                                {/* Right Side: The Information Hub */}
                                <div className="md:col-span-5 p-8 lg:p-10 flex flex-col justify-between bg-slate-50/30 dark:bg-slate-900/10">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Planning For</p>
                                            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                                                {format(calendarMonth, 'MMMM')}
                                                <span className="text-slate-300 dark:text-slate-700 ml-2">{format(calendarMonth, 'yyyy')}</span>
                                            </h3>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-500">
                                                    <CalendarDays className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Date</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {appointmentDate ? format(new Date(appointmentDate + 'T12:00:00'), 'eeee, MMMM d') : 'No date picked'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center ${appointmentDate && getDay(new Date(appointmentDate + 'T12:00:00')) === 6
                                                    ? 'text-[#811f1f]'
                                                    : 'text-emerald-500'
                                                    }`}>
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                                    <p className={`text-xs font-bold ${appointmentDate && getDay(new Date(appointmentDate + 'T12:00:00')) === 6
                                                        ? 'text-[#811f1f]'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                        }`}>
                                                        {appointmentDate && getDay(new Date(appointmentDate + 'T12:00:00')) === 6 ? 'Saturday Holiday' : 'Standard Working Day'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Standard Holiday Legend */}
                                            <div className="flex items-center gap-4 pt-2">
                                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#811f1f]">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Standard Holiday</p>
                                                    <p className="text-xs font-bold text-[#811f1f]">
                                                        All Saturdays (Exclusive Red)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                                        <p className="text-[9px] leading-relaxed font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                            Pick a date to view slots.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* ── Time Slots ─────────────────────────────────────────── */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">5. Available Time Slots</h2>
                                </div>
                                {/* Clinical window badge — more prominent with Clock icon */}
                                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 rounded-full">
                                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em]">{duration} min window</span>
                                </div>
                            </div>

                            {slotsLoading ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="h-[68px] bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : slotGroups.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Pill tabs inside a tray */}
                                    <div className="flex gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl w-fit">
                                        {slotGroups.map(group => {
                                            const isActive = group.label === activeGroupLabel;
                                            return (
                                                <motion.button
                                                    key={group.label}
                                                    type="button"
                                                    onClick={() => setActiveGroupLabel(group.label)}
                                                    animate={isActive ? { scale: 1 } : { scale: 0.96 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-150 ${isActive
                                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
                                                        }`}
                                                >
                                                    <group.icon className="w-3 h-3 shrink-0" />
                                                    {group.label}
                                                    <span className={`text-[9px] font-black px-1 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                        }`}>{group.slots.length}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Slot grid — fades+slides per tab */}
                                    <AnimatePresence mode="wait">
                                        {activeGroup && (
                                            <motion.div
                                                key={activeGroup.label}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                transition={{ duration: 0.17, ease: [0.4, 0, 0.2, 1] }}
                                                className="grid grid-cols-3 sm:grid-cols-4 gap-2.5"
                                            >
                                                {activeGroup.slots.map((slot: any) => {
                                                    const startT = formatTime(slot.startTime);
                                                    const endT = formatTime(slot.endTime);
                                                    const active = appointmentTime === slot.startTime;
                                                    return (
                                                        <motion.button
                                                            key={slot.startTime}
                                                            whileHover={{ y: -4, scale: 1.04 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            type="button"
                                                            onClick={() => setAppointmentTime(slot.startTime)}
                                                            className={`relative flex flex-col items-start p-3.5 rounded-2xl overflow-hidden transition-all duration-150 ${active
                                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 border border-emerald-400/30'
                                                                : 'bg-white/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 hover:border-emerald-400/50 hover:shadow-sm'
                                                                }`}
                                                        >
                                                            {/* Start time — bold */}
                                                            <span className={`text-[13px] font-black leading-none tracking-tight ${active ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                                {startT}
                                                            </span>
                                                            {/* End time — small + muted */}
                                                            <span className={`text-[9px] font-bold tracking-widest uppercase mt-1.5 ${active ? 'text-white/55' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                → {endT}
                                                            </span>
                                                            {active && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute top-2 right-2 w-4 h-4 bg-white/25 rounded-full flex items-center justify-center"
                                                                >
                                                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : availableSlots.length > 0 && slotGroups.length === 0 ? (
                                // Slots exist but all are booked
                                <div className="py-16 text-center bg-amber-50/40 dark:bg-amber-900/10 rounded-[2.5rem] border-2 border-dashed border-amber-100 dark:border-amber-800/30">
                                    <CalendarDays className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Fully Booked</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">All slots on this date are taken. Please select another day.</p>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/60 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                    <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">No availability on this date</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Please select another day or consult a different specialist</p>
                                </div>
                            )}
                        </div>

                        {/* ── Confirmation ────────────────────────────────────────────────── */}
                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                            <AnimatePresence>
                                {appointmentTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-900/30 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-none shrink-0 relative z-10">
                                            <Zap className="w-8 h-8 fill-white" />
                                        </div>
                                        <div className="flex-1 text-center md:text-left relative z-10">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Instant Verification Ready</p>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 dark:text-emerald-50 tracking-tighter mb-1">
                                                {formatDate(appointmentTime)}
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-lg">
                                                    {formatTime(appointmentTime)} – {formatTime(addMinutes(new Date(normalizeUTC(appointmentTime)), duration).toISOString())}
                                                </span>
                                                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{duration} MIN SESSION</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                variant="secondary"
                                size="lg"
                                className="w-full h-20 rounded-[2rem] text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 dark:shadow-none group relative overflow-hidden active:scale-[0.98] transition-all disabled:opacity-50 border-none"
                                disabled={createMutation.isPending || !appointmentTime}
                            >
                                <div className="flex items-center justify-center gap-4 relative z-10 transition-transform group-hover:scale-105">
                                    {createMutation.isPending ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Book Appointment</span>
                                            <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                                        </>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>

                            <div className="flex items-center justify-center gap-3">
                                <div className="h-px w-8 bg-slate-100 dark:bg-slate-800" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    Digital confirmation will be sent to your dashboard
                                </p>
                                <div className="h-px w-8 bg-slate-100 dark:bg-slate-800" />
                            </div>
                        </div>
                    </motion.section>
                </div>
            </form>
        </motion.div>
    );
}
