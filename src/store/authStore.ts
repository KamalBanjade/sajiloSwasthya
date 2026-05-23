import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '../lib/utils/axios';
import { User, AuthResponse } from '../types/auth';
import fpPromise from '@fingerprintjs/fingerprintjs';
import Cookies from 'js-cookie';

// Helper to get device fingerprint
const getDeviceFingerprint = async () => {
    try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        return {
            browser: (result.components.vendor as any)?.value || 'Unknown',
            os: (result.components.platform as any)?.value || 'Unknown',
            screenResolution: ((result.components.screenResolution as any)?.value)
                ? `${(result.components.screenResolution as any).value[0]}x${(result.components.screenResolution as any).value[1]}`
                : 'Unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
            language: navigator.language || 'Unknown'
        };
    } catch (e) {
        console.error("Failed to generate fingerprint", e);
        return null; // Fallback
    }
};

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasChecked: boolean; // Tracks if the initial session check completed
    requiresTwoFactor: boolean;
    error: string | null;
    rememberedEmail: string | null;
    token: string | null; // Persisted token — localStorage fallback when cookie is unavailable

    // Actions
    login: (credentials: any) => Promise<void>;
    loginWithTwoFactor: (data: { email: string; password: string; twoFactorCode: string; rememberDevice?: boolean }) => Promise<void>;
    register: (userData: any) => Promise<any>;
    resendVerificationEmail: (email: string) => Promise<void>;
    inviteDoctor: (doctorData: any) => Promise<any>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    getDashboardUrl: (user: User | null) => string;
    handleExternalLogin: (data: any) => void;

    // Trusted Devices
    getUserDevices: () => Promise<any[]>;
    revokeDevice: (deviceId: string) => Promise<void>;
    revokeAllDevices: () => Promise<void>;
    changePassword: (data: any) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            console.info("[AuthStore] Initializing (V4 - Persistent Token Active)");
            return {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                hasChecked: false,
                requiresTwoFactor: false,
                error: null,
                rememberedEmail: null,
                token: null,

                setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

                clearError: () => set({ error: null }),

                login: async (credentials: any) => {
                    set({ isLoading: true, error: null });
                    try {
                        const fingerprint = await getDeviceFingerprint();
                        const emailKey = credentials.email.toLowerCase();
                        const deviceToken = localStorage.getItem(`device_token_${emailKey}`) || localStorage.getItem('device_token');

                        const loginPayload = {
                            ...credentials,
                            fingerprint,
                            deviceToken
                        };

                        const response = await axiosInstance.post(`auth/login`, loginPayload);
                        const data: AuthResponse = response.data.data;

                        if (data.requiresTwoFactor) {
                            set({ requiresTwoFactor: true, isLoading: false });
                            return;
                        }

                        if (data.userId) {
                            if (credentials.rememberMe !== undefined) {
                                if (credentials.rememberMe) {
                                    set({ rememberedEmail: credentials.email });
                                } else {
                                    set({ rememberedEmail: null });
                                }
                            }

                            if (data.deviceToken) {
                                localStorage.setItem(`device_token_${emailKey}`, data.deviceToken);
                            }

                            const authToken = data.token || (data as any).Token;
                            console.info(`[AuthStore Trace] Token captured: ${authToken ? 'YES' : 'NO'}`);

                            if (authToken) {
                                const isHttp = window.location.protocol === 'http:';
                                Cookies.set('auth_token', authToken, {
                                    expires: 7,
                                    secure: !isHttp,
                                    sameSite: isHttp ? 'Lax' : 'None',
                                    path: '/'
                                });
                            }

                            set({
                                user: {
                                    id: data.userId,
                                    email: data.email,
                                    firstName: data.firstName,
                                    lastName: data.lastName,
                                    role: data.role,
                                    twoFactorEnabled: data.twoFactorEnabled ?? false,
                                    totpSetupCompleted: data.totpSetupCompleted ?? false,
                                    requiresPasswordChange: data.requiresPasswordChange,
                                    dateOfBirth: data.dateOfBirth,
                                    bloodType: data.bloodType,
                                    profilePictureUrl: data.profilePictureUrl,
                                },
                                isAuthenticated: true,
                                hasChecked: true,
                                requiresTwoFactor: false,
                                isLoading: false,
                                token: authToken || null,
                            });

                            if (data.requiresSetup) {
                                sessionStorage.setItem('registrationSetupData', JSON.stringify({
                                    totpQRData: data.totpSetupQRData,
                                    totpSecretManual: data.totpSecretManual,
                                    medicalAccessURL: data.medicalAccessURL,
                                    medicalAccessToken: data.medicalAccessToken,
                                    expiresAt: data.medicalAccessExpiresAt
                                }));
                                window.location.href = get().getDashboardUrl(get().user);
                                return;
                            }

                            if (data.requiresPasswordChange) {
                                window.location.href = '/reset-password';
                            } else {
                                window.location.href = get().getDashboardUrl(get().user);
                            }
                        }
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Login failed.';
                        set({ error: message, isLoading: false });
                        throw err;
                    }
                },

                loginWithTwoFactor: async (data: any) => {
                    set({ isLoading: true, error: null });
                    try {
                        const fingerprint = await getDeviceFingerprint();
                        const emailKey = data.email.toLowerCase();
                        const deviceToken = localStorage.getItem(`device_token_${emailKey}`) || localStorage.getItem('device_token');

                        const loginPayload = {
                            ...data,
                            fingerprint,
                            deviceToken
                        };

                        const response = await axiosInstance.post(`auth/login`, loginPayload);
                        const resData: AuthResponse = response.data.data;

                        if (resData.userId) {
                            if (data.rememberDevice && resData.deviceToken) {
                                localStorage.setItem(`device_token_${emailKey}`, resData.deviceToken);
                            }

                            const authToken = resData.token || (resData as any).Token;
                            console.info(`[AuthStore-2FA Trace] Token captured: ${authToken ? 'YES' : 'NO'}`);

                            if (authToken) {
                                const isHttp = window.location.protocol === 'http:';
                                Cookies.set('auth_token', authToken, {
                                    expires: 7,
                                    secure: !isHttp,
                                    sameSite: isHttp ? 'Lax' : 'None',
                                    path: '/'
                                });
                            }

                            set({
                                user: {
                                    id: resData.userId,
                                    email: resData.email,
                                    firstName: resData.firstName,
                                    lastName: resData.lastName,
                                    role: resData.role,
                                    twoFactorEnabled: resData.twoFactorEnabled ?? false,
                                    totpSetupCompleted: resData.totpSetupCompleted ?? false,
                                    requiresPasswordChange: resData.requiresPasswordChange,
                                    dateOfBirth: resData.dateOfBirth,
                                    bloodType: resData.bloodType,
                                    profilePictureUrl: resData.profilePictureUrl,
                                },
                                isAuthenticated: true,
                                hasChecked: true,
                                requiresTwoFactor: false,
                                isLoading: false,
                                token: authToken || null,
                            });

                            if (resData.requiresPasswordChange) {
                                window.location.href = '/reset-password';
                            } else {
                                window.location.href = get().getDashboardUrl(get().user);
                            }
                        }
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Invalid two-factor code.';
                        set({ error: message, isLoading: false });
                        throw err;
                    }
                },

                register: async (userData: any) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axiosInstance.post(`auth/register`, userData);
                        set({ isLoading: false });
                        return response.data;
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Registration failed.';
                        set({ error: message, isLoading: false });
                        throw err;
                    }
                },

                resendVerificationEmail: async (email: string) => {
                    set({ isLoading: true, error: null });
                    try {
                        await axiosInstance.post(`auth/resend-verification`, null, {
                            params: { email }
                        });
                        set({ isLoading: false });
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to resend email.';
                        set({ error: message, isLoading: false });
                        throw err;
                    }
                },

                inviteDoctor: async (doctorData: any) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axiosInstance.post(`admin/doctors/invite`, doctorData);
                        set({ isLoading: false });
                        return response.data;
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to invite doctor.';
                        set({ error: message, isLoading: false });
                        throw err;
                    }
                },

                logout: async () => {
                    try {
                        await axiosInstance.post('auth/logout');
                    } catch (err) {
                        console.error('Logout failed', err);
                    } finally {
                        set({
                            user: null,
                            isAuthenticated: false,
                            hasChecked: true,
                            requiresTwoFactor: false,
                            error: null,
                            token: null,
                        });
                        const isHttp = window.location.protocol === 'http:';
                        Cookies.remove('auth_token', {
                            secure: !isHttp,
                            sameSite: isHttp ? 'Lax' : 'None',
                            path: '/'
                        });
                    }
                },

                checkAuth: async () => {
                    const currentState = get();
                    // Optimization: Only show loader if we don't have a persisted user
                    if (!currentState.user) {
                        set({ isLoading: true });
                    }

                    console.info(`[AuthStore Trace] session recovery: Auth=${currentState.isAuthenticated}, Token=${!!currentState.token}`);

                    try {
                        const response = await axiosInstance.get(`auth/user`);
                        const userData = response.data.data;

                        set({
                            user: {
                                id: userData.id,
                                email: userData.email,
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                role: userData.role,
                                twoFactorEnabled: userData.twoFactorEnabled,
                                totpSetupCompleted: userData.totpSetupCompleted,
                                dateOfBirth: userData.dateOfBirth,
                                bloodType: userData.bloodType,
                                profilePictureUrl: userData.profilePictureUrl,
                            },
                            isAuthenticated: true,
                            isLoading: false,
                            hasChecked: true,
                        });
                    } catch (err) {
                        set({ user: null, isAuthenticated: false, isLoading: false, hasChecked: true });
                    }
                },

                getDashboardUrl: (user: User | null) => {
                    if (!user) return '/login';
                    switch (user.role) {
                        case 'Admin': return '/admin/dashboard';
                        case 'Doctor': return '/doctor/dashboard';
                        case 'Patient': return '/dashboard';
                        default: return '/dashboard';
                    }
                },

                handleExternalLogin: (data: any) => {
                    const authToken = data.token || data.Token;
                    
                    if (authToken) {
                        const isHttp = window.location.protocol === 'http:';
                        Cookies.set('auth_token', authToken, {
                            expires: 7,
                            secure: !isHttp,
                            sameSite: isHttp ? 'Lax' : 'None',
                            path: '/'
                        });
                    }

                    set({
                        user: {
                            id: data.userId || data.UserId,
                            email: data.email || data.Email,
                            firstName: data.firstName || data.FirstName,
                            lastName: data.lastName || data.LastName,
                            role: data.role || data.Role,
                            twoFactorEnabled: data.twoFactorEnabled ?? false,
                            totpSetupCompleted: data.totpSetupCompleted ?? false,
                            requiresPasswordChange: data.requiresPasswordChange ?? false,
                            dateOfBirth: data.dateOfBirth,
                            bloodType: data.bloodType,
                            profilePictureUrl: data.profilePictureUrl || data.ProfilePictureUrl,
                        },
                        isAuthenticated: true,
                        hasChecked: true,
                        requiresTwoFactor: false,
                        isLoading: false,
                        token: authToken || null,
                    });

                    window.location.href = get().getDashboardUrl(get().user);
                },

                getUserDevices: async () => {
                    try {
                        const response = await axiosInstance.get(`auth/trusted-devices`);
                        return response.data.data;
                    } catch (err: any) {
                        console.error('Failed to get user devices', err);
                        throw err;
                    }
                },

                revokeDevice: async (deviceId: string) => {
                    try {
                        await axiosInstance.delete(`auth/trusted-devices/${deviceId}`);
                        const keysToRemove: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('device_token')) {
                                const val = localStorage.getItem(key);
                                if (val === deviceId || val?.includes(deviceId)) {
                                    keysToRemove.push(key);
                                }
                            }
                        }
                        keysToRemove.forEach(k => localStorage.removeItem(k));
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to revoke device.';
                        throw new Error(message);
                    }
                },

                revokeAllDevices: async () => {
                    try {
                        await axiosInstance.post(`auth/trusted-devices/revoke-all`);
                        const keysToRemove: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('device_token')) {
                                keysToRemove.push(key);
                            }
                        }
                        keysToRemove.forEach(k => localStorage.removeItem(k));
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to revoke all devices.';
                        throw new Error(message);
                    }
                },

                changePassword: async (data: any) => {
                    try {
                        await axiosInstance.post('auth/change-password', data);
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to change password.';
                        throw new Error(message);
                    }
                },

                deleteAccount: async () => {
                    try {
                        await axiosInstance.delete('auth/account');
                        set({
                            user: null,
                            isAuthenticated: false,
                            token: null,
                        });
                        const isHttp = window.location.protocol === 'http:';
                        Cookies.remove('auth_token', {
                            secure: !isHttp,
                            sameSite: isHttp ? 'Lax' : 'None',
                            path: '/'
                        });
                        // Client component will handle redirection to preserve toasts
                    } catch (err: any) {
                        const message = err.response?.data?.message || 'Failed to delete account.';
                        throw new Error(message);
                    }
                },
            };
        },
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: any) => ({
                rememberedEmail: state.rememberedEmail,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                user: state.user
            }),
        }
    )
);
