'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';
import { useSearchParams, useRouter } from 'next/navigation';

const passwordSchema = z.object({
  currentPassword: z.string().optional(), // Optional if using token
  newPassword: z.string().
  min(8, 'Password must be at least 8 characters').
  regex(/[A-Z]/, 'Must contain at least one uppercase letter').
  regex(/[a-z]/, 'Must contain at least one lowercase letter').
  regex(/[0-9]/, 'Must contain at least one number').
  regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function ResetPasswordContent() {
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const userId = searchParams.get('userId');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      // If URL has token and userId, IT IS ALWAYS a token-based reset from email
      if (token && userId) {
        await axiosInstance.post('/auth/reset-password', {
          userId: userId,
          token: token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        });
        toast.success('Password has been reset successfully. Please login.');
        setTimeout(() => {
          // Force complete logout purely to clear any stale auth state
          logout();
          router.push('/login');
        }, 2000);
      } else if (user) {
        // Otherwise if we have a user in store (in-app change password), it's a forced change
        await axiosInstance.post('/auth/change-password', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        });
        toast.success('Password updated successfully! Please login with your new password.');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Failed to update password. Please check your inputs or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[500px] bg-white p-10 rounded-[40px] shadow-xl border border-slate-50 space-y-10 transition-all duration-500">
            <div className="text-center space-y-4 mb-10">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-b from-secondary/10 to-white/0 rounded-[24px] relative group transition-all duration-500 hover:scale-105">
                        <img
              src="/images/logo.webp"
              alt="सजिलो स्वास्थ्य"
              className="h-20 w-auto object-contain drop-shadow-sm" />
            
                    </div>
                </div>
                <div className="flex flex-col items-center -mt-4">
                    <div className="relative w-fit mx-auto overflow-visible">
                        <img
              src="/images/sajilo.webp"
              alt="सजिलो"
              className="h-20 w-36 object-contain translate-x-[-32px]" />
            
                        <span
              className="absolute text-[18px] font-semibold text-secondary tracking-[0.05em] font-amita inline-block scale-x-110"
              style={{ bottom: '8px', right: '2px' }}>
              
                            स्वास्थ्य
                        </span>
                    </div>
                    <p className="text-slate-400 font-bold text-[12px] uppercase tracking-[0.25em] opacity-80 -mt-2">
                        {user ?
            `Hi ${user.firstName}, Security Update` :
            'Choose a new secure password'}
                    </p>
                </div>

            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Only show Current Password if there is NO token/userId in the URL */}
                {user && (!token || !userId) &&
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          required
          {...register('currentPassword')}
          error={errors.currentPassword?.message} />

        }

                <div className="space-y-4">
                    <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            required
            {...register('newPassword')}
            error={errors.newPassword?.message} />
          
                    <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            required
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message} />
          
                </div>

                <div className="pt-4">
                    <Button type="submit" variant="secondary" className="w-full h-14 text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all" isLoading={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>

            </form>
        </div>);

}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    }>
            <ResetPasswordContent />
        </Suspense>);

}