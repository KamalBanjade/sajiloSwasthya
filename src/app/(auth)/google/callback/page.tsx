'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/utils/axios';
import toast from 'react-hot-toast';

function SuspendedGoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleExternalLogin = useAuthStore((state) => state.handleExternalLogin);
  const isProcessing = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent React double-firing in strict mode
      if (isProcessing.current) return;
      isProcessing.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        toast.error('Invalid Google callback parameters.');
        router.push('/login');
        return;
      }

      try {
        const response = await axiosInstance.get(`auth/google/callback?code=${code}&state=${state}`);
        const data = response.data?.data;

        if (data) {
          // Pass the data to zustand to hydrate state
          handleExternalLogin(data);
          toast.success('Google login successful!');

          // Redirect to setup or dashboard based on role
          if (data.requiresSetup || data.RequiresSetup) {
            router.push('/complete-setup');
          } else {
            const role = data.role || data.Role;
            if (role?.toLowerCase() === 'admin') {
              router.push('/admin/dashboard');
            } else if (role?.toLowerCase() === 'doctor') {
              router.push('/doctor/dashboard');
            } else {
              router.push('/dashboard');
            }
          }
        } else {
          throw new Error('No user data returned');
        }
      } catch (error: any) {
        console.error('Google callback error:', error);
        toast.error(error.response?.data?.message || 'Failed to complete Google login.');
        router.push('/login');
      }
    };

    processCallback();
  }, [searchParams, router, handleExternalLogin]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
          Completing Google Login...
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please wait while we verify your account.
        </p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <SuspendedGoogleCallback />
    </Suspense>
  );
}
