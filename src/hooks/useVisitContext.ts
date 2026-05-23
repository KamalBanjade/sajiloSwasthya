import { useQuery } from '@tanstack/react-query';
import { healthRecordApi, VisitContext } from '@/lib/api/healthRecordApi';

export function useVisitContext(patientId?: string) {
    return useQuery<VisitContext>({
        queryKey: ['visit-context', patientId],
        queryFn: async () => {
            if (!patientId) throw new Error('Patient ID is required');
            const res = await healthRecordApi.getVisitContext(patientId);
            if (!res.success) throw new Error(res.message || 'Failed to fetch visit context');
            return res.data;
        },
        enabled: !!patientId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
