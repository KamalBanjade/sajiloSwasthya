import axiosInstance from '../utils/axios';

export interface GenerateQRRequest {
    expiryDays?: number;
    format?: 'png' | 'svg';
}

export interface QRCodeListItem {
    token: string;
    tokenType: 'Normal' | 'Emergency';
    createdAt: string;
    expiresAt: string;
    isExpired: boolean;
    accessCount: number;
    lastAccessedAt: string | null;
}

export interface QRGenerationResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        expiresAt: string;
        qrCodeBase64?: string;
        qrCodeSvg?: string;
        accessUrl: string;
    };
}

export const qrApi = {
    generateNormal: async (data: GenerateQRRequest): Promise<QRGenerationResponse> => {
        const response = await axiosInstance.post('qr/generate-normal', data);
        return response.data;
    },

    generateEmergency: async (data: GenerateQRRequest): Promise<QRGenerationResponse> => {
        const response = await axiosInstance.post('qr/generate-emergency', data);
        return response.data;
    },

    getMyCodes: async (): Promise<{ success: boolean; message: string; data: QRCodeListItem[] }> => {
        const response = await axiosInstance.get('qr/my-codes');
        return response.data;
    },

    revokeToken: async (token: string): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post(`qr/revoke/${token}`);
        return response.data;
    },
};
