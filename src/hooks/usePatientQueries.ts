import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient';
import { queryKeys } from '@/lib/queryKeys';

export function usePatientStats() {
    return useQuery({
        queryKey: queryKeys.patient.dashboardStats(),
        queryFn: async () => {
            const response = await patientApi.getDashboardStats();
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
