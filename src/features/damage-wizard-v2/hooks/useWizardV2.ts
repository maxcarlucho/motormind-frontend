/**
 * Hook principal para manejar el estado y lógica del Wizard V2
 * Combina el contexto con la lógica de negocio y llamadas al API
 */

import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWizardV2 as useWizardV2Context } from '../context/WizardV2Context';
import damageAssessmentApi from '@/service/damageAssessmentApi.service';
import { Damage } from '@/types/DamageAssessment';
import { FrontendOperation } from '../types';
import {
  POLLING_INTERVAL,
  MAX_POLLING_ATTEMPTS,
  extractStepFromUrl,
  createWizardUrl,
  logger,
  ERROR_MESSAGES,
} from '../utils/constants';
import { prepareIntakePayload, prepareConfirmDamagesPayload } from '../api/adapter';

// ============================================================================
// TIPOS PARA EL HOOK
// ============================================================================

export interface UseWizardV2Return {
  // Estado del contexto
  state: ReturnType<typeof useWizardV2Context>['state'];

  // Acciones básicas
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  resetWizard: () => void;

  // Navegación
  goToStep: (step: 'intake' | 'damages' | 'operations' | 'valuation' | 'finalize') => void;
  goNext: () => void;
  goBack: () => void;

  // Acciones del flujo
  startIntake: (data: IntakeData) => Promise<string>;
  pollForDamages: (assessmentId: string) => Promise<void>;
  confirmDamages: (confirmedIds: string[]) => Promise<void>;
  createManualDamage: (damageData: {
    area?: string;
    subarea?: string;
    type: string;
    severity: string;
    description?: string;
    imageUrl?: string;
  }) => Promise<void>;
  saveOperations: (operations: FrontendOperation[]) => Promise<void>;
  generateValuation: () => Promise<void>;
  finalizeAssessment: () => Promise<void>;
  loadAssessmentData: () => Promise<void>;

  // Utilidades
  isCurrentStep: (step: string) => boolean;
  canNavigateToStep: (step: string) => boolean;
}

interface IntakeData {
  plate: string;
  claimDescription: string;
  images: string[];
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useWizardV2 = (): UseWizardV2Return => {
  const context = useWizardV2Context();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const { state, dispatch, setLoading, setError, resetWizard } = context;
  const assessmentId = params.id || state.assessmentId;

  // ✅ ELIMINADO: convertApiResponse ya no es necesario - tipos unificados

  // ============================================================================
  // NAVEGACIÓN
  // ============================================================================

  const goToStep = useCallback((step: typeof state.currentStep) => {
    if (!assessmentId) {
      logger.error('No assessment ID available for navigation');
      return;
    }

    const url = createWizardUrl(assessmentId, step);
    navigate(url);
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, [assessmentId, navigate, dispatch]);

  const goNext = useCallback(() => {
    const stepOrder: (typeof state.currentStep)[] = ['intake', 'damages', 'operations', 'valuation', 'finalize'];
    const currentIndex = stepOrder.indexOf(state.currentStep);

    if (currentIndex < stepOrder.length - 1 && state.canGoNext) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  }, [state.currentStep, state.canGoNext, goToStep]);

  const goBack = useCallback(() => {
    const stepOrder: (typeof state.currentStep)[] = ['intake', 'damages', 'operations', 'valuation', 'finalize'];
    const currentIndex = stepOrder.indexOf(state.currentStep);

    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  }, [state.currentStep, goToStep]);

  // ============================================================================
  // UTILIDADES DE NAVEGACIÓN
  // ============================================================================

  const isCurrentStep = useCallback((step: string) => {
    return state.currentStep === step;
  }, [state.currentStep]);

  const canNavigateToStep = useCallback((step: string) => {
    const stepOrder = ['intake', 'damages', 'operations', 'valuation', 'finalize'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const targetIndex = stepOrder.indexOf(step);

    // Puede navegar hacia atrás o al paso actual
    if (targetIndex <= currentIndex) return true;

    // Para navegar hacia adelante, necesita haber completado los pasos anteriores
    switch (step) {
      case 'damages':
        return state.status !== 'processing';
      case 'operations':
        return state.status === 'damages_confirmed' || state.status === 'operations_defined' ||
          state.status === 'valuated' || state.status === 'completed';
      case 'valuation':
        return state.status === 'operations_defined' || state.status === 'valuated' ||
          state.status === 'completed';
      case 'finalize':
        return state.status === 'valuated' || state.status === 'completed';
      default:
        return false;
    }
  }, [state.currentStep, state.status]);

  // ============================================================================
  // POLLING PARA DETECCIÓN DE DAÑOS
  // ============================================================================

  const pollForDamages = useCallback(async (assessmentId: string): Promise<void> => {
    let attempts = 0;

    const poll = async (): Promise<boolean> => {
      try {
        attempts++;

        const response = await damageAssessmentApi.getDetectedDamages(assessmentId);

        if (response.workflow?.status !== 'processing') {
          // Detección completa - guardar respuesta completa
          dispatch({ type: 'SET_DETECTED_DAMAGES', payload: response });
          logger.debug('Damage detection completed', {
            damagesCount: response.detectedDamages?.length || 0,
            status: response.workflow?.status
          });
          return true;
        }

        // Aún procesando
        if (attempts >= MAX_POLLING_ATTEMPTS) {
          throw new Error(ERROR_MESSAGES.PROCESSING_TIMEOUT);
        }

        return false;
      } catch (error) {
        logger.error('Polling error:', error);

        if (attempts >= MAX_POLLING_ATTEMPTS) {
          throw error;
        }

        return false;
      }
    };

    // Polling inicial inmediato
    const completed = await poll();
    if (completed) return;

    // Polling con intervalo
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const completed = await poll();
          if (completed) {
            clearInterval(interval);
            resolve();
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, POLLING_INTERVAL);
    });
  }, [dispatch]);


  const startIntake = useCallback(async (data: IntakeData): Promise<string> => {
    try {
      setLoading(true);
      setError(undefined);


      // Actualizar estado local primero
      dispatch({
        type: 'START_INTAKE',
        payload: {
          plate: data.plate,
          claimDescription: data.claimDescription,
          images: data.images,
        }
      });

      // Llamada al backend
      const payload = prepareIntakePayload(data);
      const response = await damageAssessmentApi.intake(payload);

      dispatch({
        type: 'INTAKE_SUCCESS',
        payload: {
          assessmentId: response.id,
          status: response.workflow?.status === 'processing' ? 'processing' : 'detected',
        }
      });

      // Si está procesando, iniciar polling
      if (response.workflow?.status === 'processing') {
        await pollForDamages(response.id);
      } else {
        // Si ya está detectado, cargar daños directamente
        const damagesResponse = await damageAssessmentApi.getDetectedDamages(response.id);
        dispatch({ type: 'SET_DETECTED_DAMAGES', payload: damagesResponse });
      }


      // Retornar el ID del assessment creado
      return response.id;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      logger.error('Intake failed:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, dispatch, pollForDamages]);

  const confirmDamages = useCallback(async (confirmedIds: string[]): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);

      // ✅ NUEVO: Usar IDs directos del backend (sin mapeo complejo)
      const payload = prepareConfirmDamagesPayload(confirmedIds);
      const response = await damageAssessmentApi.confirmDamages(assessmentId, payload.confirmedDamageIds, payload.edits);

      // Obtener los datos completos de los daños confirmados del response del backend
      const confirmedDamages = response.confirmedDamages || [];

      dispatch({
        type: 'CONFIRM_DAMAGES',
        payload: {
          ids: confirmedIds,
          damages: confirmedDamages
        }
      });


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  const createManualDamage = useCallback(async (damageData: {
    area?: string;
    subarea?: string;
    type: string;
    severity: string;
    description?: string;
    imageUrl?: string;
  }): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);


      const response = await damageAssessmentApi.createConfirmedDamage(assessmentId, damageData);

      // Actualizar el estado con los daños confirmados actualizados
      if (response.confirmedDamages) {
        dispatch({
          type: 'CONFIRM_DAMAGES',
          payload: {
            ids: response.confirmedDamages.map((d: Damage) => d._id || `${d.area}-${d.subarea}`),
            damages: response.confirmedDamages
          }
        });
      }

      // ✅ NUEVO: Actualizar userCreatedDamages si existe en la respuesta
      if (response.userCreatedDamages) {
        // Agregar solo el nuevo daño creado
        const newDamage = response.userCreatedDamages[response.userCreatedDamages.length - 1];
        if (newDamage) {
          dispatch({
            type: 'ADD_USER_CREATED_DAMAGE',
            payload: newDamage
          });
        }
      }


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  const saveOperations = useCallback(async (operations: FrontendOperation[]): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);


      // Por ahora, solo actualizamos el estado local
      // TODO: Implementar guardado en backend cuando se necesite
      dispatch({ type: 'SET_OPERATIONS', payload: operations });


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  const generateValuation = useCallback(async (): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);


      const response = await damageAssessmentApi.generateValuationNew(assessmentId);

      // El backend devuelve directamente el DamageAssessment actualizado
      // No necesitamos adaptación, solo dispatch directo
      dispatch({ type: 'SET_VALUATION', payload: response });


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  // Función para cargar los datos completos del assessment (incluyendo confirmedDamages)
  const loadAssessmentData = useCallback(async (): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);


      // Usar el endpoint que devuelve el assessment completo
      const response = await damageAssessmentApi.getAssessment(assessmentId);


      // Si hay confirmedDamages, actualizar el contexto
      if (response.confirmedDamages && response.confirmedDamages.length > 0) {
        const payload = {
          ids: response.confirmedDamages.map((d: Damage) => d._id || `${d.area}-${d.subarea}`),
          damages: response.confirmedDamages
        };


        dispatch({
          type: 'CONFIRM_DAMAGES',
          payload
        });
      }
      // Si el assessment está valuado o completado, cargar los datos de valoración
      if (response.workflow?.status === 'valuated' || response.workflow?.status === 'completed') {

        // Verificar si hay datos de valoración
        if (response.laborOutput || response.paintWorks || response.parts || response.compact) {


          // Actualizar el contexto con los datos de valoración
          dispatch({
            type: 'SET_VALUATION',
            payload: response
          });
        }
      }


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  const finalizeAssessment = useCallback(async (): Promise<void> => {
    if (!assessmentId) {
      throw new Error(ERROR_MESSAGES.ASSESSMENT_NOT_FOUND);
    }

    try {
      setLoading(true);
      setError(undefined);


      await damageAssessmentApi.finalize(assessmentId);

      dispatch({ type: 'FINALIZE_SUCCESS' });


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setLoading, setError, dispatch]);

  useEffect(() => {
    const stepFromUrl = extractStepFromUrl();
    if (stepFromUrl && stepFromUrl !== state.currentStep) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: stepFromUrl });
    }
  }, [searchParams, state.currentStep, dispatch]);

  return {
    // Estado del contexto
    state,

    // Acciones básicas
    setLoading,
    setError,
    resetWizard,

    // Navegación
    goToStep,
    goNext,
    goBack,

    // Acciones del flujo
    startIntake,
    pollForDamages,
    confirmDamages,
    createManualDamage,
    saveOperations,
    generateValuation,
    finalizeAssessment,
    loadAssessmentData,

    // Utilidades
    isCurrentStep,
    canNavigateToStep,
  };
};
export default useWizardV2;

