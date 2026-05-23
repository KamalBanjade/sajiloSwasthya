import axiosInstance from '../utils/axios';

// Matches backend VisibilityLevel enum exactly
export const VisibilityLevel = {
    Private: 0,
    Department: 1,
    Hospital: 2,
} as const;
export type VisibilityLevelValue = typeof VisibilityLevel[keyof typeof VisibilityLevel];

export interface SuggestTemplateRequest {
    chiefComplaint: string;
    patientId: string;
}

export const templatesApi = {
    getMyTemplates: async (includeShared: boolean = true) => {
        const response = await axiosInstance.get(`templates/my-templates?includeShared=${includeShared}`);
        return response.data;
    },

    getTemplate: async (id: string) => {
        const response = await axiosInstance.get(`templates/${id}`);
        return response.data;
    },

    suggestTemplates: async (data: SuggestTemplateRequest) => {
        const response = await axiosInstance.post('templates/suggest', data);
        return response.data;
    },

    createTemplate: async (data: {
        templateName: string;
        description?: string;
        visibility: VisibilityLevelValue;
        schema?: { sections: any[] };
    }) => {
        const response = await axiosInstance.post('templates', data);
        return response.data;
    },

    createTemplateFromRecord: async (recordId: string, data: {
        templateName: string;
        description?: string;
        visibility: VisibilityLevelValue;
    }) => {
        const response = await axiosInstance.post(`templates/from-record/${recordId}`, data);
        return response.data;
    },

    deleteTemplate: async (id: string) => {
        const response = await axiosInstance.delete(`templates/${id}`);
        return response.data;
    },

    updateTemplate: async (id: string, data: {
        templateName?: string;
        description?: string;
        visibility?: VisibilityLevelValue;
        schema?: { sections: any[] };
        isActive?: boolean;
    }) => {
        const response = await axiosInstance.put(`templates/${id}`, data);
        return response.data;
    },

    forkTemplate: async (id: string, newName: string) => {
        const response = await axiosInstance.post(`templates/${id}/fork`, { newTemplateName: newName });
        return response.data;
    }
};
