'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { doctorApi, DoctorExtendedProfile } from '@/lib/api';
import axiosInstance from '@/lib/utils/axios';
import { Button } from '@/components/ui/Button';
import {
    ShieldCheck,
    Lock,
    Key,
    Smartphone,
    Mail,
    Phone,
    Building2,
    Palette,
    Bell,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    X,
    Trash2,
    ChevronRight,
    Moon,
    Sun,
    Monitor,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import { useDoctorProfile, useUserDevices } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';

// --- Shared Components ---

function SettingsSection({ icon, title, desc, children, accent = 'primary' }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    children: React.ReactNode;
    accent?: string;
}) {
    const accents: any = {
        primary: 'bg-primary text-white',
        emerald: 'bg-emerald-500 text-white',
        amber: 'bg-amber-500 text-white',
        violet: 'bg-violet-500 text-white',
        rose: 'bg-rose-500 text-white',
        sky: 'bg-sky-500 text-white'
    };

    return (
        <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${accents[accent] || accents.primary} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{desc}</p>
                    </div>
                </div>
            </div>
            {children}
        </section>
    );
}

// --- Main Components ---

export default function DoctorSettingsPage() {
    const queryClient = useQueryClient();
    const { user, checkAuth, revokeDevice, revokeAllDevices } = useAuthStore();
    
    const { data: profileRes, isLoading: loadingProfile } = useDoctorProfile();
    const { data: devicesRes, isLoading: loadingDevices } = useUserDevices();
    
    const profile = profileRes?.data;
    const devices = devicesRes || [];

    // States for various forms
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const [is2FASubmitting, setIs2FASubmitting] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setPasswordLoading(true);
        try {
            await axiosInstance.post('auth/change-password', {
                currentPassword: passwordData.current,
                newPassword: passwordData.new,
                confirmPassword: passwordData.confirm
            });
            toast.success("Security credentials updated");
            setIsChangingPassword(false);
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleRevokeDevice = async (id: string) => {
        if (!confirm("Are you sure you want to revoke access for this device?")) return;
        try {
            await revokeDevice(id);
            toast.success("Access revoked");
            queryClient.invalidateQueries({ queryKey: ['auth', 'devices'] });
        } catch (err: any) {
            toast.error(err.message || "Failed to revoke device");
        }
    };

    const handleToggle2FA = async () => {
        if (user?.twoFactorEnabled) {
            // Logic for disabling (requires password typically)
            const password = prompt("Please confirm your password to disable 2FA:");
            if (!password) return;

            setIs2FASubmitting(true);
            try {
                await axiosInstance.post('auth/two-factor/disable', { password });
                toast.success("Two-factor authentication disabled");
                await checkAuth();
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to disable 2FA");
            } finally {
                setIs2FASubmitting(false);
            }
        } else {
            // Redirect to setup
            window.location.href = '/(auth)/complete-setup'; // or wherever 2FA setup is
        }
    };

    if (loadingProfile || loadingDevices) return <SettingsSkeleton />;

    return (
        <PageLayout className="space-y-12">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* --- Left Column: Security Hub --- */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Security Hub */}
                    <SettingsSection
                        icon={<ShieldCheck size={24} />}
                        title="Security Hub"
                        desc="Manage your authentication and vault security"
                        accent="violet"
                    >
                        <div className="space-y-8">

                            {/* Two Factor Row */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 gap-6">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <Smartphone size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Two-Factor Authentication</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1">{user?.twoFactorEnabled ? 'Your account is protected by an extra layer of security.' : 'Highly recommended to secure your medical data.'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    disabled={is2FASubmitting}
                                    className={`h-11 px-8 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 flex items-center gap-2
                                    ${user?.twoFactorEnabled ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-secondary text-white shadow-lg shadow-secondary/20'}`}
                                >
                                    {is2FASubmitting ? <Loader2 size={14} className="animate-spin" /> : user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </button>
                            </div>

                            {/* Password Change Row */}
                            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${isChangingPassword ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Change Password</p>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Update your system access credentials</p>
                                        </div>
                                    </div>
                                    {!isChangingPassword && (
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="h-10 w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {isChangingPassword && (
                                        <motion.form
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            onSubmit={handlePasswordChange}
                                            className="space-y-6 pt-2 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                                                    <div className="relative group/input">
                                                        <input
                                                            type={showPasswords.current ? "text" : "password"} required
                                                            className="w-full h-12 pl-4 pr-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                            value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                                                        >
                                                            {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                                                    <div className="relative group/input">
                                                        <input
                                                            type={showPasswords.new ? "text" : "password"} required
                                                            className="w-full h-12 pl-4 pr-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                            value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                                                        >
                                                            {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm New</label>
                                                    <div className="relative group/input">
                                                        <input
                                                            type={showPasswords.confirm ? "text" : "password"} required
                                                            className="w-full h-12 pl-4 pr-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                            value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                                                        >
                                                            {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 py-2">
                                                <Button type="submit" disabled={passwordLoading} className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20">
                                                    {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : 'Update Password'}
                                                </Button>
                                                <button type="button" onClick={() => setIsChangingPassword(false)} className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500">Cancel</button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Trusted Devices Section */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Monitor size={14} /> Registered Vault Access
                                    </h3>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Sign out from all other devices?")) {
                                                await revokeAllDevices();
                                                toast.success("Signed out from all other sessions");
                                                queryClient.invalidateQueries({ queryKey: ['auth', 'devices'] });
                                            }
                                        }}
                                        className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                    >
                                        Sign out all
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {devices.map((device) => (
                                        <div key={device.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl group/device hover:border-violet-500/30 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isCurrent ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                    <Monitor size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{device.deviceName || 'Unknown Device'}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{device.ipAddress}</p>
                                                </div>
                                            </div>
                                            {!device.isCurrent && (
                                                <button onClick={() => handleRevokeDevice(device.id)} className="w-8 h-8 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 opacity-0 group-hover/device:opacity-100 transition-all hover:bg-rose-500 hover:text-white">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                </div>

                {/* --- Right Column: Account & UI --- */}
                <div className="lg:col-span-4 space-y-10">

                    {/* Professional Identity */}
                    <SettingsSection
                        icon={<Building2 size={24} />}
                        title="Identity"
                        desc="Contact & Professional Links"
                        accent="sky"
                    >
                        <div className="space-y-5">
                            <div className="p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Registered Email</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs font-bold font-sans text-slate-600 dark:text-slate-300">
                                        <Mail size={14} className="opacity-50" />
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Registered Phone</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs font-bold font-sans text-slate-600 dark:text-slate-300">
                                        <Phone size={14} className="opacity-50" />
                                        {profile?.contactNumber || 'Not Linked'}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hospital Affiliation</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-sky-500/5 rounded-2xl border border-sky-500/10 text-xs font-black text-sky-600 uppercase">
                                        <Building2 size={14} />
                                        {profile?.hospitalAffiliation || 'Private Practice'}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => window.location.href = '/doctor/profile'}
                                    className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-500 hover:text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest mt-4 transition-all"
                                >
                                    Manage Clinical Profile
                                </Button>
                            </div>
                        </div>
                    </SettingsSection>

                    {/* Interface Preferences */}
                    <SettingsSection
                        icon={<Palette size={24} />}
                        title="Interface"
                        desc="UI Styling & Notifications"
                        accent="emerald"
                    >
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Visual Theme</label>
                                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
                                    <button className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white">
                                        <Sun size={16} />
                                        <span className="text-[9px] font-black uppercase">Light</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                                        <Moon size={16} />
                                        <span className="text-[9px] font-black uppercase">Dark</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                                        <Monitor size={16} />
                                        <span className="text-[9px] font-black uppercase">System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Notifications</label>
                                <div className="space-y-3">
                                    {[
                                        { icon: <Mail size={14} />, label: 'Email Alerts' },
                                        { icon: <Bell size={14} />, label: 'Push Notifications' }
                                    ].map((pref, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="text-emerald-500">{pref.icon}</div>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{pref.label}</span>
                                            </div>
                                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                                                <div className="absolute top-1 left-5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                </div>
            </div>

            {/* Bottom Status Branding */}
            <div className="flex flex-col items-center justify-center pt-12 gap-4 pb-8 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <img src="/images/sajilo.webp" alt="Sajilo Swasthya" className="h-10 w-auto object-contain" />
                <div className="flex items-center gap-3">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Enterprise Grade Medical Security Active</span>
                </div>
            </div>

        </PageLayout>
    );
}
