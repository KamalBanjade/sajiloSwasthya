'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { useConfirm } from '@/context/ConfirmContext';
import { useUserDevices } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheckIcon, 
    SmartphoneIcon, 
    LockIcon, 
    MonitorIcon, 
    Trash2Icon, 
    ChevronDownIcon, 
    KeyIcon,
    EyeIcon,
    EyeOffIcon,
    AlertTriangleIcon
} from 'lucide-react';

export default function SettingsHubPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();
    const { user, revokeDevice, revokeAllDevices, changePassword, deleteAccount } = useAuthStore();
    const { data: devices = [], isLoading } = useUserDevices();

    // UI State
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    
    // Action States
    const [isRevoking, setIsRevoking] = useState<string | null>(null);
    const [isRevokingAll, setIsRevokingAll] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    
    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const handleRevokeDevice = async (e: React.MouseEvent, deviceToken: string) => {
        e.stopPropagation();
        try {
            setIsRevoking(deviceToken);
            await revokeDevice(deviceToken);
            toast.success('Device revoked successfully');
            queryClient.invalidateQueries({ queryKey: ['auth', 'devices'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke device');
        } finally {
            setIsRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        const confirmed = await confirm({
            title: 'Revoke All Devices',
            message: 'Are you sure you want to revoke all trusted devices? You will need to enter your authenticator code on all devices next time you login.',
            confirmText: 'Revoke All',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            setIsRevokingAll(true);
            await revokeAllDevices();
            toast.success('All devices revoked successfully');
            queryClient.invalidateQueries({ queryKey: ['auth', 'devices'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke devices');
        } finally {
            setIsRevokingAll(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setIsChangingPassword(true);
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setExpandedSection(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = await confirm({
            title: 'PERMANENTLY Delete Account',
            message: 'This action CANNOT be undone. All your medical records and personal data will be gone forever.',
            confirmText: 'Delete Forever',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            setIsDeletingAccount(true);
            await deleteAccount();
            toast.success('Your account has been deleted successfully.');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete account');
            setIsDeletingAccount(false);
        }
    };

    if (isLoading) return <SettingsSkeleton />;

    return (
        <div className="w-full flex-1 flex flex-col space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-primary" />
                    Security & Credentials
                </h1>
                <p className="text-slate-500 font-medium mt-2">Manage your authentication methods and secure your medical vault.</p>
            </div>

            <div className="space-y-4">
                {/* --- 2FA Row --- */}
                <div className="group bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <SmartphoneIcon size={22} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Two-Factor Authentication</h2>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{user?.twoFactorEnabled ? 'Securely active' : 'Highly recommended for protection'}</p>
                            </div>
                        </div>
                        <Button 
                            variant={user?.twoFactorEnabled ? "danger" : "primary"}
                            className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                            onClick={() => window.location.href = '/settings/security'} // Keep navigation for 2FA setup for now
                        >
                            {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </Button>
                    </div>
                </div>

                {/* --- Change Password --- */}
                <div className={`group rounded-[2.5rem] border transition-all duration-500 ${expandedSection === 'password' ? 'bg-white dark:bg-slate-900 border-primary/30 shadow-xl' : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 shadow-sm'}`}>
                    <div 
                        className="p-8 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSection('password')}
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                <LockIcon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Change Password</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Update your system access credentials</p>
                            </div>
                        </div>
                        <div className={`text-slate-400 transition-transform duration-500 ${expandedSection === 'password' ? 'rotate-180 text-primary' : ''}`}>
                            <ChevronDownIcon size={20} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSection === 'password' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <form onSubmit={handleChangePassword} className="px-8 pb-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { id: 'currentPassword', label: 'Current Password', showKey: 'current' },
                                            { id: 'newPassword', label: 'New Password', showKey: 'new' },
                                            { id: 'confirmPassword', label: 'Confirm New', showKey: 'confirm' }
                                        ].map((field) => (
                                            <div key={field.id} className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{field.label}</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords[field.showKey as keyof typeof showPasswords] ? "text" : "password"}
                                                        required
                                                        value={(passwordData as any)[field.id]}
                                                        onChange={(e) => setPasswordData({ ...passwordData, [field.id]: e.target.value })}
                                                        className="w-full h-12 pl-4 pr-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        placeholder="••••••••"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowPasswords({ ...showPasswords, [field.showKey]: !(showPasswords as any)[field.showKey] });
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
                                                    >
                                                        {showPasswords[field.showKey as keyof typeof showPasswords] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button type="submit" isLoading={isChangingPassword} className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                            Update Password
                                        </Button>
                                        <button 
                                            type="button" 
                                            onClick={() => setExpandedSection(null)}
                                            className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Trusted Devices --- */}
                <div className={`group rounded-[2.5rem] border transition-all duration-500 ${expandedSection === 'devices' ? 'bg-white dark:bg-slate-900 border-primary/30 shadow-xl' : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 shadow-sm'}`}>
                    <div 
                        className="p-8 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSection('devices')}
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500">
                                <MonitorIcon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Trusted Devices</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Manage devices that can access without extra codes</p>
                            </div>
                        </div>
                        <div className={`text-slate-400 transition-transform duration-500 ${expandedSection === 'devices' ? 'rotate-180 text-primary' : ''}`}>
                            <ChevronDownIcon size={20} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSection === 'devices' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-8 pb-8 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Registrations</h3>
                                        <button
                                            onClick={handleRevokeAll}
                                            disabled={isRevokingAll || devices.length === 0}
                                            className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                        >
                                            Sign out all
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {devices.map((device: any) => (
                                            <div key={device.deviceToken} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl group/device hover:border-primary/30 transition-all flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isCurrentDevice ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white dark:bg-slate-900 text-slate-400'}`}>
                                                        <MonitorIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-none">{device.deviceName || 'Unknown'}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{device.ipAddress}</p>
                                                    </div>
                                                </div>
                                                {!device.isCurrentDevice && (
                                                    <button 
                                                        onClick={(e) => handleRevokeDevice(e, device.deviceToken)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2Icon size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Delete Account --- */}
                <div className="group bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-3xl p-8 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                                <AlertTriangleIcon size={24} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-wider">Permanent Account Deletion</h2>
                                <p className="text-xs font-medium text-rose-700/60 dark:text-rose-400/60 mt-1 max-w-sm">
                                    Once deleted, your medical data cannot be recovered. Please proceed with caution.
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="danger"
                            className="h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                            onClick={handleDeleteAccount}
                            isLoading={isDeletingAccount}
                        >
                            Terminate Account
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <img src="/images/sajilo.webp" alt="Sajilo Swasthya" className="h-8 w-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Enterprise Grade Encryption Active</p>
            </div>
        </div>
    );
}
