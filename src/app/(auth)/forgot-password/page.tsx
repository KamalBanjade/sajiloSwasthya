'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields }
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange'
  });

  const isFieldValid = (fieldName: keyof ForgotPasswordData) => {
    return dirtyFields[fieldName] && !errors[fieldName];
  };

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    const forgotToast = toast.loading('Searching for your account...', {
      style: {
        borderRadius: '16px',
        background: '#1e293b',
        color: '#fff',
      },
    });

    try {
      await axiosInstance.post('/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
      toast.success('Reset link sent! Please check your inbox.', {
        id: forgotToast,
        duration: 5000,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link. Please try again.', {
        id: forgotToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[500px] bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10 transition-all duration-500">
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
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-[12px] uppercase tracking-[0.25em] opacity-80 mt-2">
                        {isSuccess ?
            "Reset link sent successfully" :
            "Recover your account access"}
                    </p>
                </div>

            </div>

            {!isSuccess ?
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
          label="Email Address"
          type="email"
          placeholder="your.email@example.com"
          required
          {...register('email')}
          error={errors.email?.message}
          success={isFieldValid('email')} />
        
                    <Button type="submit" variant="secondary" className="w-full h-14 text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all" isLoading={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Link'}
                    </Button>
                </form> :

      <div className="bg-secondary/5 border border-secondary/10 text-secondary p-6 rounded-2xl text-center font-bold text-sm leading-relaxed">
                    Please check your inbox (and spam folder) for the password reset link.
                </div>
      }
        </div>);

}