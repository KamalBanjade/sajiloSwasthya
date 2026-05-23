'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MedicalLoader } from '@/components/ui/MedicalLoader';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, hasChecked, checkAuth, getDashboardUrl } = useAuthStore();

  useEffect(() => {
    if (!hasChecked && !isAuthenticated) {
      checkAuth();
      return;
    }

    if (isLoading && !isAuthenticated) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      router.replace(getDashboardUrl(user));
    }
  }, [isAuthenticated, user, isLoading, hasChecked, checkAuth, router, getDashboardUrl]);

  // If we're already authenticated from persistence, we'll redirect in useEffect,
  // but we can also avoid showing the loader here.
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl z-[9999]">
      <MedicalLoader />
    </div>
  );
}
