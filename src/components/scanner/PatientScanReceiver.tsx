'use client';

import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { ShieldCheckIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function PatientScanReceiver() {
  const router = useRouter();
  const { user, hasChecked, isAuthenticated } = useAuthStore();
  const [patient, setPatient] = useState<any>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [desktopSessionId, setDesktopSessionId] = useState<string | null>(null);
  const connectionStartedRef = React.useRef(false);

  const quietLogger = {
    log: (level: signalR.LogLevel, message: string) => {
      if (message.includes("stopped during negotiation") || message.includes("AbortError")) return;
      if (level >= signalR.LogLevel.Information) console.log(`[SignalR Global] ${message}`);
    }
  };

  useEffect(() => {
    // Only run for logged-in doctors after the initial session check.
    // This prevents 401 errors during negotiation when the browser has a 
    // persisted user in localStorage but the backend session (cookie) is gone.
    if (!hasChecked) return;
    if (!isAuthenticated || !user || user.role !== 'Doctor') return;

    if (connectionStartedRef.current) return;
    connectionStartedRef.current = true;

    const isBrowser = typeof window !== 'undefined';
    // WebSockets proxying through Next.js dev server rewrites is highly unreliable.
    // Instead of using a relative path ('/hubs/scanner'), we detect the current hostname 
    // and connect DIRECTLY to the ASP.NET backend on port 5004. CORS is already enabled.
    const socketBase = isBrowser
      ? `http://${window.location.hostname}:5004`
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api').replace(/\/api$/, '');

    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${socketBase}/hubs/scanner`, {
        withCredentials: true,
      })
      .configureLogging(quietLogger)
      .withAutomaticReconnect()
      .build();

    const handleDesktopRegistered = (data: any) => {
      setDesktopSessionId(data.sessionId);
    };
    hubConnection.on('DesktopRegistered', handleDesktopRegistered);
    hubConnection.on('desktopregistered', handleDesktopRegistered);

    const handlePatientScanned = (data: any) => {
      setPatient(data.patient);
      if (!data.requiresTOTP) {
        if (data.isEmergency) {
          toast.error("EMERGENCY SCAN DETECTED: Opening critical records immediately.", { duration: 2000, icon: '🚨' });
        } else {
          toast.success("Patient Scanned!");
        }
        router.push(`/doctor/patients/${data.patient.id}`);
        setPatient(null);
      } else {
        toast('New Patient Scanned. Verification Required.', { icon: '🔔' });
      }
    };
    hubConnection.on('PatientScanned', handlePatientScanned);
    hubConnection.on('patientscanned', handlePatientScanned);

    // Dummy listeners to silence warnings
    hubConnection.on('MobilePaired', () => { });
    hubConnection.on('mobilepaired', () => { });

    let isMounted = true;

    const startConnection = async () => {
      try {
        if (hubConnection.state === signalR.HubConnectionState.Disconnected) {
          await hubConnection.start();
        }
      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError' && 
            !err.message?.includes('stopped during negotiation') &&
            !err.message?.includes('handshake could complete')) {
          console.error("SignalR Global Connection Error", err);
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      connectionStartedRef.current = false;
      if (hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        hubConnection.stop().catch(() => {});
      }
    };
  }, [user, router]);

  const handleVerify = async () => {
    if (totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const isBrowser = typeof window !== 'undefined';
      const apiBase = isBrowser
        ? '/api'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api');

      const res = await fetch(`${apiBase}/scanner/verify-totp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send HTTP-only cookie
        body: JSON.stringify({
          patientId: patient.id,
          totpCode: totpCode,
          desktopSessionId: desktopSessionId || ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Verification successful!");
        setPatient(null);
        setTotpCode('');
        router.push(`/doctor/patients/${patient.id}`);
      } else {
        toast.error(data.message || "Invalid TOTP code");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6" />
              Patient Scanned
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Verification Required</p>
          </div>
          <button onClick={() => setPatient(null)} className="text-white/60 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
              <p className="text-sm text-slate-500">
                Age: {patient.age} | {patient.gender}
                {patient.mrNumber && ` | MR#: ${patient.mrNumber}`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 text-center">
              Ask patient for 6-digit code from their authenticator app:
            </label>
            <input
              autoFocus
              type="text"
              maxLength={6}
              placeholder="••••••"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setPatient(null)}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={isVerifying || totpCode.length !== 6}
              className="flex-[2] py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Access Records'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
