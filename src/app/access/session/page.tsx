'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  LogOut,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  SearchX,
  FolderOpen,
  Info,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Calendar } from
'lucide-react';
import { accessApi, SessionRecordDTO, SessionStatusDTO } from '@/lib/api/access';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function SessionRecordViewerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await accessApi.getSessionRecords();
      if (res.success && res.data) {
        setStatus(res.data);
        if (res.data.remainingMinutes) {
          setTimeLeft(Math.floor(res.data.remainingMinutes * 60));
        }
      } else {
        toast.error("Session expired or invalid");
        router.push('/');
      }
    } catch (error) {
      toast.error("Failed to load records");
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 10000); // 10s intervals to reduce render load

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await accessApi.logoutSession();
      toast.success("Session ended successfully");
      router.push('/');
    } catch (error) {
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDownload = async (recordId: string, fileName: string) => {
    try {
      toast.loading(`Decrypting ${fileName}...`, { id: 'download' });
      await accessApi.downloadSessionRecord(recordId);
      toast.success("Download complete", { id: 'download' });
    } catch (error) {
      toast.error("Failed to download record", { id: 'download' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m left`;
  };

  const records = status?.records || [];
  const filteredRecords = records.filter((r) =>
  r.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  r.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
  r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-medical-gradient">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] animate-pulse">
                    Decrypting Security Archive...
                </p>
            </div>);

  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
            {/* 1. Header with Patient Name & Countdown */}
            <header className="bg-white border-b border-slate-100 h-24 px-8 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Accessing Records for</p>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{status?.patientName}</h1>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-100 hidden md:block" />

                    <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 bg-amber-50 rounded-full border border-amber-100/50">
                        <Clock className={`w-4 h-4 ${timeLeft && timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-amber-600'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${timeLeft && timeLeft < 300 ? 'text-rose-600' : 'text-amber-700'}`}>
                            {timeLeft !== null ? `SESSION EXPIRES: ${formatTime(timeLeft)}` : 'SESSION ACTIVE'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
            variant="outline"
            className="text-rose-600 border-rose-100 hover:bg-rose-50 font-black text-xs uppercase tracking-widest rounded-2xl h-12 px-6 shadow-sm"
            onClick={handleLogout}
            isLoading={isLoggingOut}>
            
                        <LogOut className="w-4 h-4 mr-2" />
                        END SESSION
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 space-y-10">
                {/* Search & Accessibility Header */}
                <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                    <div className="w-full md:max-w-xl space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Medical Archive Search</label>
                            <span className="text-[10px] font-bold text-slate-300">SECURE FILTERING ENABLED</span>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                type="text"
                placeholder="Search by document name, type, or clinical diagnosis..."
                className="w-full h-16 bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 text-lg font-bold placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
              
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-8 py-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
                                {records.length}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TOTAL RECORDS</p>
                                <p className="text-sm font-black text-slate-800 mt-1">Found in Vault</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Records Display List */}
                <AnimatePresence mode="wait">
                    {filteredRecords.length === 0 ?
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 rounded-[4rem] border-2 border-dashed border-slate-200">
            
                            <div className="w-24 h-24 bg-slate-100 text-slate-300 rounded-[3rem] flex items-center justify-center">
                                <SearchX className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">No matching medical records</h3>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2 text-lg">
                                    Your search criteria didn't match any documents in this patient's vault.
                                </p>
                            </div>
                        </motion.div> :

          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
                            {filteredRecords.map((record, index) =>
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] hover:shadow-2xl transition-all group flex flex-col">
              
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-16 h-16 rounded-[1.5rem] shadow-inner border border-black/5 flex items-center justify-center
                                            ${record.mimeType.includes('pdf') ? 'bg-rose-50 text-rose-600' :
                record.mimeType.includes('image') ? 'bg-blue-50 text-blue-600' :
                'bg-primary/5 text-primary'}`}>
                  
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">RECORD CATEGORY</span>
                                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[11px] font-black text-slate-700 uppercase tracking-widest border border-slate-200/50">
                                                {record.recordType}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2" title={record.originalFileName}>
                                                {record.originalFileName}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">{format(new Date(record.uploadedAt), 'MMM dd, yyyy')}</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <FolderOpen className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">{record.fileSizeFormatted}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {record.description &&
                <div className="p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100/50 relative overflow-hidden group/note">
                                                <div className="flex items-center gap-2 mb-2 opacity-50">
                                                    <Info className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Clinical Context</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-4">
                                                    {record.description}
                                                </p>
                                            </div>
                }
                                    </div>

                                    <div className="pt-8 mt-auto flex gap-3">
                                        <Button
                  variant="primary"
                  className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all"
                  onClick={() => handleDownload(record.id, record.originalFileName)}>
                  
                                            <Download className="w-4 h-4 mr-2" />
                                            DOWNLOAD
                                        </Button>
                                    </div>
                                </motion.div>
            )}
                        </motion.div>
          }
                </AnimatePresence>

                {/* Secure Session Footer */}
                <div className="p-10 mt-20 bg-slate-900 rounded-[4rem] shadow-2xl shadow-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 text-white/5 rotate-12">
                        <Lock className="w-48 h-48" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-emerald-400">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Secure Protocol</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">End-to-End Encrypted Session</h3>
                            <p className="text-white/60 font-bold max-w-lg leading-relaxed text-sm">
                                All medical documents are decrypted on-the-fly using temporal session keys.
                                Downloads are logged for patient security and no data persists in your browser after the session ends.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-3 opacity-30 pb-4 md:pb-0">
                            <img src="/images/logo.webp" alt="Logo" className="h-10 grayscale invert" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">SAJILO SECURE STACK V1.0</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>);

}