import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Sparkles, Calendar, Star, Clock, ChevronDown, User, Stethoscope } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    patientApi, 
    DoctorBasicInfo, 
    DoctorSuggestionItem, 
    SmartDoctorSuggestionDTO, 
} from '@/lib/api';
import { medicalRecordsApi, MedicalRecordResponseDTO, UploadMedicalRecordDTO } from '@/lib/api/medicalRecords';
import { queryKeys } from '@/lib/queryKeys';
import { FormGrid } from '@/components/layout/ResponsiveGrid';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'];

export enum RecordType {
    LAB_REPORT = "Lab Report",
    PRESCRIPTION = "Prescription",
    XRAY = "X-Ray",
    CT_SCAN = "CT Scan",
    MRI = "MRI",
    IMAGING = "Imaging",
    OTHER = "Other"
}




const COMMON_TAGS = ["Blood Test", "Diabetes", "Cardiology", "Thyroid", "Pediatric", "Surgery", "Dental"];

interface RecordUploadProps {
    onUploadSuccess?: () => void;
    /** Fires immediately when the upload succeeds — use to refresh data in the background */
    onRecordUploaded?: () => void;
}

function SuggestionBadge({ type }: { type: 'Appointment' | 'Primary' | 'Recent' }) {
    const config = {
        Appointment: {
            icon: <Calendar className="w-2.5 h-2.5" />,
            label: 'Scheduled',
            className: 'bg-violet-50 text-primary border-primary dark:bg-violet-900/30 dark:text-primary dark:border-primary'
        },
        Primary: {
            icon: <Star className="w-2.5 h-2.5" />,
            label: 'Primary',
            className: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
        },
        Recent: {
            icon: <Clock className="w-2.5 h-2.5" />,
            label: 'Recent',
            className: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
        },
    }[type];

    return (
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-sm ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
}

function SuggestionChip({
    suggestion,
    isSelected,
    onClick,
}: {
    suggestion: DoctorSuggestionItem;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl border transition-all duration-500 group relative overflow-hidden
                ${isSelected
                    ? 'border-secondary/40 bg-secondary/5 dark:border-secondary/30 shadow-[0_0_20px_rgba(16,185,129,0.05)] ring-1 ring-secondary/10'
                    : 'border-slate-100 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md dark:border-slate-800/50 hover:border-secondary/30 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:shadow-xl hover:shadow-secondary/5 hover:-translate-y-0.5'
                }`}
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm transition-all duration-500
                ${isSelected ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-105' : 'bg-slate-100/80 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary'}`}>
                {suggestion.fullName.split(' ').find((w: string) => w !== 'Dr.')?.charAt(0) ?? 'D'}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-secondary transition-colors">{suggestion.fullName}</span>
                    <SuggestionBadge type={suggestion.suggestionType} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate pt-1 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    {suggestion.department} · {suggestion.suggestionLabel}
                </p>
            </div>
            {isSelected && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary animate-in zoom-in-50 duration-300">
                    <CheckCircle className="w-4 h-4" />
                </div>
            )}
        </button>
    );
}

// Manual SVG removed in favor of Lucide icons


export function RecordUpload({ onUploadSuccess, onRecordUploaded }: RecordUploadProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [recordType, setRecordType] = useState<RecordType>(RecordType.LAB_REPORT);
    const [description, setDescription] = useState('');
    const [recordDate, setRecordDate] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Smart suggestion state
    const [suggestions, setSuggestions] = useState<SmartDoctorSuggestionDTO | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    // Manual override state
    const [showManualOverride, setShowManualOverride] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // Selected doctor (the actual value sent on upload)
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedDoctorName, setSelectedDoctorName] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Post-upload primary doctor prompt
    const [primarySuggestion, setPrimarySuggestion] = useState<{
        doctorId: string;
        doctorName: string;
    } | null>(null);
    const [settingPrimary, setSettingPrimary] = useState(false);
    const [primarySetConfirmed, setPrimarySetConfirmed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load smart suggestions on mount
    useEffect(() => {
        setLoadingSuggestions(true);
        patientApi.getSmartDoctorSuggestions()
            .then(res => {
                if (res.success && res.data) {
                    setSuggestions(res.data);
                    // Auto-select recommended doctor
                    if (res.data.recommendedDoctor) {
                        setSelectedDoctorId(res.data.recommendedDoctor.id);
                        setSelectedDoctorName(res.data.recommendedDoctor.fullName);
                    }
                }
            })
            .catch(() => setSuggestions(null))
            .finally(() => setLoadingSuggestions(false));
    }, []);

    // Fetch departments for manual override
    useEffect(() => {
        if (showManualOverride && departments.length === 0) {
            patientApi.getDepartments().then(res => {
                if (res.success && res.data) setDepartments(res.data);
            });
        }
    }, [showManualOverride]);

    // Fetch doctors when department selected in override
    useEffect(() => {
        if (!selectedDepartment) { setDoctors([]); return; }
        setLoadingDoctors(true);
        patientApi.getDoctorsByDepartment(selectedDepartment)
            .then(res => { if (res.success && res.data) setDoctors(res.data); })
            .finally(() => setLoadingDoctors(false));
    }, [selectedDepartment]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
    };

    const validateAndSetFile = (selectedFile: File) => {
        setError(null);
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File size too large (max 10MB)');
            return;
        }
        if (!ALLOWED_TYPES.includes(selectedFile.type) && !selectedFile.name.endsWith('.dcm')) {
            setError('Unsupported file type');
            return;
        }

        // Clean up old preview
        if (filePreview) URL.revokeObjectURL(filePreview);

        setFile(selectedFile);

        // Generate preview for images
        if (selectedFile.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(selectedFile));
        } else {
            setFilePreview(null);
        }
    };

    const removeFile = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const resetForm = () => {
        removeFile();
        setRecordType(RecordType.LAB_REPORT);
        setDescription('');
        setRecordDate('');
        setTags([]);
        setSuccess(false);
        setError(null);
        setPrimarySuggestion(null);
    };

    // Auto-cleanup on unmount
    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview]);

    const selectSuggestion = (s: DoctorSuggestionItem) => {
        setShowManualOverride(false);
        setSelectedDoctorId(s.id);
        setSelectedDoctorName(s.fullName);
    };

    const handleManualDoctorSelect = (id: string) => {
        const doc = doctors.find(d => d.id === id);
        if (doc) {
            setSelectedDoctorId(doc.id);
            setSelectedDoctorName(`Dr. ${doc.firstName} ${doc.lastName}`);
        }
    };

    // Tag management
    const toggleTag = (tag: string) => {
        setTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a file to upload'); return; }
        if (!selectedDoctorId) { setError('Please assign a doctor for review.'); return; }

        setIsUploading(true); setError(null); setUploadProgress(10);

        try {
            const uploadData: UploadMedicalRecordDTO = {
                file,
                recordType,
                description: description.trim(),
                recordDate: recordDate || undefined,
                assignedDoctorId: selectedDoctorId || undefined,
                tags: tags.join(', ') || undefined
            };
            setUploadProgress(40);
            const result = await medicalRecordsApi.uploadRecord(uploadData);
            if (!result.success) {
                setError(result.message || 'Upload failed. Please try again.');
                setUploadProgress(0);
                return;
            }
            setUploadProgress(100);
            setSuccess(true);
            toast.success('Medical record uploaded and encrypted successfully!');
            queryClient.invalidateQueries({ queryKey: queryKeys.patient.records.all() });

            // Post-upload: suggest setting primary doctor if not already set
            const hasPrimary = suggestions?.primaryDoctor !== null;
            if (!hasPrimary && selectedDoctorId && selectedDoctorName) {
                setPrimarySuggestion({ doctorId: selectedDoctorId, doctorName: selectedDoctorName });
            } else {
                // No prompt needed — auto-dismiss after short delay
                setTimeout(() => {
                    resetForm();
                    onUploadSuccess?.();
                    onRecordUploaded?.();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload record. Please try again.');
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPrimary = async () => {
        if (!primarySuggestion) return;
        setSettingPrimary(true);
        try {
            await patientApi.setPrimaryDoctor(primarySuggestion.doctorId);
            setPrimarySetConfirmed(true);
            toast.success(`${primarySuggestion.doctorName} is now your primary doctor.`);
            // Refresh suggestions so next upload sees the primary
            setSuggestions((prev: SmartDoctorSuggestionDTO | null) => prev ? {
                ...prev, primaryDoctor: {
                    id: primarySuggestion.doctorId,
                    fullName: primarySuggestion.doctorName,
                    department: '',
                    suggestionType: 'Primary',
                    suggestionLabel: 'Your primary doctor',
                }
            } : prev);
        } catch {
            // Silent fail — not critical
        } finally {
            setSettingPrimary(false);
            setTimeout(() => {
                setSuccess(false); setPrimarySuggestion(null); setPrimarySetConfirmed(false);
                onUploadSuccess?.();
            }, 1800);
        }
    };

    const dismissPrimarySuggestion = () => {
        setPrimarySuggestion(null);
        setSuccess(false);
        onUploadSuccess?.();
    };

    // Collect all unique suggestions to display
    const allSuggestions: DoctorSuggestionItem[] = (() => {
        if (!suggestions) return [];
        const seen = new Set<string>();
        const items: DoctorSuggestionItem[] = [];
        const add = (item: DoctorSuggestionItem | null | undefined) => {
            if (item && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
        };
        add(suggestions.recommendedDoctor);
        add(suggestions.upcomingAppointmentDoctor);
        add(suggestions.primaryDoctor);
        suggestions.recentDoctors.forEach(add);
        return items;
    })();

    return (
        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl p-5 xs:p-7 sm:p-10 lg:p-14 rounded-3xl sm:rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-800/50 w-full mx-auto overflow-hidden relative group/container">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none group-hover/container:bg-secondary/20 transition-all duration-1000" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary/5 rounded-full blur-[120px] pointer-events-none group-hover/container:bg-secondary/10 transition-all duration-1000" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">

                    {/* LEFT SIDE: File Upload & Preview */}
                    <div className="lg:col-span-6 h-full flex flex-col min-h-[400px]">
                        <div className="space-y-4 h-full flex flex-col">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block px-1">
                                Document Source
                            </label>
                            <div
                                className={`flex-1 border-2 border-dashed rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 text-center transition-all duration-500 flex flex-col items-center justify-center
                                    ${file ? 'border-secondary/40 bg-secondary/5 dark:border-secondary/30 shadow-inner' : 'border-slate-200 dark:border-slate-800 hover:border-secondary/50 dark:hover:border-secondary/30 cursor-pointer bg-slate-50/10 dark:bg-slate-900/40 shadow-sm hover:shadow-2xl hover:shadow-secondary/5'}`}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => !file && fileInputRef.current?.click()}
                                role="button" tabIndex={0}
                            >
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.dcm" />

                                {!file ? (
                                    <div className="space-y-8">
                                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-secondary/10 dark:bg-primary/20 text-primary rounded-2xl sm:rounded-[2rem] shadow-lg shadow-secondary/10 flex items-center justify-center mx-auto transition-all duration-500 hover:scale-110 hover:-rotate-6 hover:bg-secondary hover:text-white">
                                            <UploadCloud className="h-8 w-8 sm:h-12 sm:w-12" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Click or drag record here</p>
                                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF, IMAGES OR DICOM (MAX 10MB)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full relative flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                                        <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center">
                                            {filePreview ? (
                                                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (file.type === 'application/pdf') ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-800/50">
                                                        <FileIcon className="w-8 h-8" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">PDF DOCUMENT</span>
                                                </div>
                                            ) : (file.name.toLowerCase().endsWith('.dcm') || file.type === 'application/dicom') ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                                                        <Sparkles className="w-8 h-8" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">DICOM IMAGE</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <FileIcon className="w-10 h-10" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">FILE READY</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
                                                <p className="text-[10px] font-bold truncate">{file.name}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                            className="mt-6 flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition-colors">
                                            <X className="h-3 w-3" />
                                            Change File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Metadata & Tags */}
                    <div className="lg:col-span-6 flex flex-col space-y-8">
                        <FormGrid columns={2}>
                            <div className="space-y-3.5">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block px-1">
                                    Record Type <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative group">
                                    <select value={recordType} onChange={(e) => setRecordType(e.target.value as RecordType)}
                                        className="w-full h-14 rounded-2xl border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-100 dark:border-slate-800/50 px-5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all appearance-none cursor-pointer relative z-10" required>
                                        {Object.values(RecordType).map(type => (
                                            <option key={type} value={type} className="bg-white dark:bg-slate-900">
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20 group-hover:text-secondary transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3.5">
                                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block px-1">
                                    Date of Issue
                                </label>
                                <div className="relative">
                                    <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
                                        className="w-full h-14 rounded-2xl border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-100 dark:border-slate-800/50 px-5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all" />
                                </div>
                            </div>
                        </FormGrid>

                        {/* Tag Selector */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block px-1">
                                Clinical Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_TAGS.map(tag => (
                                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border
                                            ${tags.includes(tag)
                                                ? 'bg-secondary/10 text-secondary border-secondary/30'
                                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-secondary/20 hover:text-secondary'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ===== DOCTOR ASSIGNMENT ===== */}
                        <div className="space-y-6 pt-2">
                            <div className="flex items-center justify-between px-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block">
                                        Assign Reviewing Doctor
                                    </label>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select an expert for clinical review</p>
                                </div>
                                {!showManualOverride && (
                                    <button type="button" onClick={() => setShowManualOverride(true)}
                                        className="text-[10px] font-black text-secondary hover:text-secondary/80 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-secondary/5 border border-secondary/10 transition-all hover:border-secondary/30">
                                        Manual Search
                                    </button>
                                )}
                            </div>

                            {!showManualOverride ? (
                                <div className="space-y-4">
                                    {loadingSuggestions ? (
                                        <div className="h-[240px] rounded-3xl border-2 border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20 backdrop-blur-sm flex flex-col items-center justify-center gap-5 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                            <div className="relative">
                                                <div className="w-14 h-14 border-2 border-secondary/10 border-t-secondary rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.2em]">Contextual Analysis</p>
                                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identifying best match for your case...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {allSuggestions.map(doc => (
                                                <SuggestionChip
                                                    key={doc.id}
                                                    suggestion={doc}
                                                    isSelected={selectedDoctorId === doc.id}
                                                    onClick={() => selectSuggestion(doc)}
                                                />
                                            ))}
                                            {(allSuggestions.length === 0) && (
                                                <div className="p-10 text-center rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic mb-4">No recent history or appointments found.</p>
                                                    <button type="button" onClick={() => setShowManualOverride(true)}
                                                        className="px-6 py-2.5 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/10 hover:bg-secondary/90 transition-all">
                                                        Explore Directory
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 p-7 rounded-[2.5rem] border-2 border-white dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-black/5 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Stethoscope className="w-32 h-32" />
                                    </div>

                                    <div className="flex items-center justify-between relative z-10">
                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            Manual Search
                                        </h4>
                                        <button type="button" onClick={() => setShowManualOverride(false)}
                                            className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer">
                                            <X className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    </div>

                                    <div className="space-y-5 relative z-10">
                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Clinical Specialization</label>
                                            <div className="relative group">
                                                <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
                                                    className="w-full h-12 rounded-2xl border bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 px-5 text-xs font-bold focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all shadow-sm appearance-none cursor-pointer relative z-10">
                                                    <option value="">Choose Department...</option>
                                                    {departments.map(dept => <option key={dept} value={dept} className="bg-white dark:bg-slate-900">{dept}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20 group-hover:text-secondary transition-colors">
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Select Practitioner</label>
                                            {loadingDoctors ? (
                                                <div className="h-12 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                                    <div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                                                    {doctors.map(doc => (
                                                        <button key={doc.id} type="button" onClick={() => handleManualDoctorSelect(doc.id)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300
                                                                ${selectedDoctorId === doc.id
                                                                    ? 'border-secondary bg-secondary/5 text-secondary shadow-lg shadow-secondary/5'
                                                                    : 'border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-secondary/30 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black
                                                                    ${selectedDoctorId === doc.id ? 'bg-secondary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                    {doc.firstName.charAt(0)}{doc.lastName.charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-black">Dr. {doc.firstName} {doc.lastName}</span>
                                                            </div>
                                                            {selectedDoctorId === doc.id && <CheckCircle className="w-4 h-4 animate-in zoom-in-50" />}
                                                        </button>
                                                    ))}
                                                    {selectedDepartment && doctors.length === 0 && (
                                                        <p className="text-[10px] text-center text-slate-400 py-6 font-bold uppercase tracking-widest">No available practitioners found in this dept.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM: Description & Submit */}
                <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-slate-800/50 relative">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block px-2">
                            Clinical Description & Notes
                        </label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add clinical notes, findings or specific concerns for the doctor..."
                            className="w-full h-40 rounded-3xl border-2 bg-white/40 dark:bg-slate-950/30 backdrop-blur-md border-slate-100 dark:border-slate-800/50 p-6 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all resize-none shadow-sm" />
                    </div>

                    {error && (
                        <div className="flex items-center space-x-3 text-red-600 bg-red-50 dark:bg-rose-900/20 dark:text-rose-400 p-5 rounded-2xl border border-red-100 dark:border-rose-900/30 animate-in shake duration-500 shadow-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm font-bold tracking-tight">{error}</span>
                        </div>
                    )}

                    {/* Progress bar */}
                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-secondary tracking-widest">
                                <span>Encrypting Data</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6">
                        <button
                            type="submit"
                            disabled={!file || !selectedDoctorId || isUploading}
                            className={`h-14 px-12 rounded-2xl text-sm font-black uppercase tracking-[0.22em]
    flex items-center gap-3 transition-all duration-300 backdrop-blur-xl border
    ${(!file || !selectedDoctorId || isUploading)
                                    ? 'bg-white/30 dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-700/40 text-slate-400 cursor-not-allowed'
                                    : 'bg-secondary/80 text-white border-secondary/40 shadow-lg shadow-secondary/20 hover:bg-secondary hover:shadow-secondary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Uploading... {uploadProgress}%
                                </>
                            ) : (
                                <>
                                    Upload Record
                                    <CheckCircle className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Post-upload Prompt Overlay */}
            {success && primarySuggestion && !primarySetConfirmed && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-emerald-200">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Upload Successful!</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 text-center max-w-sm">
                        Would you like to set <span className="text-secondary font-black">{primarySuggestion.doctorName}</span> as your Primary Doctor for future records?
                    </p>
                    <div className="flex gap-4">
                        <button onClick={handleSetPrimary} disabled={settingPrimary}
                            className="px-8 py-3 bg-secondary text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg hover:bg-secondary/90 transition-all flex items-center gap-2">
                            {settingPrimary ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                            Set as Primary
                        </button>
                        <button onClick={dismissPrimarySuggestion} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all">
                            Skip for now
                        </button>
                    </div>
                </div>
            )}

            {/* Success Overlay (Final) */}
            {success && (!primarySuggestion || primarySetConfirmed) && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-secondary text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-secondary/20 animate-in zoom-in-50 duration-500">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Success!</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Clinical record encrypted and stored securely.</p>
                    <div className="flex gap-4">
                        <button onClick={resetForm} className="px-8 py-3 bg-secondary text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg hover:bg-secondary/90 transition-all">
                            Upload Another
                        </button>
                        {onUploadSuccess && (
                            <button onClick={onUploadSuccess} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all">
                                View Records
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
