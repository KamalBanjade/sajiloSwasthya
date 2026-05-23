import axiosInstance from '../utils/axios';

export interface Department {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    doctorCount?: number;
}

export const departmentApi = {
    getAll: async () => {
        const response = await axiosInstance.get('departments');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axiosInstance.get(`departments/${id}`);
        return response.data;
    },

    create: async (data: Partial<Department>) => {
        const response = await axiosInstance.post('departments', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Department>) => {
        const response = await axiosInstance.put(`departments/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axiosInstance.delete(`departments/${id}`);
        return response.data;
    }
};
