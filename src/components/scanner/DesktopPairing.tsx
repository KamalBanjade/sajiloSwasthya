'use client';

import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { QRCodeSVG } from 'qrcode.react';
import { DevicePhoneMobileIcon, CheckCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export function DesktopPairing() {
  const { user, hasChecked, isAuthenticated } = useAuthStore();
  const [sessionId, setSessionId] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [networkFrontendUrl, setNetworkFrontendUrl] = useState<string | null>(null);
  const connectionStartedRef = React.useRef(false);

  // Custom logger to silence the harmless "stopped during negotiation" errors in dev
  const quietLogger = {
    log: (level: signalR.LogLevel, message: string) => {
      if (message.includes("stopped during negotiation") || message.includes("AbortError")) return;
      if (level >= signalR.LogLevel.Information) console.log(`[SignalR] ${message}`);
    }
  };

  useEffect(() => {
    // Only run for doctors after initial session check
    if (!hasChecked) return;
    if (!isAuthenticated || !user || user.role !== 'Doctor') return;

    if (connectionStartedRef.current) return;
    connectionStartedRef.current = true;

    const newSessionId = `desktop-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    setSessionId(newSessionId);

    const isBrowser = typeof window !== 'undefined';
    // WebSockets proxying through Next.js dev server rewrites is highly unreliable.
    // Connect DIRECTLY to the ASP.NET backend on port 5004 to avoid routing/CORS/negotiation issues.
    const baseUrl = isBrowser ?
    `http://${window.location.hostname}:5004` :
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api').replace(/\/api$/, '');

    const hubConnection = new signalR.HubConnectionBuilder().
    withUrl(`${baseUrl}/hubs/scanner`, {
      withCredentials: true
    }).
    configureLogging(quietLogger).
    withAutomaticReconnect().
    build();

    const handleDesktopRegistered = (data: any) => {
      setSessionId(data.sessionId);
    };
    hubConnection.on('DesktopRegistered', handleDesktopRegistered);
    hubConnection.on('desktopregistered', handleDesktopRegistered);

    const handleMobilePaired = (data: any) => {
      setIsPaired(true);
      setDeviceName(data.deviceName || 'Mobile Device');
      toast.success(`Scanner paired: ${data.deviceName || 'Mobile Device'}`);
    };
    hubConnection.on('MobilePaired', handleMobilePaired);
    hubConnection.on('mobilepaired', handleMobilePaired);

    // Dummy listener to silence "No client method" warning when global scan occurs
    hubConnection.on('PatientScanned', () => {});
    hubConnection.on('patientscanned', () => {});

    let isMounted = true;

    const startConnection = async () => {
      try {
        if (hubConnection.state === signalR.HubConnectionState.Disconnected) {
          await hubConnection.start();
          if (isMounted && user) {
            await hubConnection.invoke('RegisterDesktop', newSessionId, user.id);
          }
        }
      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError' &&
        !err.message?.includes('stopped during negotiation') &&
        !err.message?.includes('handshake could complete')) {
          console.error("SignalR Connection Error:", err);
        }
      }
    };

    startConnection();

    // Fetch official network URL to ensure QR code is reachable from mobile
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch('/api/system/info');
        const data = await response.json();
        if (data.success && isMounted) {
          setNetworkFrontendUrl(data.data.frontendUrl);
        }
      } catch (e) {
        if (isMounted) console.error("Failed to fetch system info", e);
      }
    };
    fetchSystemInfo();

    return () => {
      isMounted = false;
      connectionStartedRef.current = false;

      // Only stop if the connection is active or connecting
      if (hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        hubConnection.stop().catch(() => {});
      }
    };
  }, [user]);

  // Don't show for non-doctors
  if (!user || user.role !== 'Doctor') return null;

  // Determine the best origin for the QR code
  // 1. If we're already on a network IP (not localhost), use the current browser origin.
  // 2. If we're on localhost, use the network-detected URL from the backend so mobile can connect.
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const finalOrigin = isLocalhost ? networkFrontendUrl || currentOrigin : currentOrigin;

  const pairingUrl = sessionId ? `${finalOrigin}/pair/${sessionId}` : '';

  return (
    <div className="h-full relative overflow-hidden group">
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          {!isPaired ?
          <div className="flex flex-col items-center justify-center py-2">
              {pairingUrl ?
            <>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 inline-block">
                    <QRCodeSVG
                  value={pairingUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/images/logo.webp",
                    x: undefined,
                    y: undefined,
                    height: 35,
                    width: 35,
                    excavate: true
                  }} />
                
                  </div>
                  <p className="text-xs text-center text-slate-500 font-bold px-4 leading-relaxed uppercase tracking-tight">
                    Scan with camera to pair mobile scanner.
                  </p>
                  <div className="mt-4 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/10 rounded-lg border border-slate-100 dark:border-slate-800/30">
                    <p className="text-[10px] font-mono text-slate-400">ID: {sessionId.slice(-8)}</p>
                  </div>
                </> :

            <div className="py-8 flex flex-col items-center opacity-40">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Initializing...</p>
                </div>
            }
            </div> :

          <div className="py-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <DevicePhoneMobileIcon className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Scanner Paired</h4>
              <p className="text-sm text-slate-500 mt-1">Linked to: <span className="font-semibold text-slate-700 dark:text-slate-300">{deviceName}</span></p>
              <p className="text-xs mt-6 text-slate-400 font-bold px-4 leading-relaxed uppercase tracking-tight">
                Use your device to scan patient codes.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}