import { useState, useEffect } from 'react';
import { useAuth } from '@/context/Auth.context';
import { UserRole } from '@/types/User';
import damageAssessmentApi from '@/service/damageAssessmentApi.service';
import { BackendDamageAssessment } from '../types/backend.types';

/**
 * Hook para cargar datos de un assessment
 */
export const useAssessmentData = (id: string | undefined) => {
    const [data, setData] = useState<BackendDamageAssessment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) {
                setError('ID no proporcionado');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const response = await damageAssessmentApi.getAssessment(id);
                setData(response);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                setError(errorMessage);
                console.error('Error loading assessment data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    return { data, isLoading, error };
};

/**
 * Hook para verificar permisos de autenticación
 */
export const useAuthGuard = () => {
    const { user } = useAuth();
    const isAuthorized = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

    return { isAuthorized, user };
};
