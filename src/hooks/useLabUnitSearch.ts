import { useQuery, useMutation } from '@tanstack/react-query';
import { labUnitsApi, CreateCustomLabUnitRequest } from '@/lib/api/labUnitsApi';

export function useLabUnitSearch(query: string) {
    return useQuery({
        queryKey: ['labUnits', 'search', query],
        queryFn: () => labUnitsApi.search(query),
        enabled: query.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreateCustomLabUnit() {
    return useMutation({
        mutationFn: (data: CreateCustomLabUnitRequest) => labUnitsApi.createCustom(data),
    });
}
