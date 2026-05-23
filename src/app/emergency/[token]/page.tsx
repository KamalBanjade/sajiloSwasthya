'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Heart,
  ShieldAlert,
  Phone,
  User,
  Info,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
  XCircle,
  Printer,
  Pill,
  ClipboardList,
  Stethoscope,
  Calendar,
  Users } from
'lucide-react';
import { accessApi, EmergencyAccessDTO } from '@/lib/api/access';
import { motion } from 'framer-motion';
import { format, differenceInYears, isValid } from 'date-fns';
import { Button } from '@/components/ui/Button';

const safeFormat = (dateValue: string | Date | null | undefined, formatStr: string, fallback: string = 'Unknown') => {
  if (!dateValue) return fallback;
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (!isValid(date) || date.getFullYear() <= 1) return fallback;
  return format(date, formatStr);
};

export default function EmergencyPublicPage() {
  const { token } = useParams();
  const [data, setData] = useState<EmergencyAccessDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmergencyData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await accessApi.getEmergencyAccess(token as string);
        if (res.success) {
          setData(res.data);
        } else {
          setError("This emergency link is invalid or has expired.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to retrieve emergency protocol.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyData();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 bg-medical-gradient">
                <RefreshCw className="w-12 h-12 text-rose-600 animate-spin" />
                <p className="mt-4 text-rose-800 font-black uppercase tracking-widest text-sm">
                    Retrieving Life-Line...
                </p>
            </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <XCircle className="w-20 h-20 text-rose-500 mb-6" />
                <h1 className="text-2xl font-black text-slate-900 mb-2">Access Revoked or Invalid</h1>
                <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">
                    This emergency QR code is no longer active.
                </p>
            </div>);

  }

  if (!data) return null;

  const birthDate = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  const isBirthDateValid = birthDate && isValid(birthDate) && birthDate.getFullYear() > 1;
  const age = isBirthDateValid ? differenceInYears(new Date(), birthDate!) : '??';

  return (
    <div className="min-h-screen bg-[#FDF2F2] flex flex-col print:bg-white pb-20 font-sans">
            {/* 1. Emergency Banner */}
            <div className="bg-rose-600 text-white py-8 px-6 shadow-2xl sticky top-0 z-50 print:relative print:shadow-none print:py-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-xl sm:text-[32px] font-black tracking-tighter uppercase leading-tight">
                        🚨 <span className="hidden xs:inline">Emergency Medical Protocol</span> <span className="xs:hidden">Emergency Medical</span> 🚨
                    </h1>
                </div>
            </div>

            <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-6">
                {/* 2. Patient Information */}
                <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 shadow-xl border border-rose-100 print:shadow-none print:border-slate-200">
          
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 text-center md:text-left">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Patient Identity</p>
                            <h2 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                                {data.patientName}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 pt-2">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar className="w-4 h-4 text-rose-400" />
                                    <span className="text-sm font-bold">{safeFormat(data.dateOfBirth, 'MMMM dd, yyyy')} ({age} yrs)</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <User className="w-4 h-4 text-rose-400" />
                                    <span className="text-sm font-bold">{data.gender}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-center md:items-end gap-1 shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">VERIFIED DATA</p>
                            <div className="px-4 py-2 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-2 mt-2">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                <span className="text-[10px] font-black text-rose-700 uppercase">{safeFormat(data.lastUpdated, 'MMM dd, HH:mm', 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Critical Medical Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Blood Type */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-rose-100 flex flex-col items-center justify-center text-center space-y-2 print:shadow-none print:border-slate-200">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                            <Activity className="w-5 h-5" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">BLOOD TYPE</p>
                        </div>
                        <span className="text-[48px] font-black text-rose-600 leading-none">
                            {data.bloodType}
                        </span>
                    </div>

                    {/* Card 2: Allergies */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-rose-100 space-y-3 print:shadow-none print:border-slate-200">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">ALLERGIES</p>
                        </div>
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                            <p className="text-base font-black text-rose-700 leading-relaxed italic">
                                {data.allergies || 'No known allergies'}
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Current Medications */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-rose-100 space-y-3 md:col-span-2 print:shadow-none print:border-slate-200">
                        <div className="flex items-center gap-2">
                            <Pill className="w-5 h-5 text-rose-600" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">CURRENT MEDICATIONS</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                {data.currentMedications || 'None listed'}
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Chronic Conditions */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-rose-100 space-y-3 md:col-span-2 print:shadow-none print:border-slate-200">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-rose-600" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">CHRONIC CONDITIONS</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                {data.chronicConditions || 'None listed'}
                            </p>
                        </div>
                    </div>

                    {/* Card 5: Emergency Contact */}
                    <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-rose-200 space-y-6 md:col-span-2 print:bg-white print:text-slate-900 print:shadow-none print:border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl print:bg-slate-100 print:text-slate-600">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest">Emergency Contact</h3>
                            </div>
                            <span className="text-xs font-bold text-rose-200 print:text-slate-400 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">{data.emergencyContact?.relationship || 'Contact'}</span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h4 className="text-3xl font-black tracking-tight">{data.emergencyContact?.name || 'Emergency Contact'}</h4>
                                <p className="text-xl font-bold opacity-80 mt-1">{data.emergencyContact?.phone || 'No phone listed'}</p>
                            </div>
                            <Button
                variant="secondary"
                className="h-16 px-8 rounded-2xl bg-white text-rose-600 font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto print:hidden"
                onClick={() => data.emergencyContact?.phone && (window.location.href = `tel:${data.emergencyContact.phone}`)}
                disabled={!data.emergencyContact?.phone}>
                
                                <Phone className="w-5 h-5 mr-3" />
                                CALL NOW
                            </Button>
                        </div>
                    </div>

                    {/* Card 6: Notes to Responders */}
                    {data.notesToResponders &&
          <div className="bg-amber-50 rounded-[2rem] p-8 border-2 border-amber-100 space-y-4 md:col-span-2 print:bg-white print:border-slate-200">
                            <div className="flex items-center gap-3 text-amber-700">
                                <ClipboardList className="w-6 h-6" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">NOTES TO RESPONDERS</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-amber-100/50">
                                <p className="text-base font-bold text-amber-900 leading-relaxed italic">
                                    "{data.notesToResponders}"
                                </p>
                            </div>
                        </div>
          }
                </div>

                {/* 4. Disclaimers */}
                <div className="space-y-4 pt-10 px-4 print:pt-6">
                    <div className="flex items-start gap-3 opacity-60">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-1" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            {data.warning}
                        </p>
                    </div>
                    <div className="flex items-start gap-3 opacity-60">
                        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            Last updated: {safeFormat(data.lastUpdated, 'PPpp')} - Information is provided by the patient and may be outdated. For full clinical validation, use standard access.
                        </p>
                    </div>
                </div>

                {/* 5. Actions */}
                <div className="flex flex-col md:flex-row gap-4 pt-8 print:hidden">
                    <Button
            variant="outline"
            className="flex-1 h-16 border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50"
            onClick={handlePrint}>
            
                        <Printer className="w-5 h-5 mr-3" />
                        PRINT THIS INFORMATION
                    </Button>
                    <Button
            variant="danger"
            className="flex-1 h-16 bg-rose-600 rounded-2xl font-black text-white shadow-lg shadow-rose-200"
            onClick={() => data.emergencyContact?.phone && (window.location.href = `tel:${data.emergencyContact.phone}`)}
            disabled={!data.emergencyContact?.phone}>
            
                        <Phone className="w-5 h-5 mr-3" />
                        CONTACT EMERGENCY
                    </Button>
                </div>

                <div className="pt-12 text-center opacity-20 flex flex-col items-center gap-2">
                    <img src="/images/logo.webp" alt="Sajilo" className="h-8 grayscale" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">SECURE MEDICAL PROTOCOL V1.0</p>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                    main { max-width: 100% !important; padding: 0 !important; }
                    .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\] { border-radius: 8pt !important; }
                }
            `}</style>
        </div>);

}