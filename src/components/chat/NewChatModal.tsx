'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Stethoscope, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { doctorApi } from '@/lib/api';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientApi, DoctorBasicInfo } from '@/lib/api/patient';
import { adminApi } from '@/lib/api';
import { Conversation } from '@/lib/api/chatApi';
import Image from 'next/image';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: Partial<Conversation>) => void;
  role: 'Doctor' | 'Patient';
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectContact, 
  role 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Queries for Doctors
  const { data: myPatients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['my-patients', searchTerm],
    queryFn: () => doctorApi.getMyPatients(1, searchTerm),
    enabled: isOpen && role === 'Doctor',
  });

  // Queries for Patients
  const { data: suggestionsRaw } = useQuery({
    queryKey: ['chat-doctor-suggestions'],
    queryFn: () => appointmentsApi.getSmartSuggestions(),
    enabled: isOpen && role === 'Patient' && !selectedDepartment,
  });
  const suggestions = (suggestionsRaw as any)?.data || suggestionsRaw;

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => adminApi.getDepartments(),
    enabled: isOpen && role === 'Patient' && !selectedDepartment,
  });

  const { data: deptDoctorsResponse, isLoading: loadingDeptDoctors } = useQuery({
    queryKey: ['doctors-by-dept', selectedDepartment],
    queryFn: () => patientApi.getDoctorsByDepartment(selectedDepartment!),
    enabled: !!selectedDepartment,
  });

  const deptDoctors = deptDoctorsResponse?.data || [];

  // Reset state and handle Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    } else {
      setSearchTerm('');
      setSelectedDepartment(null);
      window.removeEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handlePatientSelect = (patient: any) => {
    onSelectContact({
      otherUserId: patient.userId || patient.id,
      otherUserName: `${patient.firstName} ${patient.lastName}`,
      otherUserRole: 'Patient',
      otherUserProfilePictureUrl: patient.profilePictureUrl,
      lastMessageText: '',
      unreadCount: 0,
      isOnline: false,
    });
    onClose();
  };

  const handleDoctorSelect = (doctor: any) => {
    onSelectContact({
      otherUserId: doctor.userId || doctor.id,
      otherUserName: doctor.fullName || `Dr. ${doctor.firstName} ${doctor.lastName}`,
      otherUserRole: 'Doctor',
      otherUserProfilePictureUrl: doctor.profilePictureUrl,
      lastMessageText: '',
      unreadCount: 0,
      isOnline: false,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Local Backdrop (optional, but keep it clean) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-[100]"
          />

          {/* Slide-over Modal (Local to Sidebar) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white dark:bg-slate-900 shadow-xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                {selectedDepartment ? (
                  <button 
                    onClick={() => setSelectedDepartment(null)}
                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                ) : (
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {selectedDepartment ? selectedDepartment : 'New Chat'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {role === 'Doctor' ? 'Select a Patient' : 'Select a Specialist'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              
              {role === 'Doctor' ? (
                /* DOCTOR VIEW: Patient Search */
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500 font-medium"
                    />
                  </div>

                  {loadingPatients ? (
                    <div className="space-y-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl animate-pulse">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/60 rounded-[1.25rem] shrink-0" />
                          <div className="flex-1 space-y-2.5">
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-full w-32" />
                            <div className="h-2 bg-slate-50 dark:bg-slate-800/40 rounded-full w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : myPatients.length > 0 ? (
                    <div className="space-y-1">
                      {myPatients.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => handlePatientSelect(p)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        >
                          <div className="relative w-12 h-12 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-600 font-black text-lg overflow-hidden shrink-0 border border-emerald-500/20">
                            {p.profilePictureUrl ? (
                              <Image src={p.profilePictureUrl} alt="" fill className="object-cover" />
                            ) : p.firstName[0]}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{p.firstName} {p.lastName}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{p.email}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-40">
                      <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">No Patients Found</p>
                    </div>
                  )}
                </div>
              ) : (
                /* PATIENT VIEW */
                <div className="space-y-8">
                  {!selectedDepartment ? (
                    <>
                      {/* Primary & Recent Doctors */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recommended</h3>
                        
                        {/* Primary Doctor */}
                        {suggestions?.primaryDoctor && (
                          <button
                            onClick={() => handleDoctorSelect(suggestions.primaryDoctor)}
                            className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                            <div className="relative w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg shadow-emerald-500/20 overflow-hidden">
                              {suggestions.primaryDoctor.profilePictureUrl ? (
                                <Image src={suggestions.primaryDoctor.profilePictureUrl} alt="" fill className="object-cover" />
                              ) : suggestions.primaryDoctor.fullName.split(' ').pop()?.[0]}
                            </div>
                            <div className="flex-1 text-left relative z-10">
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Primary Specialist</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{suggestions.primaryDoctor.fullName}</p>
                            </div>
                          </button>
                        )}

                        {/* Recent Doctors */}
                        {suggestions?.recentDoctors
                          ?.filter((d: any) => d.id !== suggestions.primaryDoctor?.id)
                          .map((d: any) => (
                          <button
                            key={d.id}
                            onClick={() => handleDoctorSelect(d)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                          >
                            <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-slate-600 font-black text-lg overflow-hidden shrink-0">
                              {d.profilePictureUrl ? (
                                <Image src={d.profilePictureUrl} alt="" fill className="object-cover" />
                              ) : d.fullName.split(' ').pop()?.[0]}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{d.fullName}</p>
                              <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{d.department}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Browse by Department */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Browse Departments</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {departments.map((dept: any) => (
                            <button
                              key={dept.id || dept}
                              onClick={() => setSelectedDepartment(dept.name || dept)}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
                            >
                              <Stethoscope className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors mb-2" />
                              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{dept.name || dept}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* DOCTOR SELECTION IN DEPT */
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      {loadingDeptDoctors ? (
                        <div className="space-y-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl animate-pulse">
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/60 rounded-[1.25rem] shrink-0" />
                              <div className="flex-1 space-y-2.5">
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-full w-32" />
                                <div className="h-2 bg-slate-50 dark:bg-slate-800/40 rounded-full w-24" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : deptDoctors.length > 0 ? (
                        <div className="space-y-1">
                          {deptDoctors.map((d: any) => (
                            <button
                              key={d.id}
                              onClick={() => handleDoctorSelect(d)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                            >
                              <div className="relative w-12 h-12 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-600 font-black text-lg overflow-hidden shrink-0 border border-emerald-500/20">
                                {d.profilePictureUrl ? (
                                  <Image src={d.profilePictureUrl} alt="" fill className="object-cover" />
                                ) : d.firstName[0]}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">Dr. {d.firstName} {d.lastName}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{d.specialization || selectedDepartment}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 text-center opacity-40">
                          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">No Doctors in {selectedDepartment}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
