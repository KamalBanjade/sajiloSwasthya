'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';

export const TrustedDevicesList = () => {
    const { getUserDevices, revokeDevice } = useAuthStore();
    const [devices, setDevices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revokingToken, setRevokingToken] = useState<string | null>(null);
    const { confirm } = useConfirm();

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        setIsLoading(true);
        try {
            const data = await getUserDevices();
            setDevices(data);
        } catch (error) {
            toast.error('Failed to load trusted devices.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (deviceToken: string) => {
        const confirmed = await confirm({
            title: 'Revoke Device',
            message: 'Are you sure you want to revoke access for this device? It will require TOTP on its next login.',
            confirmText: 'Revoke',
            type: 'danger'
        });
        if (!confirmed) return;

        setRevokingToken(deviceToken);
        try {
            await revokeDevice(deviceToken);
            toast.success('Device revoked successfully.');
            setDevices(devices.filter(d => d.deviceToken !== deviceToken));
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke device.');
        } finally {
            setRevokingToken(null);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-slate-500 dark:text-slate-400 animate-pulse">Loading devices...</div>;
    }

    if (devices.length === 0) {
        return (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Trusted Devices</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You haven't trusted any devices yet. Check "Remember me" during login to add a device.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {devices.map((device) => (
                <div key={device.deviceToken} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${device.isCurrent ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-sm'}`}>
                    <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${device.isCurrent ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {device.deviceName.toLowerCase().includes('mobile') || device.deviceName.toLowerCase().includes('ios') || device.deviceName.toLowerCase().includes('android') ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{device.deviceName}</h4>
                                {device.isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold tracking-wider uppercase">Current</span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                                <p>IP: {device.ipAddress !== 'N/A' ? device.ipAddress : 'Unknown'}</p>
                                <p>Added: {new Date(device.createdAt).toLocaleDateString()}</p>
                                <p className="text-secondary/80 dark:text-secondary-light font-medium">Expires: {new Date(device.expiresAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={() => handleRevoke(device.deviceToken)}
                        isLoading={revokingToken === device.deviceToken}
                        disabled={revokingToken !== null}
                    >
                        Revoke
                    </Button>
                </div>
            ))}
        </div>
    );
};
