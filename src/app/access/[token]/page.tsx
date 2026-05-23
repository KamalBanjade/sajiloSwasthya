'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  Key,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Info,
  Plus } from
'lucide-react';
import { accessApi, AccessInfoDTO } from '@/lib/api/access';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AccessVerificationPage() {
  const { token } = useParams();
  const router = useRouter();
  const [info, setInfo] = useState<AccessInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await accessApi.getAccessInfo(token as string);
        if (res.success) {
          setInfo(res.data);
        } else {
          setError("Invalid or expired access token.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to connect to security gateway.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [token]);

  const [sessionData, setSessionData] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit TOTP code");
      return;
    }

    try {
      setVerifying(true);
      const res = await accessApi.verifyAccess(token as string, totpCode);
      if (res.success && res.data) {
        toast.success("Access granted!");
        setSessionData(res.data);

        // If not a doctor, just go to records
        if (res.data.scannerRole !== 'doctor') {
          router.push('/access/session');
        }
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-medical-gradient">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                    <RefreshCw className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <p className="mt-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] animate-pulse">
                    Authenticating Security Token...
                </p>
            </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner border border-rose-100">
                    <XCircle className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Security Access Denied</h1>
                <p className="text-slate-500 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">
                    The requested access token is no longer valid or has been revoked by the patient.
                </p>
                <div className="flex flex-col items-center gap-2 opacity-30">
                    <img src="/images/logo.webp" alt="Logo" className="h-10 grayscale" />
                    <p className="text-[10px] font-black uppercase tracking-tighter">SECURE MEDICAL PROTOCOL V1.0</p>
                </div>
            </div>);

  }

  if (!info) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-medical-gradient relative overflow-hidden">
            <div className="absolute inset-0 bg-medical-pattern pointer-events-none opacity-10" />

            <AnimatePresence mode="wait">
                {!sessionData ?
        <motion.div
          key="verify-form"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-xl bg-white rounded-[4rem] shadow-2xl shadow-primary/10 border border-white p-12 md:p-16 relative z-10">
          
                <div className="text-center space-y-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-primary/5 rounded-[3rem] flex items-center justify-center text-primary relative group">
                            <div className="absolute inset-0 bg-primary/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ShieldCheck className="w-12 h-12 relative z-10" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-2 rounded-full mb-4 inline-block">
                                Authorised Access Required
                            </p>
                            <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                                Access Medical Records for<br />
                                <span className="text-primary">{info.patientName}</span>
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Authenticator TOTP (6-Digits)</label>
                                <Lock className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="relative">
                                <Key className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                                <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-center text-[42px] font-black tracking-[0.6em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all pl-12 shadow-inner"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))} />
                  
                            </div>
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
                                <p className="text-sm font-bold text-slate-500 leading-relaxed text-left">
                                    Please enter the 6-digit code from the patient's Sajilo Swasthya app or Google Authenticator.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-20 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all tracking-widest"
                  isLoading={verifying}
                  disabled={totpCode.length !== 6 || verifying}>
                  
                                <Fingerprint className="w-6 h-6 mr-3" />
                                VERIFY AND ACCESS
                            </Button>

                            <p className="text-center text-sm font-bold text-slate-400">
                                Don't have access? <a href="#" className="underline text-slate-600 hover:text-primary transition-colors">Contact the patient</a>
                            </p>
                        </div>
                    </form>

                    </div>
                </motion.div> :

        <motion.div
          key="doctor-options"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl shadow-primary/10 border border-white p-12 md:p-16 relative z-10">
          
                        <div className="text-center space-y-12">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center text-emerald-500 shadow-inner">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                                        Verification Successful<br />
                                        <span className="text-primary">{sessionData.patientName}</span>
                                    </h2>
                                    <p className="mt-4 text-slate-500 font-bold">What would you like to do next?</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                                <button
                onClick={() => router.push('/access/session')}
                className="group flex flex-col items-center justify-center p-10 rounded-[3rem] border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all duration-300 gap-6">
                
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-slate-900 mb-2">View Records</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                            Read-only access to<br />patient history
                                        </p>
                                    </div>
                                </button>

                                <button
                onClick={() => router.push(`/doctor/records/new?patientId=${sessionData.patientId}&fromQR=true`)}
                className="group flex flex-col items-center justify-center p-10 rounded-[3rem] border-2 border-primary/20 bg-primary/5 border-dashed hover:border-primary hover:bg-primary/10 transition-all duration-300 gap-6">
                
                                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-primary group-hover:scale-110 shadow-lg shadow-primary/10 transition-all">
                                        <Plus size={40} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-primary mb-2">New Record</h3>
                                        <p className="text-xs font-bold text-primary/60 uppercase tracking-widest leading-relaxed">
                                            Start structured<br />clinical entry
                                        </p>
                                    </div>
                                </button>
                            </div>

                            <div className="pt-10 border-t border-slate-50 opacity-40">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Secure Medical Session Active
                                </p>
                            </div>
                        </div>
                    </motion.div>
        }
            </AnimatePresence>
        </div>);

}