export type UserRole = 'Admin' | 'Doctor' | 'Patient';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    twoFactorEnabled: boolean;
    totpSetupCompleted: boolean;
    requiresPasswordChange?: boolean;
    address?: string;
    dateOfBirth?: string;
    bloodType?: string;
    profilePictureUrl?: string;
}

export interface AuthResponse {
    token?: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    expiresAt?: string;
    requiresTwoFactor?: boolean;
    requiresSetup?: boolean;
    twoFactorEnabled?: boolean;
    totpSetupCompleted?: boolean;
    requiresPasswordChange?: boolean;
    deviceToken?: string;

    // NEW: Device trust information
    trustedDevice?: boolean;
    canRememberDevice?: boolean;
    deviceTrusted?: boolean;
    dateOfBirth?: string;
    bloodType?: string;

    // NEW: Recovery properties for incomplete setups
    totpSetupQRData?: string;
    totpSecretManual?: string;
    medicalAccessToken?: string;
    medicalAccessURL?: string;
    medicalAccessExpiresAt?: string;
    profilePictureUrl?: string;
}
