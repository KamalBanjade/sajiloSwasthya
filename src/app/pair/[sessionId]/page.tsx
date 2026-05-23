'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComputerDesktopIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PairPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'confirm' | 'paired'>('loading');

  useEffect(() => {
    params.then((p) => {
      setSessionId(p.sessionId);
      setStatus('confirm');
    });
  }, [params]);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceName = 'Mobile Device';
    if (/iPhone/.test(ua)) deviceName = 'iPhone';
    else if (/iPad/.test(ua)) deviceName = 'iPad';
    else if (/Android/.test(ua)) deviceName = 'Android Device';
    
    // Create a simple fingerprint (in prod, use fingerprintjs)
    const mobileDeviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return { deviceName, mobileDeviceId };
  };

  const handlePair = async () => {
    setStatus('loading');
    try {
      const { deviceName, mobileDeviceId } = getDeviceInfo();
      const isBrowser = typeof window !== 'undefined';
      const apiHost = isBrowser ? `${window.location.hostname}:5004` : 'localhost:5004';
      const apiBase = `http://${apiHost}/api`;
      
      const res = await fetch(`${apiBase}/scanner/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Crucial: Send auth_token cookie
        body: JSON.stringify({
          desktopSessionId: sessionId,
          mobileDeviceId: mobileDeviceId,
          deviceName: deviceName
        })
      });

      if (res.ok) {
        // Save pairing
        localStorage.setItem('pairedDesktop', sessionId);
        localStorage.setItem('mobileDeviceId', mobileDeviceId);
        localStorage.setItem('pairingExpiry', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        
        setStatus('paired');
        toast.success("Successfully paired!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to pair automatically.");
        setStatus('confirm');
      }
    } catch(err) {
      toast.error("Network error trying to pair.");
      setStatus('confirm');
    }
  };

  if (status === 'paired') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Paired Successfully!</h1>
          <p className="text-slate-500 mb-8">
            Your phone is now linked to the desktop computer. You can now use your camera to scan patient QR codes.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Session</p>
            <p className="font-mono text-indigo-600">{sessionId.slice(-8)}</p>
          </div>
          <button 
            onClick={() => window.close()} // Might not work in all mobile browsers, but good UX fallback
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ComputerDesktopIcon className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link with Desktop?</h1>
        <p className="text-slate-500 mb-8">
          This allows you to scan patient QR codes with your phone and instantly open their records on your desktop.
        </p>
        
        <button 
          onClick={handlePair}
          disabled={status === 'loading'}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-4 shadow-lg shadow-indigo-600/20"
        >
          {status === 'loading' ? 'Pairing...' : '✓ Pair This Device'}
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
