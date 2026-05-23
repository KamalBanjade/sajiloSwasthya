'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    BellIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon,
    CalendarIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { notificationConnectionManager } from '@/lib/signalr/notificationConnection';
import axiosInstance from '@/lib/utils/axios';
import { StabilityAlertDto } from '@/types/analysis';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';

interface UnifiedNotification {
    id: string;
    title: string;
    message: string;
    type: string; // 'StabilityAlert', 'AppointmentCreated', 'AppointmentCancelled', 'AppointmentRescheduled', 'AppointmentConfirmed'
    createdAt: string;
    isRead: boolean;
    referenceId?: string;
}

export const NotificationBell = () => {
    const [alerts, setAlerts] = useState<UnifiedNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Load persisted notifications (all roles: patient, doctor, admin)
                const notifsRes = await axiosInstance.get('/notifications/recent').catch(() => ({ data: [] }));
                const persistedNotifs: UnifiedNotification[] = (notifsRes.data || []).map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    createdAt: n.createdAt,
                    isRead: n.isRead,
                    referenceId: n.referenceId
                }));

                // 2. Also load doctor stability alerts (will silently fail for non-doctors)
                const alertsRes = await axiosInstance.get('/alerts/unread').catch(() => ({ data: [] }));
                const stabilityNotifs: UnifiedNotification[] = (alertsRes.data || []).map((alert: StabilityAlertDto) => ({
                    id: alert.alertId,
                    title: 'Stability Alert',
                    message: `${alert.patientName}'s score dropped to ${alert.stabilityScore} (${alert.scoreInterpretation}) in ${alert.quarter}.`,
                    type: 'StabilityAlert',
                    createdAt: alert.triggeredAt,
                    isRead: alert.isRead,
                }));

                // Merge: persisted first, then any stability alerts not already in the list
                const existingIds = new Set(persistedNotifs.map(n => n.id));
                const merged = [
                    ...persistedNotifs,
                    ...stabilityNotifs.filter(s => !existingIds.has(s.id))
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                setAlerts(merged);
                setUnreadCount(merged.filter(n => !n.isRead).length);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchInitialData();

        // Setup SignalR
        let connection: any;
        const setupSignalR = async () => {
            try {
                connection = await notificationConnectionManager.connect();
                
                // Receive stability alerts (Doctors)
                connection.on('ReceiveStabilityAlert', (alert: StabilityAlertDto) => {
                    const newNotif: UnifiedNotification = {
                        id: alert.alertId,
                        title: 'Stability Alert',
                        message: `${alert.patientName}'s score dropped to ${alert.stabilityScore} (${alert.scoreInterpretation}) in ${alert.quarter}.`,
                        type: 'StabilityAlert',
                        createdAt: alert.triggeredAt,
                        isRead: alert.isRead
                    };
                    setAlerts(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.error(newNotif.message, {
                        duration: 3000,
                        position: 'top-right'
                    });
                });

                // Receive generic system notifications (All Roles - e.g., Appointments)
                connection.on('ReceiveNotification', (notification: any) => {
                    const newNotif: UnifiedNotification = {
                        id: notification.id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        createdAt: notification.createdAt,
                        isRead: false,
                        referenceId: notification.referenceId
                    };
                    setAlerts(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Display beautiful rich toast based on type
                    const isFailure = notification.type.toLowerCase().includes('cancel');
                    if (isFailure) {
                        toast.error(`${notification.title}: ${notification.message}`, {
                            duration: 3000,
                            position: 'top-right'
                        });
                    } else {
                        toast.success(`${notification.title}: ${notification.message}`, {
                            duration: 3000,
                            position: 'top-right'
                        });
                    }
                });
            } catch (err) {
                console.error('SignalR setup failed:', err);
            }
        };

        setupSignalR();

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (connection) {
                connection.off('ReceiveStabilityAlert');
                connection.off('ReceiveNotification');
            }
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (id: string, type: string) => {
        try {
            if (type === 'StabilityAlert') {
                await axiosInstance.patch(`/alerts/${id}/read`);
            }
            setAlerts(prev => prev.filter(a => a.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Fallback: just clear from state
            setAlerts(prev => prev.filter(a => a.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleToggleDropdown = async () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        
        if (nextOpen) {
            // Immediately clear the badge visually
            setUnreadCount(0);
            // Mark all as read on the server (fire-and-forget)
            axiosInstance.patch('/notifications/read-all').catch(() => {});
            // Also mark any doctor stability alerts
            const unreadStabilityAlerts = alerts.filter(a => a.type === 'StabilityAlert' && !a.isRead);
            if (unreadStabilityAlerts.length > 0) {
                Promise.all(
                    unreadStabilityAlerts.map(alert =>
                        axiosInstance.patch(`/alerts/${alert.id}/read`).catch(() => {})
                    )
                ).catch(() => {});
            }
            // Update local state to mark all as read
            setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
        }
    };

    const getNotificationStyle = (type: string) => {
        switch (type) {
            case 'StabilityAlert':
                return {
                    icon: <ExclamationCircleIcon className="w-6 h-6 text-rose-500" />,
                    bg: 'bg-rose-500/10'
                };
            case 'AppointmentCreated':
                return {
                    icon: <CalendarIcon className="w-6 h-6 text-blue-500" />,
                    bg: 'bg-blue-500/10'
                };
            case 'AppointmentCancelled':
                return {
                    icon: <ExclamationCircleIcon className="w-6 h-6 text-rose-500" />,
                    bg: 'bg-rose-500/10'
                };
            case 'AppointmentRescheduled':
                return {
                    icon: <CalendarIcon className="w-6 h-6 text-amber-500" />,
                    bg: 'bg-amber-500/10'
                };
            case 'AppointmentConfirmed':
                return {
                    icon: <CheckCircleIcon className="w-6 h-6 text-emerald-500" />,
                    bg: 'bg-emerald-500/10'
                };
            default:
                return {
                    icon: <BellIcon className="w-6 h-6 text-slate-500" />,
                    bg: 'bg-slate-500/10'
                };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggleDropdown}
                className="relative p-2 rounded-2xl hover:bg-[var(--surface-2)] transition-all duration-200 group"
            >
                <BellIcon className={`w-6 h-6 transition-all duration-300 ${unreadCount > 0 ? 'text-primary animate-ring' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)] shadow-lg animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    <Card padding="none" className="overflow-hidden shadow-2xl border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
                        <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Text className="font-black uppercase tracking-widest text-xs">Notifications</Text>
                                <Badge variant="secondary" className="px-1.5 py-0.5">{unreadCount}</Badge>
                            </div>
                            <button 
                                onClick={() => {
                                    setAlerts([]);
                                    setUnreadCount(0);
                                }}
                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                            >
                                Clear all
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                    <CheckCircleIcon className="w-12 h-12 mb-3 text-emerald-500" />
                                    <Text variant="label" className="uppercase">No new notifications</Text>
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--border)]">
                                    {alerts.map((alert) => {
                                        const style = getNotificationStyle(alert.type);
                                        return (
                                            <div 
                                                key={alert.id}
                                                onClick={() => markAsRead(alert.id, alert.type)}
                                                className="px-5 py-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                                                        {style.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <Text className="font-bold text-sm truncate pr-2">{alert.title}</Text>
                                                            <Text className="text-[10px] font-bold opacity-40 whitespace-nowrap">
                                                                {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                                                            </Text>
                                                        </div>
                                                        <p className="text-xs text-[var(--foreground)] leading-relaxed mb-2">
                                                            {alert.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 text-center">
                            <Text variant="label" className="text-[9px] uppercase tracking-widest opacity-40">Secure Medical gateway system</Text>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
