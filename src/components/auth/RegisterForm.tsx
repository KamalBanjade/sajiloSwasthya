'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import {
  UserIcon,
  LockClosedIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ArrowPathIcon
} from
  '@heroicons/react/24/outline';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().
    min(8, 'Password must be at least 8 characters').
    regex(/[A-Z]/, 'Must contain at least one uppercase letter').
    regex(/[a-z]/, 'Must contain at least one lowercase letter').
    regex(/[0-9]/, 'Must contain at least one number').
    regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().
    min(2, 'First name is required').
    regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
  lastName: z.string().
    min(2, 'Last name is required').
    regex(/^[A-Za-z\s]+$/, 'Numbers are not allowed in names'),
  phoneNumber: z.string().
    regex(/^\+977-\d{10}$/, 'Phone number must be exactly 10 digits after +977-'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine((val) => {
    const date = new Date(val);
    return date < new Date();
  }, 'Date of birth must be in the past'),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { register: registerUser, resendVerificationEmail, isLoading } = useAuthStore();

  const STEPS = [
    { id: 1, label: 'Personal', icon: UserIcon },
    { id: 2, label: 'Security', icon: LockClosedIcon },
    { id: 3, label: 'Details', icon: InformationCircleIcon }];


  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, dirtyFields }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      phoneNumber: '+977-'
    }
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  // Simple password strength calculation
  React.useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  React.useEffect(() => {
    if (confirmPassword) {
      trigger('confirmPassword');
    }
  }, [password, confirmPassword, trigger]);
  const isFieldValid = (fieldName: keyof RegisterFormData) => {
    return dirtyFields[fieldName] && !errors[fieldName];
  };

  const nextStep = async () => {
    const fields: (keyof RegisterFormData)[][] = [
      ['firstName', 'lastName', 'email'],
      ['password', 'confirmPassword'],
      ['dateOfBirth', 'gender', 'address', 'phoneNumber']];


    const isStepValid = await trigger(fields[step - 1]);
    if (isStepValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: RegisterFormData) => {
    const registrationToast = toast.loading('Creating your secure account...', {
      style: {
        borderRadius: '16px',
        background: '#1e293b',
        color: '#fff',
      },
    });

    try {
      const response = await registerUser(data);
      const registrationData = response.data;

      // Update toast to success immediately
      toast.success('Registration successful! Welcome aboard.', {
        id: registrationToast,
        duration: 5000,
      });

      if (registrationData?.requiresSetup) {
        sessionStorage.setItem('registrationSetupData', JSON.stringify({
          totpQRData: registrationData.totpSetupQRData,
          totpSecretManual: registrationData.totpSecretManual,
          medicalAccessURL: registrationData.medicalAccessURL,
          medicalAccessToken: registrationData.medicalAccessToken,
          expiresAt: registrationData.medicalAccessExpiresAt
        }));
      }
      
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage, {
        id: registrationToast,
      });
    }
  };

  const handleResendEmail = async () => {
    if (!submittedEmail) return;
    setIsResending(true);
    const resendToast = toast.loading('Resending verification email...', {
      style: {
        borderRadius: '16px',
        background: '#1e293b',
        color: '#fff',
      },
    });

    try {
      await resendVerificationEmail(submittedEmail);
      toast.success('Verification email resent!', {
        id: resendToast,
        duration: 5000,
      });
    } catch (err) {
      toast.error('Failed to resend email. Please try again.', {
        id: resendToast,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-[500px] mx-auto bg-white dark:bg-slate-900 p-12 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-secondary/10 dark:bg-secondary/20 rounded-[32px] flex items-center justify-center mb-8 relative group">
          <div className="absolute inset-0 bg-secondary/20 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <EnvelopeIcon className="w-12 h-12 text-secondary dark:text-secondary-light relative z-10 animate-bounce" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <CheckCircleIcon className="w-6 h-6 text-secondary dark:text-secondary-light" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-secondary dark:text-secondary-light mb-4 tracking-tight">Verify Your Email</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[320px]">
          We've sent a verification link to:<br />
          <span className="font-bold text-slate-900 dark:text-white break-all">{submittedEmail}</span>
        </p>

        <div className="w-full space-y-4">
          <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100/50 dark:border-slate-700 mb-6">
            <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:border-primary dark:hover:border-primary-light hover:text-primary dark:hover:text-primary-light active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none">

            <ArrowPathIcon className={`w-5 h-5 ${isResending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isResending ? 'Resending...' : 'Resend Verification Email'}</span>
          </button>

          <a
            href="/login"
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">

            <span>Continue to Login</span>
            <ChevronRightIcon className="w-5 h-5" />
          </a>
        </div>

        <p className="mt-10 text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
          Sajilo Swasthya &copy; 2024
        </p>
      </div>);

  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[500px] mx-auto bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col transition-all duration-500">
      <div className="text-center space-y-4 mb-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-b from-secondary/10 to-white/0 dark:from-secondary/20 dark:to-transparent rounded-[24px] relative group transition-all duration-500 hover:scale-105">
            <img
              src="/images/logo.webp"
              alt="सजिलो स्वास्थ्य"
              className="h-20 w-auto object-contain drop-shadow-sm dark:brightness-110" />

          </div>
        </div>
        <div className="flex flex-col items-center -mt-4">
          <div className="relative w-fit mx-auto overflow-visible">
            <img
              src="/images/sajilo.webp"
              alt="सजिलो"
              className="h-20 w-36 object-contain translate-x-[-32px] dark:brightness-110" />

            <span
              className="absolute text-[18px] font-semibold text-secondary dark:text-secondary-light tracking-[0.05em] font-amita inline-block scale-x-110"
              style={{ bottom: '8px', right: '2px' }}>

              स्वास्थ्य
            </span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-[12px] uppercase tracking-[0.25em] opacity-80 mt-2">Patient Registration</p>
        </div>

      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between px-2 mb-10">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2 relative">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-secondary text-white' :
                  isActive ? 'bg-secondary dark:bg-secondary text-white shadow-lg shadow-secondary/20 scale-110' :
                    'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`
                }>
                  {isDone ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-secondary dark:text-secondary-light' : 'text-slate-300 dark:text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 &&
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${isDone ? 'bg-secondary' : 'bg-slate-100 dark:bg-slate-800'}`} />
              }
            </React.Fragment>);

        })}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Step 1: Personal Info */}
          {step === 1 &&
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  required
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  success={isFieldValid('firstName')} />

                <Input
                  label="Last Name"
                  placeholder="Doe"
                  required
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  success={isFieldValid('lastName')} />

              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                required
                {...register('email')}
                error={errors.email?.message}
                success={isFieldValid('email')} />

            </div>
          }

          {/* Step 2: Security */}
          {step === 2 &&
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    {...register('password')}
                    error={errors.password?.message}
                    success={isFieldValid('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[38px] text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                    success={isFieldValid('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[38px] text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light transition-colors cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

              </div>

              {password &&
                <div className="space-y-2 px-1 pt-2">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 dark:text-slate-500">Security Strength</span>
                    <span className={
                      passwordStrength <= 25 ? 'text-rose-500' :
                        passwordStrength <= 50 ? 'text-amber-500' :
                          passwordStrength <= 75 ? 'text-primary dark:text-primary-light' : 'text-secondary dark:text-secondary-light'
                    }>
                      {passwordStrength <= 25 ? 'Weak' :
                        passwordStrength <= 50 ? 'Fair' :
                          passwordStrength <= 75 ? 'Good' : 'Very Strong'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${passwordStrength <= 25 ? 'bg-rose-500' :
                        passwordStrength <= 50 ? 'bg-amber-500' :
                          passwordStrength <= 75 ? 'bg-primary' : 'bg-secondary'}`
                      }
                      style={{ width: `${passwordStrength}%` }} />

                  </div>
                </div>
              }
            </div>
          }

          {/* Step 3: Additional Details */}
          {step === 3 &&
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                  success={isFieldValid('dateOfBirth')} />

                <Select
                  label="Gender"
                  required
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }]
                  }
                  {...register('gender')}
                  error={errors.gender?.message}
                  success={isFieldValid('gender')} />

              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Physical Address"
                  placeholder="Kathmandu, Nepal"
                  {...register('address')}
                  error={errors.address?.message}
                  success={isFieldValid('address')} />

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
                      const suffix = value.slice(5).replace(/\D/g, '');
                      setValue('phoneNumber', '+977-' + suffix, { shouldDirty: true, shouldValidate: true });
                    }
                  })}
                  error={errors.phoneNumber?.message}
                  success={isFieldValid('phoneNumber')} />

              </div>
            </div>
          }
        </div>

        <div className="flex flex-col gap-3 pt-8">
          {step < 3 ?
            <button
              type="button"
              onClick={nextStep}
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">

              <span>Continue</span>
              <ChevronRightIcon className="w-5 h-5" />
            </button> :

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-14 text-lg font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all relative z-10"
              isLoading={isLoading}
              disabled={isLoading}>

              {isLoading ? 'Processing...' : 'Complete Registration'}
            </Button>
          }

          {step > 1 &&
            <button
              type="button"
              onClick={prevStep}
              className="w-full h-12 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-all flex items-center justify-center gap-2">

              <ChevronLeftIcon className="w-4 h-4" />
              <span className="text-sm">Back to previous step</span>
            </button>
          }
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          Already registered?{' '}
          <a href="/login" className="text-primary dark:text-primary-light hover:text-secondary dark:hover:text-secondary-light transition-all underline underline-offset-4">
            Sign In instead
          </a>
        </p>
      </div>
    </form>);

};