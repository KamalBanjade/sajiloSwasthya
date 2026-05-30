'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { doctorAvailabilityApi, DoctorAvailabilityDTO } from '@/lib/api/doctor-availability';
import {
    Calendar,
    Clock,
    Plus,
    Trash2,
    CalendarDays,
    CheckCircle2,
    Timer,
    ArrowRight,
    Activity,
    XCircle,
    Coffee,
    Sparkles,
    Loader2,
    Shield,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDate, normalizeUTC } from '@/lib/utils/dateUtils';
import { MedicalLoader } from '@/components/ui/MedicalLoader';
import { SectionCard } from '@/components/ui/SectionCard';
import { useDoctorSchedule } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { AvailabilitySkeleton } from '@/components/doctor/AvailabilitySkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { useConfirm } from '@/context/ConfirmContext';

const DAYS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DateCalendarPicker({
    value,
    onChange,
    minDate,
}: {
    value: string;
    onChange: (date: string) => void;
    minDate: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = useState<{ top: number; left: number }>(({ top: 0, left: 0 }));

    const minDateObj = useMemo(
        () => startOfDay(new Date((minDate || format(new Date(), 'yyyy-MM-dd')) + 'T00:00:00')),
        [minDate]
    );

    const [viewYear, setViewYear] = useState(() => minDateObj.getFullYear());
    const [viewMonth, setViewMonth] = useState(() => minDateObj.getMonth());

    // Sync view to minDate when it changes (e.g. end picker after start changes)
    useEffect(() => {
        setViewYear(minDateObj.getFullYear());
        setViewMonth(minDateObj.getMonth());
    }, [minDate]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (containerRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPopupStyle({ top: rect.bottom + 6, left: rect.left });
        }
        setIsOpen(o => !o);
    };

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const isAtMinMonth = viewYear === minDateObj.getFullYear() && viewMonth === minDateObj.getMonth();

    const handlePrevMonth = () => {
        if (isAtMinMonth) return;
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const handleNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const isPast = (day: number) => {
        const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return isBefore(startOfDay(new Date(d + 'T00:00:00')), minDateObj);
    };

    const handleSelect = (day: number) => {
        if (isPast(day)) return;
        const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(d);
        setIsOpen(false);
    };

    const displayValue = value
        ? format(new Date(value + 'T00:00:00'), 'MMM d, yyyy')
        : 'Select date';

    const popup = isOpen ? createPortal(
        <div
            ref={containerRef}
            style={{ position: 'fixed', top: popupStyle.top, left: popupStyle.left, zIndex: 9999 }}
            className="w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-300/30 dark:shadow-black/40 p-4"
        >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={isAtMinMonth}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold transition-colors
                        ${isAtMinMonth
                            ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    ‹
                </button>
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    ›
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[8px] font-black text-slate-400 uppercase py-1">{d}</div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const past = isPast(day);
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = value === dateStr;
                    const isToday = dateStr === todayStr;
                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={past}
                            onClick={() => handleSelect(day)}
                            className={[
                                'w-8 h-8 mx-auto flex items-center justify-center rounded-full text-[10px] font-black transition-all',
                                past
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : isSelected
                                        ? 'bg-rose-500 text-white'
                                        : isToday
                                            ? 'ring-1 ring-rose-400 ring-offset-1 dark:ring-offset-slate-900 text-slate-800 dark:text-slate-100 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer',
                            ].join(' ')}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Today shortcut */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        if (!isPast(new Date().getDate()) ||
                            (viewYear === minDateObj.getFullYear() && viewMonth === minDateObj.getMonth())) {
                            const today = new Date();
                            const todayVal = format(today, 'yyyy-MM-dd');
                            if (!isBefore(startOfDay(today), minDateObj)) {
                                onChange(todayVal);
                                setIsOpen(false);
                            }
                        }
                    }}
                    className="w-full text-center text-[9px] font-black text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 uppercase tracking-widest transition-colors py-1"
                >
                    Today
                </button>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div className="flex items-center gap-2 w-full">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={handleOpen}
                    className="flex-1 bg-transparent text-slate-900 dark:text-white text-xs font-black outline-none border-none cursor-pointer text-left"
                >
                    {displayValue}
                </button>
                <button
                    type="button"
                    onClick={handleOpen}
                    className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors outline-none border-none cursor-pointer"
                >
                    <CalendarDays size={13} />
                </button>
            </div>
            {popup}
        </>
    );
}

export default function AvailabilityPage() {
    const queryClient = useQueryClient();
    const [dateRange] = useState(() => {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 3);
        return { start: start.toISOString(), end: end.toISOString() };
    });

    const { data: scheduleRes, isLoading: queryLoading } = useDoctorSchedule(dateRange.start, dateRange.end);
    const schedule = scheduleRes?.data || [];

    // Weekly Schedule Form
    const [selectedDay, setSelectedDay] = useState(0);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakStartTime, setBreakStartTime] = useState('12:00');
    const [breakEndTime, setBreakEndTime] = useState('13:00');
    const [useBreak, setUseBreak] = useState(false);
    const [isSavingHours, setIsSavingHours] = useState(false);

    const todayYmd = format(new Date(), 'yyyy-MM-dd');

    // Block Time Form
    const [blockStartDate, setBlockStartDate] = useState(todayYmd);
    const [blockStartHour, setBlockStartHour] = useState('09');
    const [blockStartMin, setBlockStartMin] = useState('00');
    const [blockStartAmPm, setBlockStartAmPm] = useState('AM');

    const [blockEndDate, setBlockEndDate] = useState(todayYmd);
    const [blockEndHour, setBlockEndHour] = useState('05');
    const [blockEndMin, setBlockEndMin] = useState('00');
    const [blockEndAmPm, setBlockEndAmPm] = useState('PM');

    const [blockReason, setBlockReason] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);

    const { confirm } = useConfirm();

    const weeklyHours = schedule.filter(a => (a.recurrenceType === 1 || a.recurrenceType === 'Weekly'));
    const blockedTimes = schedule.filter(a => (a.recurrenceType === 0 || a.recurrenceType === 'OneTime') && !a.isAvailable);

    // No manual fetch needed with React Query

    // Sync form with selected day's data
    useEffect(() => {
        const dayShifts = weeklyHours.filter(h => h.dayOfWeek === selectedDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (dayShifts.length > 0) {
            setStartTime(dayShifts[0].startTime.substring(0, 5));
            setEndTime(dayShifts[dayShifts.length - 1].endTime.substring(0, 5));

            if (dayShifts.length > 1) {
                setUseBreak(true);
                setBreakStartTime(dayShifts[0].endTime.substring(0, 5));
                setBreakEndTime(dayShifts[1].startTime.substring(0, 5));
            } else {
                setUseBreak(false);
            }
        }
    }, [selectedDay, schedule]);

    const handleSetWorkingHours = async () => {
        if (useBreak) {
            if (breakStartTime <= startTime) {
                toast.error('Break start must be after shift start');
                return;
            }
            if (breakEndTime >= endTime) {
                toast.error('Break end must be before shift end');
                return;
            }
            if (breakStartTime >= breakEndTime) {
                toast.error('Invalid break duration');
                return;
            }
        }

        try {
            setIsSavingHours(true);
            const res = await doctorAvailabilityApi.setWorkingHours({
                dayOfWeek: selectedDay,
                startTime,
                endTime,
                breakStartTime: useBreak ? breakStartTime : undefined,
                breakEndTime: useBreak ? breakEndTime : undefined
            });

            if (res.success) {
                toast.success(`Schedule for ${DAYS[selectedDay].label} updated`);
                queryClient.invalidateQueries({ queryKey: queryKeys.doctor.schedule(dateRange.start, dateRange.end) });
            }
        } catch (error) {
            toast.error('Identity sync error');
        } finally {
            setIsSavingHours(false);
        }
    };

    const handleBlockTime = async () => {
        if (!blockStartDate || !blockEndDate || !blockReason) {
            toast.error('Missing absence details');
            return;
        }

        const get24HourTime = (hourStr: string, minStr: string, amPm: string) => {
            let h = parseInt(hourStr, 10);
            if (amPm === 'PM' && h < 12) h += 12;
            if (amPm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${minStr}`;
        };

        const start24 = get24HourTime(blockStartHour, blockStartMin, blockStartAmPm);
        const end24 = get24HourTime(blockEndHour, blockEndMin, blockEndAmPm);

        const blockStartCombined = `${blockStartDate}T${start24}`;
        const blockEndCombined = `${blockEndDate}T${end24}`;

        const startDt = new Date(blockStartCombined);
        const endDt = new Date(blockEndCombined);
        const now = new Date();

        if (isBefore(startDt, now)) {
            toast.error('Start datetime cannot be in the past');
            return;
        }

        if (isBefore(endDt, startDt) || endDt.getTime() === startDt.getTime()) {
            toast.error('End datetime must be after start datetime');
            return;
        }

        try {
            setIsBlocking(true);
            
            const conflictRes = await doctorAvailabilityApi.checkConflicts(
                normalizeUTC(blockStartCombined),
                normalizeUTC(blockEndCombined)
            );

            let forceCancel = false;
            if (conflictRes.success && conflictRes.data > 0) {
                const confirmed = await confirm({
                    title: 'Active Schedule Conflict',
                    message: 'You have an active schedule, and if you add the absence the appointment will be cancelled. Do you want to proceed?',
                    confirmText: 'Yes, Cancel Appointments',
                    cancelText: 'No, Keep Availability',
                    type: 'danger'
                });
                if (!confirmed) {
                    setIsBlocking(false);
                    return;
                }
                forceCancel = true;
            }

            const res = await doctorAvailabilityApi.blockTime({
                startDateTime: normalizeUTC(blockStartCombined),
                endDateTime: normalizeUTC(blockEndCombined),
                reason: blockReason,
                forceCancel
            });

            if (res.success) {
                toast.success('Absence period registered');
                setBlockStartDate(todayYmd);
                setBlockStartHour('09');
                setBlockStartMin('00');
                setBlockStartAmPm('AM');
                setBlockEndDate(todayYmd);
                setBlockEndHour('05');
                setBlockEndMin('00');
                setBlockEndAmPm('PM');
                setBlockReason('');
                queryClient.invalidateQueries({ queryKey: queryKeys.doctor.schedule(dateRange.start, dateRange.end) });
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Absence registration failed';
            toast.error(errorMsg);
        } finally {
            setIsBlocking(false);
        }
    };

    const handleUnblock = async (id: string) => {
        try {
            const res = await doctorAvailabilityApi.unblockTime(id);
            if (res.success) {
                toast.success('Schedule item removed');
                queryClient.invalidateQueries({ queryKey: queryKeys.doctor.schedule(dateRange.start, dateRange.end) });
            }
        } catch (error) {
            toast.error('Removal error');
        }
    };

    if (queryLoading || !scheduleRes) return <AvailabilitySkeleton />;

    return (
        <PageLayout className="space-y-12 relative overflow-hidden">
            {/* Background Blurs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-sky-500/[0.03] rounded-full blur-[140px] -z-10" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left: Recurring Schedule */}
                <div className="lg:col-span-8 space-y-10">
                    <SectionCard
                        icon={<Timer size={24} />}
                        title="Recurring Shifts"
                        desc="Configure your weekly clinical hours"
                        accent="emerald"
                        action={
                            <div className="px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                {new Set(weeklyHours.map(h => h.dayOfWeek)).size} Active Days
                            </div>
                        }
                    >
                        <div className="space-y-10">
                            {/* Form Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Day</label>
                                    <Select
                                        value={selectedDay.toString()}
                                        onChange={e => setSelectedDay(parseInt(e.target.value))}
                                        options={DAYS}
                                        className="rounded-xl border-slate-200 dark:border-white/10 h-11 text-xs font-black uppercase"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Shift Start</label>
                                    <Input
                                        type="time" value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-white/10 h-11 text-xs font-black"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Shift End</label>
                                    <Input
                                        type="time" value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-white/10 h-11 text-xs font-black"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleSetWorkingHours}
                                        disabled={isSavingHours}
                                        className="w-full h-11 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-500/20"
                                    >
                                        {isSavingHours ? <Loader2 size={14} className="animate-spin" /> : 'Sync Day'}
                                    </Button>
                                </div>
                            </div>

                            {/* Break Toggle Row */}
                            <div className="flex items-center justify-between p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Coffee size={18} /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Midday Break</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated schedule split</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <AnimatePresence>
                                        {useBreak && (
                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-3">
                                                <Input type="time" value={breakStartTime} onChange={e => setBreakStartTime(e.target.value)} className="w-24 h-9 text-[10px] font-black rounded-lg border-orange-500/20 bg-white" />
                                                <ArrowRight size={12} className="text-orange-300" />
                                                <Input type="time" value={breakEndTime} onChange={e => setBreakEndTime(e.target.value)} className="w-24 h-9 text-[10px] font-black rounded-lg border-orange-500/20 bg-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <button
                                        onClick={() => setUseBreak(!useBreak)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${useBreak ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useBreak ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Weekly Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DAYS.map((day) => {
                                    const dayShifts = weeklyHours.filter(h => h.dayOfWeek?.toString() === day.value)
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                                    const active = dayShifts.length > 0;

                                    return (
                                        <div key={day.value} className={`p-6 rounded-[2rem] border transition-all duration-300 relative group/day ${active ? 'bg-white dark:bg-slate-800 border-emerald-500/30 shadow-md' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{day.label}</span>
                                                </div>
                                                {active && (
                                                    <button onClick={() => Promise.all(dayShifts.map(s => handleUnblock(s.id)))} className="p-2 text-rose-500 opacity-0 group-hover/day:opacity-100 transition-opacity hover:bg-rose-50 rounded-xl">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {active ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl text-[10px] font-black font-mono">
                                                        <span className="text-slate-400">START</span>
                                                        <span className="text-slate-900 dark:text-white">{dayShifts[0].startTime.substring(0, 5)}</span>
                                                        <ArrowRight size={10} className="mx-2 text-slate-300" />
                                                        <span className="text-slate-900 dark:text-white">{dayShifts[dayShifts.length - 1].endTime.substring(0, 5)}</span>
                                                        <span className="text-slate-400 pl-2">END</span>
                                                    </div>
                                                    {dayShifts.length > 1 && (
                                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-500/5 text-[9px] font-black text-orange-600 uppercase">
                                                            <Coffee size={10} /> Break {dayShifts[0].endTime.substring(0, 5)} - {dayShifts[1].startTime.substring(0, 5)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-3 italic">Off Duty</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Right: Absence Management */}
                <div className="lg:col-span-4 space-y-10">
                    <SectionCard
                        icon={<XCircle size={24} />}
                        title="Add Absence"
                        desc="Block your clinical calendar"
                        accent="rose"
                    >
                        <div className="space-y-7">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Start DateTime</label>
                                <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center transition-all hover:border-slate-400 dark:hover:border-slate-600 focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:border-rose-500">
                                    <div className="flex-1 flex items-center min-w-0 pr-3">
                                        <DateCalendarPicker
                                            value={blockStartDate}
                                            onChange={(date) => {
                                                setBlockStartDate(date);
                                                if (blockEndDate && date && blockEndDate < date) {
                                                    setBlockEndDate(date);
                                                }
                                            }}
                                            minDate={todayYmd}
                                        />
                                    </div>
                                    <span className="text-slate-300 dark:text-slate-600 font-light px-2 shrink-0">|</span>
                                    <div className="flex items-center space-x-1.5 pl-3 shrink-0">
                                        <select 
                                            value={blockStartHour} 
                                            onChange={e => setBlockStartHour(e.target.value)} 
                                            className="bg-transparent text-slate-900 dark:text-white text-xs font-black outline-none border-none cursor-pointer appearance-none pr-1"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                                <option key={h} value={h} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-slate-400 dark:text-slate-500 font-bold">:</span>
                                        <select 
                                            value={blockStartMin} 
                                            onChange={e => setBlockStartMin(e.target.value)} 
                                            className="bg-transparent text-slate-900 dark:text-white text-xs font-black outline-none border-none cursor-pointer appearance-none pr-1"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m}</option>
                                            ))}
                                        </select>
                                        <select 
                                            value={blockStartAmPm} 
                                            onChange={e => setBlockStartAmPm(e.target.value)} 
                                            className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg outline-none border-none cursor-pointer"
                                        >
                                            <option value="AM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">AM</option>
                                            <option value="PM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">End DateTime</label>
                                <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center transition-all hover:border-slate-400 dark:hover:border-slate-600 focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:border-rose-500">
                                    <div className="flex-1 flex items-center min-w-0 pr-3">
                                        <DateCalendarPicker
                                            value={blockEndDate}
                                            onChange={setBlockEndDate}
                                            minDate={blockStartDate || todayYmd}
                                        />
                                    </div>
                                    <span className="text-slate-300 dark:text-slate-600 font-light px-2 shrink-0">|</span>
                                    <div className="flex items-center space-x-1.5 pl-3 shrink-0">
                                        <select 
                                            value={blockEndHour} 
                                            onChange={e => setBlockEndHour(e.target.value)} 
                                            className="bg-transparent text-slate-900 dark:text-white text-xs font-black outline-none border-none cursor-pointer appearance-none pr-1"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                                <option key={h} value={h} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-slate-400 dark:text-slate-500 font-bold">:</span>
                                        <select 
                                            value={blockEndMin} 
                                            onChange={e => setBlockEndMin(e.target.value)} 
                                            className="bg-transparent text-slate-900 dark:text-white text-xs font-black outline-none border-none cursor-pointer appearance-none pr-1"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m}</option>
                                            ))}
                                        </select>
                                        <select 
                                            value={blockEndAmPm} 
                                            onChange={e => setBlockEndAmPm(e.target.value)} 
                                            className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg outline-none border-none cursor-pointer"
                                        >
                                            <option value="AM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">AM</option>
                                            <option value="PM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Reason / Note</label>
                                <textarea
                                    placeholder="e.g. Vacation, Conference..."
                                    value={blockReason}
                                    onChange={e => setBlockReason(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 hover:border-slate-400 dark:hover:border-slate-600 resize-none h-20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <Button
                                onClick={handleBlockTime}
                                disabled={isBlocking}
                                className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-rose-500/20 mt-2 transition-all active:scale-95"
                            >
                                {isBlocking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Block'}
                            </Button>
                        </div>
                    </SectionCard>

                    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CalendarDays size={14} className="text-primary" /> Upcoming Blocks
                            </h3>
                            <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{blockedTimes.length}</span>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                            {blockedTimes.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Sparkles size={24} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Calendar Clear</p>
                                </div>
                            ) : (
                                blockedTimes.map(block => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={block.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 group relative overflow-hidden transition-all hover:border-rose-500/30">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{formatDate(block.specificDate || '')}</span>
                                            <button onClick={() => handleUnblock(block.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><XCircle size={12} /></button>
                                        </div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{block.reason}</p>
                                        <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-400 font-mono">
                                            <Clock size={10} /> {block.startTime.substring(0, 5)} - {block.endTime.substring(0, 5)}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="flex justify-center items-center gap-6 pt-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Vault Synchronized</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">HIPAA Compliant Schedule</span>
                </div>
            </div>
        </PageLayout>
    );
}
