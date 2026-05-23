import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApi } from '@/lib/api';
import { doctorPatientsApi } from '@/lib/api/doctorPatients';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// Reusing same schema as RegisterForm for consistency
const createPatientSchema = z.object({
    firstName: z.string().
        min(2, 'First name is required').
        regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
    lastName: z.string().
        min(2, 'Last name is required').
        regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().
        regex(/^\+977-\d{10}$/, 'Phone number must be exactly 10 digits after +977-'),
    dateOfBirth: z.string().min(1, 'Date of birth is required').refine((val) => {
        const date = new Date(val);
        return date < new Date();
    }, 'Date of birth must be in the past'),
    gender: z.string().min(1, 'Gender is required'),
});

type CreatePatientFormData = z.infer<typeof createPatientSchema>;

interface CreatePatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    creatorRole: 'admin' | 'doctor';
}

export function CreatePatientModal({ isOpen, onClose, onSuccess, creatorRole }: CreatePatientModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, dirtyFields }
    } = useForm<CreatePatientFormData>({
        resolver: zodResolver(createPatientSchema),
        mode: 'onChange',
        defaultValues: {
            phoneNumber: '+977-'
        }
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const isFieldValid = (fieldName: keyof CreatePatientFormData) => {
        return dirtyFields[fieldName] && !errors[fieldName];
    };

    const onSubmit = async (data: CreatePatientFormData) => {
        setIsLoading(true);
        const provisionToast = toast.loading('Provisioning secure patient account...', {
            style: {
                borderRadius: '16px',
                background: '#1e293b',
                color: '#fff',
            },
        });

        try {
            const result = await (creatorRole === 'admin'
                ? adminApi.createPatient(data)
                : doctorPatientsApi.createPatient(data));

            if (result.success) {
                toast.success('Account provisioned successfully!', {
                    id: provisionToast,
                });
                onSuccess();
                handleClose();
            } else {
                toast.error(result.message || 'Failed to create patient account', {
                    id: provisionToast,
                });
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error(error?.response?.data?.message || 'Failed to onboard patient. Please check all fields.', {
                id: provisionToast,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Glassmorphism Overlay - Lighter blur as requested */}
            <div
                className="absolute inset-0 backdrop-blur-sm transition-opacity animate-in fade-in duration-500"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-xl animate-in zoom-in-95 duration-300">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-[40px] shadow-2xl border border-white/40 dark:border-slate-800/50 flex flex-col overflow-hidden max-h-[95vh]"
                >
                    {/* Header with Branding */}
                    <div className="text-center space-y-2 mb-8 relative">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute -right-2 -top-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-all active:scale-95 z-10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex flex-col items-center">
                                <div className="p-1 rounded-2xl shrink-0 mb-1">
                                    <img src="/images/logo.webp" alt="Logo" className="h-20 w-auto object-contain drop-shadow-md" />
                                </div>
                                <div className="relative w-fit mx-auto overflow-visible">
                                    <img src="/images/sajilo.webp" alt="सजिलो" className="h-14 w-auto object-contain" />
                                    <span
                                        className="absolute text-[16px] font-semibold text-secondary tracking-[0.05em] font-amita inline-block scale-x-110"
                                        style={{ bottom: '0px', right: '-30px' }}>
                                        स्वास्थ्य
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mt-2">Onboard Patient</h2>
                                <p className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em] opacity-80 mt-1">Clinical Directory Provisioning</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="First Name"
                                placeholder="John"
                                required
                                {...register('firstName')}
                                error={errors.firstName?.message}
                                success={isFieldValid('firstName')}
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />

                            <Input
                                label="Last Name"
                                placeholder="Doe"
                                required
                                {...register('lastName')}
                                error={errors.lastName?.message}
                                success={isFieldValid('lastName')}
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />
                        </div>

                        {/* Contact Row - Rebalanced */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="john@example.com"
                                required
                                {...register('email')}
                                error={errors.email?.message}
                                success={isFieldValid('email')}
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />

                            <Input
                                label="Phone Number"
                                placeholder="+977-98XXXXXXXX"
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
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />
                        </div>

                        {/* Demographic Row - Rebalanced */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select
                                label="Gender"
                                required
                                options={[
                                    { value: '', label: 'Select' },
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Other', label: 'Other' }
                                ]}
                                {...register('gender')}
                                error={errors.gender?.message}
                                success={isFieldValid('gender')}
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />

                            <Input
                                label="Date of Birth"
                                type="date"
                                required
                                {...register('dateOfBirth')}
                                error={errors.dateOfBirth?.message}
                                success={isFieldValid('dateOfBirth')}
                                max={new Date().toISOString().split('T')[0]}
                                className="h-12 rounded-2xl !bg-slate-50/50 dark:!bg-slate-950/40"
                            />
                        </div>

                        <div className="p-5 bg-secondary/5 dark:bg-secondary/10 rounded-3xl border border-secondary/10 dark:border-secondary/20 mt-2">
                            <div className="text-[11px] text-secondary dark:text-secondary-light font-bold leading-relaxed flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
                                <p className="uppercase tracking-wider">A temporary password and secure invitation will be dispatched via SMTP upon creation.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full h-14 rounded-2xl text-md font-black shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.98] transition-all bg-secondary text-white uppercase tracking-[0.2em]"
                            isLoading={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Create Patient'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

