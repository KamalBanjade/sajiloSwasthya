'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BottomNav } from '@/components/dashboard/BottomNav';
import toast from 'react-hot-toast';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient';
import { chatApi } from '@/lib/api/chatApi';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import {
    DocumentTextIcon,
    CalendarIcon,
    ClockIcon,
    QrCodeIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    PowerIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UsersIcon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    FolderPlusIcon,
    ChartBarIcon,
    CircleStackIcon,
    LockClosedIcon,
    QuestionMarkCircleIcon,
    Cog6ToothIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    ChatBubbleLeftEllipsisIcon
} from
    '@heroicons/react/24/outline';
import { FadeIn } from '@/components/ui/FadeIn';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Typography';
import { GlobalFooter } from '@/components/layout/GlobalFooter';

interface SidebarItemProps {
    icon: React.ComponentType<{ className?: string; }>;
    label: string;
    desc: string;
    href: string;
    isActive: boolean;
    isCollapsed: boolean;
    badge?: number;
}

import { usePrefetchRoute } from '@/hooks/usePrefetchOnHover';

const SidebarItem = ({ icon: Icon, label, href, isActive, isCollapsed, badge }: SidebarItemProps) => {
    const prefetch = usePrefetchRoute(href);

    return (
        <Link
            href={href}
            prefetch={true}
            onMouseEnter={prefetch}
            className="group relative block"
        >
            <div
                className={`
                    relative flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    hover:-translate-y-[1px]
                    ${isCollapsed ?
                        'justify-center w-12 h-12 mx-auto rounded-2xl' :
                        'px-4 py-3 gap-3 rounded-2xl mx-2'}
                    ${isActive ?
                        'text-primary bg-[var(--sidebar-active-bg)] shadow-md shadow-primary/10' :
                        'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'}
                `
                }>

                {/* Active Box Gradient - subtle overlay */}
                {isActive &&
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl pointer-events-none" />
                }

                {/* Left active indicator bar */}
                {!isCollapsed && isActive &&
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-secondary rounded-r-full" />
                }

                <div className="relative flex items-center justify-center shrink-0">
                    <Icon className={`
                        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5'}
                        ${isActive ? 'text-primary scale-110' : 'group-hover:scale-110'}
                    `} />

                    {/* Collapsed Badge Overlay */}
                    {isCollapsed && badge !== undefined && badge > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center px-0.5 border border-white dark:border-slate-800 shadow-md animate-pulse z-25">
                            {badge}
                        </div>
                    )}
                </div>

                {!isCollapsed &&
                    <span className={`text-sm truncate transition-all duration-300 ${isActive ? 'text-primary font-bold' : 'text-[var(--foreground)] font-semibold opacity-70'}`}>
                        {label}
                    </span>
                }

                {/* Expanded Badge */}
                {!isCollapsed && badge !== undefined && badge > 0 && (
                    <div className="ml-auto min-w-[20px] h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center px-1.5 shadow-lg shadow-emerald-500/20 animate-pulse z-20">
                        {badge}
                    </div>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed &&
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-[-6px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                        {label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                    </div>
                }
            </div>
        </Link>);

};

const SectionLabel = ({ label, isCollapsed }: { label: string; isCollapsed: boolean; }) => {
    if (isCollapsed) return <div className="my-1 mx-3 h-px bg-[var(--border)]" />;
    return (
        <div className="px-5 pt-4 pb-1">
            <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.15em] opacity-60">{label}</span>
        </div>);

};

export const DashboardLayout = ({ children, role }: { children: React.ReactNode; role: string; }) => {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const queryClient = useQueryClient();

    const { data: unreadCount = 0 } = useQuery({
        queryKey: queryKeys.chat.unreadCount(),
        queryFn: () => chatApi.getUnreadCount(),
        refetchInterval: 15000,
        enabled: !!user?.id
    });

    useEffect(() => {
        // Silently prefetch the heavy clinical analysis payload for patients
        if (role === 'Patient' && user?.id) {
            queryClient.prefetchQuery({
                queryKey: ['clinical_full_analysis', user.id],
                queryFn: () => patientApi.getFullAnalysis(user.id),
                staleTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
            });
        }
    }, [role, user?.id, queryClient]);

    const patientItems = [
        { icon: HomeIcon, label: 'Dashboard', desc: 'Overview of your health metrics and activities', href: '/dashboard', section: 'Main' },
        { icon: DocumentTextIcon, label: 'Medical Records', desc: 'Secure repository of your medical documents', href: '/records', section: 'Health' },
        { icon: FolderPlusIcon, label: 'Upload Record', desc: 'Add new documents to your secure vault', href: '/records/upload', section: 'Health' },
        { icon: CalendarIcon, label: 'Appointments', desc: 'Schedule and manage your doctor visits', href: '/appointments', section: 'Health' },
        { icon: ChatBubbleLeftEllipsisIcon, label: 'Messages', desc: 'Securely communicate with your doctors', href: '/messages', section: 'Health' },
        { icon: ChartBarIcon, label: 'Health Intelligence', desc: 'Deep-dive clinical analysis of your vitals and medications', href: '/intelligence', section: 'Health' },
        { icon: QrCodeIcon, label: 'QR Codes', desc: 'Manage access links to your medical records', href: '/qr-codes', section: 'Tools' },
        { icon: ExclamationTriangleIcon, label: 'Emergency', desc: 'Critical medical information for first responders', href: '/emergency-settings', section: 'Tools' },
        { icon: IdentificationIcon, label: 'My Profile', desc: 'Manage your personal and medical identity', href: '/profile', section: 'Account' },
        { icon: Cog6ToothIcon, label: 'Settings', desc: 'Manage your account and security profile', href: '/settings', section: 'Account' }];


    const doctorItems = [
        { icon: HomeIcon, label: 'Dashboard', desc: 'Overview of your clinical activity', href: '/doctor/dashboard', section: 'Main' },
        { icon: DocumentTextIcon, label: 'Pending Records', desc: 'Vault documents awaiting your certification', href: '/doctor/pending-records', section: 'Records' },
        { icon: ShieldCheckIcon, label: 'Certified Records', desc: 'Official registry of cryptographically signed medical documents', href: '/doctor/certified-records', section: 'Records' },
        { icon: UsersIcon, label: 'My Patients', desc: 'Manage shared access from your patient directory', href: '/doctor/patients', section: 'Patients' },
        { icon: ChatBubbleLeftEllipsisIcon, label: 'Messages', desc: 'Secure real-time patient communication', href: '/doctor/messages', section: 'Patients' },
        { icon: CalendarIcon, label: 'Appointments', desc: 'Overview of today\'s clinical schedule', href: '/doctor/appointments', section: 'Patients' },
        { icon: ClockIcon, label: 'Availability', desc: 'Manage your clinical working hours and blocked slots', href: '/doctor/availability', section: 'Patients' },
        { icon: IdentificationIcon, label: 'My Profile', desc: 'Manage your professional identity and license', href: '/doctor/profile', section: 'Account' },
        { icon: Cog6ToothIcon, label: 'Settings', desc: 'Manage application and security preferences', href: '/doctor/settings', section: 'Account' }];


    const adminItems = [
        { icon: HomeIcon, label: 'Dashboard', desc: 'System-wide monitoring and control center', href: '/admin/dashboard', section: 'Main' },
        { icon: UsersIcon, label: 'User Management', desc: 'Control system users and access roles', href: '/admin/users', section: 'Management' },
        { icon: IdentificationIcon, label: 'Doctor Management', desc: 'Verify and onboard medical professionals', href: '/admin/doctors', section: 'Management' },
        { icon: BuildingOfficeIcon, label: 'Departments', desc: 'Manage clinical departments and units', href: '/admin/departments', section: 'Management' },
        { icon: UsersIcon, label: 'Patient Directory', desc: 'Global directory of registered patients', href: '/admin/patients', section: 'Management' },
        { icon: ClipboardDocumentListIcon, label: 'Audit Logs', desc: 'Immutable records of all system activities', href: '/admin/audit-logs', section: 'System' },
        { icon: ChartBarIcon, label: 'System Stats', desc: 'Real-time infrastructure and usage metrics', href: '/admin/statistics', section: 'System' },
        // { icon: CircleStackIcon, label: 'Backups', desc: 'Manage system backups and recovery points', href: '/admin/backups', section: 'System' },
        // { icon: LockClosedIcon, label: 'Security', desc: 'Global threat monitoring and policy control', href: '/admin/security', section: 'System' }
    ];


    const items = role === 'Admin' ? adminItems : role === 'Doctor' ? doctorItems : patientItems;

    const sortedItems = [...items].sort((a, b) => b.href.length - a.href.length);
    const activeItem = sortedItems.find((item) =>
        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
    ) || items.find((item) => pathname === item.href);

    const sections = items.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    return (
        <div className="relative flex h-screen font-sans overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            {/* --- Premium Top Light Gradient --- */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent" />
            </div>

            {/* --- Sidebar (Floating Island) - Hidden on mobile/tablet --- */}
            <aside
                className={`
                    relative hidden lg:flex flex-col h-[calc(100vh-8px)] overflow-hidden z-30 shrink-0
                    rounded-r-2xl border border-[var(--border)]
                    mt-1 mb-1
                    bg-[var(--surface)]/95 backdrop-blur-md transition-all duration-500
                    ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]
                    ${isCollapsed ? 'w-[76px]' : 'w-64'}
                    shadow-[8px_0_30px_-10px_rgba(0,0,0,0.15)] dark:shadow-[8px_0_30px_-10px_rgba(0,0,0,0.5)]
                `}>

                {/* Logo Area */}
                <div className={`flex items-center shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-b border-[var(--border)] h-20 ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-0'}`}>
                    <Link href={role === 'Admin' ? '/admin/dashboard' : role === 'Doctor' ? '/doctor/dashboard' : '/dashboard'} className="flex items-center">
                        {isCollapsed ?
                            <img src="/images/logo.webp" alt="Logo" className="h-9 w-9 object-contain transition-all duration-500 hover:scale-105" /> :

                            <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500 cursor-pointer group/logo">
                                <div className="p-1 rounded-2xl shrink-0">
                                    <img src="/images/logo.webp" alt="Logo" className="h-11 w-auto object-contain drop-shadow-sm group-hover/logo:scale-105 transition-transform" />
                                </div>
                                <div className="flex flex-col items-center -mt-2">
                                    <div className="relative w-fit mx-auto overflow-visible">
                                        <img src="/images/sajilo.webp" alt="सजिलो" className="h-14 w-36 object-contain translate-x-[-18px]" />
                                        <span
                                            className="absolute text-[16px] font-semibold text-secondary tracking-[0.05em] font-amita inline-block scale-x-110"
                                            style={{ bottom: '4px', right: '14px' }}>

                                            स्वास्थ्य
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-3 no-scrollbar transition-all duration-500">
                    <div className={`flex flex-col transition-all duration-500 ${isCollapsed ? 'items-center gap-1.5 px-3 py-2' : 'gap-0.5 px-2'}`}>
                        {Object.entries(sections).map(([section, sectionItems]) =>
                            <div key={section} className="w-full">
                                <SectionLabel label={section} isCollapsed={isCollapsed} />
                                <div className="flex flex-col gap-0.5">
                                    {sectionItems.map((item) => {
                                        const isActive = activeItem?.href === item.href;
                                        const isMessages = item.href === '/messages' || item.href === '/doctor/messages';
                                        const badge = isMessages ? unreadCount : undefined;
                                        return <SidebarItem key={item.href} {...item} isActive={isActive} isCollapsed={isCollapsed} badge={badge} />;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-2)] transition-all duration-500">

                    {/* Logout + Toggle Row */}
                    <div className={`flex items-center border-t border-[var(--border)] transition-all duration-500 ${isCollapsed ? 'flex-col' : ''}`}>
                        <button
                            onClick={() => {
                                logout();
                                toast.success('Logged out successfully.');
                            }}
                            className={`flex items-center gap-2 hover:text-rose-500 transition-all duration-200 text-xs font-bold text-[var(--muted)] ${isCollapsed ? 'w-full justify-center py-4' : 'flex-1 px-5 py-4'}`}>

                            <PowerIcon className="w-4 h-4 shrink-0 transition-transform hover:scale-110" />
                            {!isCollapsed && <span className="animate-in fade-in duration-500">Logout</span>}
                        </button>

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`flex items-center justify-center hover:text-primary transition-all duration-200 border-l border-[var(--border)] text-[var(--muted)] ${isCollapsed ? 'w-full py-4 border-t border-l-0' : 'px-4 py-4'}`}
                            title={isCollapsed ? 'Expand' : 'Collapse'}>

                            {isCollapsed ?
                                <ChevronRightIcon className="w-4 h-4 transition-transform hover:-translate-x-0.5" /> :

                                <ChevronLeftIcon className="w-4 h-4 transition-transform hover:-translate-x-0.5" />
                            }
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <header
                    className={`
                        h-20 flex items-center justify-between px-4 md:px-6 shrink-0 
                        border-b backdrop-blur-md z-40
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        rounded-t-2xl mx-1 mt-1 border-x border-t shadow-sm shadow-black/[0.02]
                    `}
                    style={{
                        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
                        borderColor: 'var(--border)'
                    }}>

                    <div className="flex flex-col justify-center max-w-[50%] md:max-w-none">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase truncate">
                            {activeItem?.label || 'Overview'}
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 md:mt-2 truncate max-w-[200px] md:max-w-[400px]">
                            {activeItem?.desc || 'Welcome to the secure medical gateway'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* QR Code Button - Hidden on very small screens */}
                        <button
                            className="hidden xs:flex w-9 h-9 rounded-2xl items-center justify-center transition-all hover:text-secondary hover:bg-secondary/10"
                            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>

                            <QrCodeIcon className="w-5 h-5" />
                        </button>

                        {/* Notifications (All Roles) */}
                        <NotificationBell />

                        {/* Dark Mode Toggle */}
                        <ThemeToggle />

                        <div className="h-7 w-px hidden xs:block" style={{ background: 'var(--border)' }} />

                        {/* User Area */}
                        <UserPopover user={user} role={role} logout={logout} />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 w-full overflow-y-auto no-scrollbar rounded-2xl p-4 md:p-6 pb-32 lg:pb-12">
                    <FadeIn direction="down" distance={10} duration={0.6} key={pathname}>
                        <div className="flex flex-col w-full group min-h-full">
                            {children}
                        </div>
                    </FadeIn>
                </div>

                <BottomNav items={items} unreadCount={unreadCount} />
            </main>
        </div>);

};

/* --- Navbar User Popover Component --- */
const UserPopover = ({ user, role, logout }: { user: any; role: string; logout: () => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const showPopover = isOpen || isLocked;

    // Compute position relative to viewport when shown
    const computePos = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPopoverPos({
            top: rect.bottom + 10,
            right: window.innerWidth - rect.right
        });
    }, []);

    useEffect(() => {
        if (showPopover) computePos();
    }, [showPopover, computePos]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                // also consider the portal node
                const portalEl = document.getElementById('user-popover-portal');
                if (portalEl && portalEl.contains(event.target as Node)) return;
                setIsLocked(false);
                setIsOpen(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsLocked(false); setIsOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const popoverCard = showPopover ?
        <div
            id="user-popover-portal"
            style={{ position: 'fixed', top: popoverPos.top, right: popoverPos.right, zIndex: 9999, width: 296 }}
            className="animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">

            <Card padding="none" className="overflow-hidden shadow-2xl">
                {/* Banner */}
                <div className="h-12 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 relative">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <IdentificationIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Avatar + Name — inline flex, no absolute overlap */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <Avatar
                        src={user?.profilePictureUrl}
                        gender={user?.gender}
                        name={`${user?.firstName} ${user?.lastName}`}
                        className="w-11 h-11 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                            {user?.firstName} {user?.lastName}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />

                {/* Stats */}
                <div className="px-4 py-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <Text variant="label">Birthday</Text>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {user?.dateOfBirth ?
                                new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) :
                                'Not set'}
                        </span>
                    </div>

                    {user?.bloodType &&
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-[8px] font-black text-rose-500">B</span>
                                <Text variant="label">Blood Type</Text>
                            </div>
                            <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-500/20">
                                {user.bloodType}
                            </span>
                        </div>
                    }

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <Text variant="label">Role</Text>
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {role}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                    <Link
                        href="/settings"
                        className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-400 hover:text-primary transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-100 dark:border-slate-700 hover:border-primary/20">

                        <Cog6ToothIcon className="w-3.5 h-3.5" />
                        Advanced Settings
                    </Link>
                </div>
            </Card>
        </div> :
        null;


    return (
        <>
            <div
                className="relative flex items-center gap-3 cursor-pointer group"
                onMouseEnter={() => { setIsOpen(true); computePos(); }}
                onMouseLeave={() => !isLocked && setIsOpen(false)}
                onClick={() => { setIsLocked((l) => !l); computePos(); }}
                ref={triggerRef}>

                <div className="text-right hidden md:block">
                    <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                        {user?.firstName} {user?.lastName}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-80">{role}</span>
                        <div className={`w-1 h-1 rounded-full transition-colors ${isLocked ? 'bg-primary animate-pulse' : 'bg-[var(--border)]'}`} />
                    </div>
                </div>

                <Avatar
                    src={user?.profilePictureUrl}
                    gender={user?.gender}
                    name={`${user?.firstName} ${user?.lastName}`}
                    className={`
                        w-10 h-10 rounded-2xl
                        shadow-sm transition-all duration-300
                        ring-2 ${isLocked ? 'ring-primary' : 'ring-primary/20 group-hover:ring-primary/40'}
                        group-hover:shadow-md active:scale-95 overflow-hidden
                    `}
                />
            </div>

            {/* Portal: renders directly in <body> — escapes any stacking context */}
            {typeof window !== 'undefined' && createPortal(popoverCard, document.body)}
        </>);

};