import { useQuery } from '@tanstack/react-query';
import apiService from '@/service/api.service';
import { Diagnosis } from '@/types/Diagnosis';

interface UseRecentDiagnosesOptions {
    limit?: number;
    enabled?: boolean;
}

export const useRecentDiagnoses = ({ limit = 5, enabled = true }: UseRecentDiagnosesOptions = {}) => {
    return useQuery<{ success: boolean; data: Diagnosis[]; total: number }>({
        queryKey: ['recentDiagnoses', limit],
        queryFn: async () => {
            const response = await apiService.getRecentDiagnoses(limit);
            return response;
        },
        enabled,
        staleTime: 60000, // 1 minuto
        retry: false,
    });
};
