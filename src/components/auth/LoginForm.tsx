'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
  rememberDevice: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

interface LoginFormProps {
  role?: 'doctor' | 'admin';
}

export const LoginForm = ({ role }: LoginFormProps = {}) => {
  const isRoleSpecific = role === 'doctor' || role === 'admin';
  const { login, loginWithTwoFactor, requiresTwoFactor, isLoading, error, rememberedEmail } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const isFieldValid = (fieldName: keyof LoginFormData) => {
    const { dirtyFields, errors } = loginForm.formState;
    return dirtyFields[fieldName] && !errors[fieldName];
  };

  // Load remembered email on mount
  useEffect(() => {
    if (rememberedEmail) {
      loginForm.setValue('email', rememberedEmail);
    }
  }, [loginForm, rememberedEmail]);

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      rememberDevice: false
    }
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      // Save or clear remembered email
      if (data.rememberMe) {
        useAuthStore.setState({ rememberedEmail: data.email });
      } else {
        useAuthStore.setState({ rememberedEmail: null });
      }
      await login(data);
      if (!requiresTwoFactor) {
        toast.success('Welcome back! Login successful.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const onTwoFactorSubmit = async (data: TwoFactorFormData) => {
    try {
      const credentials = loginForm.getValues();
      await loginWithTwoFactor({
        email: credentials.email,
        password: credentials.password,
        twoFactorCode: data.code,
        rememberDevice: data.rememberDevice
      });
      toast.success('Two-factor verification successful!');
    } catch (err) {
      toast.error('Invalid two-factor code.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await axiosInstance.get('auth/google/url');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      toast.error('Failed to initiate Google Login.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto bg-white dark:bg-slate-900 px-10 py-8 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col justify-center transition-all duration-500">
      <div className="text-center space-y-4 mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-b from-secondary/10 to-white/0 dark:from-secondary/20 dark:to-transparent rounded-[24px] relative group transition-all duration-500 hover:scale-105">
            <img
              src="/images/logo.webp"
              alt="सजिलो स्वास्थ्य"
              className="h-20 w-auto object-contain drop-shadow-sm dark:brightness-110" />

          </div>
        </div>
        <div className="flex flex-col items-center -mt-6">
          <div className="relative w-fit mx-auto overflow-visible leading-none">
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
          <p className="text-slate-400 dark:text-slate-500 font-bold text-[12px] uppercase tracking-[0.25em] opacity-80 mt-2">Login Portal</p>
        </div>
      </div>

      {!requiresTwoFactor ? (
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
          <Input
            label="Email / Phone"
            type="text"
            placeholder="Enter your email or phone"
            autoComplete="username"
            required
            className="h-14 py-4"
            {...loginForm.register('email')}
            error={loginForm.formState.errors.email?.message}
            success={isFieldValid('email')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-14 py-4"
              {...loginForm.register('password')}
              error={loginForm.formState.errors.password?.message}
              success={isFieldValid('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                {...loginForm.register('rememberMe')}
                defaultChecked={!!rememberedEmail}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary transition-all cursor-pointer bg-white dark:bg-slate-800"
              />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Remember me</span>
            </label>
            <a href="/forgot-password" title="Forgot password" className="text-sm font-semibold text-primary dark:text-primary-light hover:text-primary/80 dark:hover:text-primary-light/80 transition-colors underline underline-offset-4">
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
              {error}
            </div>
          )}

          <Button type="submit" variant="secondary" className="w-full h-14 text-lg font-bold shadow-lg shadow-secondary/20 hover:bg-[#00826C] hover:shadow-secondary/30 active:scale-95 transition-all cursor-pointer" isLoading={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {!isRoleSpecific && (
            <>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm font-medium uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-sm font-bold flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                onClick={handleGoogleLogin}
                isLoading={isGoogleLoading}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 drop-shadow-sm" />
                Continue with Google
              </Button>
            </>
          )}
        </form>
      ) : (
        <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-4 rounded-xl space-y-1">
            <h4 className="text-sm font-bold text-primary dark:text-primary-light">Two-Factor Authentication</h4>
            <p className="text-xs text-primary/70 dark:text-primary-light/70">Enter the 6-digit code from your authenticator app to continue.</p>
          </div>

          <Input
            label="Verification Code"
            placeholder="000000"
            maxLength={6}
            autoFocus
            required
            {...twoFactorForm.register('code')}
            error={twoFactorForm.formState.errors.code?.message}
          />

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                {...twoFactorForm.register('rememberDevice')}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary transition-all pointer-events-auto bg-white dark:bg-slate-800"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                Remember this device for 30 days
              </span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 ml-6 italic">Don't check this on shared or public computers</p>
          </div>

          <Button type="submit" variant="secondary" className="w-full h-14 text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all" isLoading={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </Button>

          <button
            type="button"
            className="w-full text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            onClick={() => useAuthStore.setState({ requiresTwoFactor: false })}
          >
            ← Back to Password
          </button>
        </form>
      )}

      {!isRoleSpecific && (
        <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest">
            New to Sajilo Swasthya?{' '}
            <a href="/register" className="text-primary dark:text-primary-light hover:text-secondary dark:hover:text-secondary-light transition-all underline underline-offset-4">
              Create Account
            </a>
          </p>
        </div>
      )}
    </div>
  );
};