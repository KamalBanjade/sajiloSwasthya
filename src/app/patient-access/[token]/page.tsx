'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaperAirplaneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PatientAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'sent-to-desktop' | 'error' | 'not-paired'>('loading');
  const [patient, setPatient] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    params.then((p) => {
        if (!active) return;
        handlePatientScan(p.token);
    });
    return () => { active = false; };
  }, [params]);

  async function handlePatientScan(token: string) {
    try {
      // 1. Check if we have a paired desktop
      const pairedDesktop = localStorage.getItem('pairedDesktop');
      const mobileDeviceId = localStorage.getItem('mobileDeviceId');
      const pairingExpiry = localStorage.getItem('pairingExpiry');

      if (!pairedDesktop || !mobileDeviceId || !pairingExpiry || Date.now() > Number(pairingExpiry)) {
        setStatus('not-paired');
        return;
      }

      // 2. We skip validation and just ping the API, the backend will validate the token
      // and immediately push the message to the Desktop via SignalR
      const isBrowser = typeof window !== 'undefined';
      const apiHost = isBrowser ? `${window.location.hostname}:5004` : 'localhost:5004';
      const apiBase = `http://${apiHost}/api`;
      
      const notifyRes = await fetch(`${apiBase}/scanner/notify-patient-scanned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          patientToken: token,
          desktopSessionId: pairedDesktop,
          mobileDeviceId: mobileDeviceId
        })
      });

      if (notifyRes.ok) {
        setStatus('sent-to-desktop');
      } else {
        const data = await notifyRes.json();
        setErrorMessage(data.message || 'Failed to send to desktop.');
        setStatus('error');
      }
    } catch(err) {
      setErrorMessage('Network connection error.');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
         <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
         <p className="font-bold text-slate-500 animate-pulse">Processing your scan...</p>
      </div>
    );
  }

  if (status === 'not-paired') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center border-t-4 border-t-amber-500">
          <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Scanner Not Paired</h1>
          <p className="text-sm text-slate-600 mb-6 font-medium">
            This phone is not currently paired with a desktop session. Please scan the pairing QR code on your desktop monitor first.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center border-t-4 border-t-rose-500">
            <ExclamationTriangleIcon className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Scan Failed</h1>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.close()}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Close Window
            </button>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl shadow-indigo-500/10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-indigo-900/40 relative">
                <PaperAirplaneIcon className="w-10 h-10 text-white -mt-1 ml-1" />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping opacity-20"></div>
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Sent to Desktop!</h1>
            
            <p className="text-sm text-slate-500 font-medium mb-8">
                Patient information has been forwarded to your paired computer. Check your monitor to verify and access records.
            </p>
            
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 mb-8">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Status</p>
                <p className="font-semibold text-slate-800">Waiting for TOTP Entry...</p>
            </div>

            <button 
                onClick={() => window.close()}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
            >
                Close Scanner
            </button>
        </div>
    </div>
  );
}
