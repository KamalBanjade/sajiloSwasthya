import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
    UserIcon,
    IdentificationIcon,
    BuildingOffice2Icon,
    XMarkIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { departmentApi, Department as DeptEntity } from '@/lib/api/department';

const inviteDoctorSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(2, 'First name is required').regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
    lastName: z.string().min(2, 'Last name is required').regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
    nmcLicense: z.string().regex(/^NMC-\d+$/, 'NMC License must start with NMC- followed by digits'),
    department: z.string().min(2, 'Department is required'),
    specialization: z.string().min(2, 'Specialization is required'),
    phoneNumber: z.string().regex(/^\+977-\d{10}$/, 'Phone number must be exactly 10 digits after +977-'),
    qualificationDetails: z.string().optional(),
});

type InviteDoctorFormData = z.infer<typeof inviteDoctorSchema>;

interface InviteDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const STEPS = [
    { id: 1, label: 'Personal Info', icon: UserIcon },
    { id: 2, label: 'Credentials', icon: IdentificationIcon },
    { id: 3, label: 'Department', icon: BuildingOffice2Icon },
];

export const InviteDoctorModal: React.FC<InviteDoctorModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { inviteDoctor } = useAuthStore();
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState<DeptEntity[]>([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: InviteDoctorFormData) => {
            const loadingToast = toast.loading('Preparing invitation and generating RSA keys...', {
                style: {
                    borderRadius: '16px',
                    background: '#1e293b',
                    color: '#fff',
                },
            });
            try {
                const result = await inviteDoctor(data);
                toast.success('Doctor invitation sent successfully!', {
                    id: loadingToast,
                });
                return result;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to send invitation.', {
                    id: loadingToast,
                });
                throw error;
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['admin', 'statistics'] });
            const previousStats = queryClient.getQueryData(['admin', 'statistics']);
            queryClient.setQueryData(['admin', 'statistics'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    totalDoctors: (old.totalDoctors || 0) + 1,
                    totalUsers: (old.totalUsers || 0) + 1,
                };
            });
            return { previousStats };
        },
        onError: (err, newDoctor, context: any) => {
            if (context?.previousStats) {
                queryClient.setQueryData(['admin', 'statistics'], context.previousStats);
            }
        },
        onSuccess: () => {
            onSuccess?.();
            handleClose();
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            setIsFetchingDepts(true);
            const res = await departmentApi.getAll();
            if (res.success) {
                setDepartments(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setIsFetchingDepts(false);
        }
    };

    const {
        register,
        handleSubmit,
        trigger,
        reset,
        setValue,
        formState: { errors, dirtyFields },
    } = useForm<InviteDoctorFormData>({
        resolver: zodResolver(inviteDoctorSchema),
        mode: 'onChange',
        defaultValues: {
            phoneNumber: '+977-',
            nmcLicense: 'NMC-'
        }
    });

    const isFieldValid = (fieldName: keyof InviteDoctorFormData) => {
        return dirtyFields[fieldName] && !errors[fieldName];
    };

    if (!isOpen) return null;

    const handleClose = () => {
        reset();
        setStep(1);
        onClose();
    };

    const goToNext = async () => {
        const fieldsToValidate: (keyof InviteDoctorFormData)[][] = [
            ['email', 'firstName', 'lastName'],
            ['nmcLicense', 'phoneNumber'],
            ['department', 'specialization'],
        ];
        const valid = await trigger(fieldsToValidate[step - 1]);
        if (valid) setStep((s) => s + 1);
    };

    const onSubmit = async (data: InviteDoctorFormData) => {
        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">

                {/* Decorative Blurs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

                <div className="relative z-10 w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-8 pt-10 pb-8 relative overflow-hidden">
                        <button
                            onClick={handleClose}
                            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-20 backdrop-blur-md border border-white/10"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>

                        <div className="relative z-10">
                            <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Clinical Access</span>
                            <h2 className="text-3xl font-black text-white mt-4 tracking-tighter uppercase italic">Onboard Doctor</h2>
                            <p className="text-slate-400 text-sm mt-1 font-medium">Provision system credentials & secure keys</p>

                            {/* Step Progress */}
                            <div className="flex items-center mt-8 gap-3">
                                {STEPS.map((s, i) => {
                                    const Icon = s.icon;
                                    const isActive = step === s.id;
                                    const isDone = step > s.id;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => step > s.id && setStep(s.id)}>
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isDone ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                                    isActive ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' :
                                                        'bg-white/5 border-white/10'
                                                    }`}>
                                                    {isDone
                                                        ? <CheckCircleIcon className="w-5 h-5 text-white" />
                                                        : <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-white/20'}`} />
                                                    }
                                                </div>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className={`flex-1 h-0.5 rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="px-8 py-8 space-y-5 min-h-[320px] bg-white dark:bg-slate-900 relative z-10">
                            {step === 1 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    <Input
                                        label="Digital Identity (Email)"
                                        type="email"
                                        placeholder="doctor.name@hospital.com"
                                        required
                                        {...register('email')}
                                        error={errors.email?.message}
                                        success={isFieldValid('email')}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-indigo-500/20"
                                    />
                                    <Input
                                        label="First Name"
                                        placeholder="Legal First Name"
                                        required
                                        {...register('firstName')}
                                        error={errors.firstName?.message}
                                        success={isFieldValid('firstName')}
                                        className="h-12 rounded-2xl border-slate-200"
                                    />
                                    <Input
                                        label="Last Name"
                                        placeholder="Surname"
                                        required
                                        {...register('lastName')}
                                        error={errors.lastName?.message}
                                        success={isFieldValid('lastName')}
                                        className="h-12 rounded-2xl border-slate-200"
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    <Input
                                        label="Clinical License (NMC)"
                                        placeholder="NMC-XXXXX"
                                        required
                                        {...register('nmcLicense', {
                                            onChange: (e) => {
                                                const value = e.target.value;
                                                if (!value.startsWith('NMC-')) {
                                                    setValue('nmcLicense', 'NMC-', { shouldDirty: true, shouldValidate: true });
                                                    return;
                                                }
                                                const suffix = value.slice(4).replace(/\D/g, '');
                                                setValue('nmcLicense', 'NMC-' + suffix, { shouldDirty: true, shouldValidate: true });
                                            }
                                        })}
                                        error={errors.nmcLicense?.message}
                                        success={isFieldValid('nmcLicense')}
                                        className="h-12 rounded-2xl"
                                    />
                                    <Input
                                        label="Verified Phone"
                                        type="tel"
                                        placeholder="+977-98XXXXXXXX"
                                        required
                                        maxLength={15}
                                        {...register('phoneNumber', {
                                            onChange: (e) => {
                                                const value = e.target.value;
                                                if (!value.startsWith('+977-')) {
                                                    setValue('phoneNumber', '+977-', { shouldDirty: true, shouldValidate: true });
                                                    return;
                                                }
                                                const suffix = value.slice(5).replace(/\D/g, '').slice(0, 10);
                                                setValue('phoneNumber', '+977-' + suffix, { shouldDirty: true, shouldValidate: true });
                                            }
                                        })}
                                        error={errors.phoneNumber?.message}
                                        success={isFieldValid('phoneNumber')}
                                        className="h-12 rounded-2xl"
                                    />
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Professional Qualifications</label>
                                        <textarea
                                            rows={2}
                                            placeholder="e.g. MBBS, MD (Cardiology) — IOM, TUTH"
                                            className="w-full px-5 py-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none transition-all font-medium"
                                            {...register('qualificationDetails')}
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Clinical Department
                                            <span className="text-rose-500 ml-1 font-black">*</span>
                                        </label>
                                        <div className="relative group">
                                            <select
                                                {...register('department')}
                                                className={`w-full px-5 py-4 rounded-2xl border appearance-none transition-all font-bold text-sm bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer ${errors.department ? 'border-rose-500 text-rose-600' : 'border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                                                disabled={isFetchingDepts}
                                            >
                                                <option value="">Select Department</option>
                                                {departments.filter(d => d.isActive).map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <IdentificationIcon className="w-5 h-5 opacity-20" />
                                            </div>
                                        </div>
                                        {errors.department && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">{errors.department.message as string}</p>}
                                    </div>
                                    <Input
                                        label="Specialization Field"
                                        placeholder="e.g. Pediatric Neurosurgeon"
                                        required
                                        {...register('specialization')}
                                        error={errors.specialization?.message}
                                        success={isFieldValid('specialization')}
                                        className="h-12 rounded-2xl"
                                    />
                                    <div className="p-5 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <IdentificationIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold leading-relaxed">
                                            Automatic RSA Key Generation and invitation SMTP protocol will be triggered upon submission.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 pb-10 flex items-center gap-4 bg-white dark:bg-slate-900 relative z-10">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep((s) => s - 1)}
                                    className="h-14 px-8 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={goToNext}
                                    className="flex-1 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-2xl hover:bg-indigo-950 dark:hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Next Step
                                    <CheckCircleIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <Button
                                    type="submit"
                                    className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
                                    isLoading={mutation.isPending}
                                >
                                    Send Invitation
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
