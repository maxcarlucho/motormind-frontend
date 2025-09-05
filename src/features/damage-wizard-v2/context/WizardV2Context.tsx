import { createContext, useContext, useReducer, ReactNode } from 'react';
import { BackendDamageAssessment, BackendDamagesResponse } from '../types/backend.types';
import { FrontendOperation } from '../types';
import { Damage, DamageAction, WorkflowStatus } from '@/types/DamageAssessment';

// ============================================================================
// TIPOS - Estado del Wizard V2
// ============================================================================

export interface WizardV2State {
  // Identificación
  assessmentId?: string;
  carId?: string;
  status: WorkflowStatus;

  // Datos de entrada (Intake)
  plate?: string;
  claimDescription?: string;
  images: string[];

  // Datos procesados por el backend
  detectedDamages?: BackendDamagesResponse; // Respuesta completa del backend con imágenes incluidas
  confirmedDamageIds?: string[];
  confirmedDamages?: Damage[]; // Datos completos de los daños confirmados
  userCreatedDamages?: Damage[]; // ✅ NUEVO: Daños creados por usuario
  operations?: FrontendOperation[]; // Operaciones del frontend
  valuation?: BackendDamageAssessment; // Tipo específico del backend, se adaptará

  // ✅ NUEVO: Tracking de operaciones modificadas
  modifiedOperations?: Record<string, DamageAction>; // damageId -> newOperation

  // Metadatos y flags
  flags?: {
    usedMockTchek?: boolean;
    hasNoDataLabor?: boolean;
    isUsingMockData?: boolean; // Para diferenciar mock vs real
  };

  // Estado de UI
  loading: boolean;
  isGeneratingOperations?: boolean;
  error?: string;

  // Navegación
  currentStep: 'intake' | 'damages' | 'operations' | 'valuation' | 'finalize';
  canGoBack: boolean;
  canGoNext: boolean;
}

// ============================================================================
// ACCIONES
// ============================================================================

type WizardV2Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GENERATING_OPERATIONS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_STATUS'; payload: WorkflowStatus }
  | { type: 'SET_CURRENT_STEP'; payload: WizardV2State['currentStep'] }
  | { type: 'SET_ASSESSMENT_ID'; payload: string }
  | { type: 'SET_CAR_ID'; payload: string }
  | { type: 'START_INTAKE'; payload: { plate: string; claimDescription: string; images: string[] } }
  | { type: 'INTAKE_SUCCESS'; payload: { assessmentId: string; status: WorkflowStatus } }
  | { type: 'SET_DETECTED_DAMAGES'; payload: BackendDamagesResponse }
  | { type: 'CONFIRM_DAMAGES'; payload: { ids: string[]; damages: Damage[] } }
  | { type: 'ADD_USER_CREATED_DAMAGE'; payload: Damage } // ✅ NUEVO: Agregar daño creado por usuario
  | { type: 'SET_OPERATIONS'; payload: FrontendOperation[] }
  | { type: 'SET_VALUATION'; payload: BackendDamageAssessment }
  | { type: 'FINALIZE_SUCCESS' }
  | { type: 'RESET_WIZARD' }
  | { type: 'UPDATE_OPERATION'; payload: { damageId: string; operation: DamageAction } } // ✅ NUEVO: Trackear operación modificada
  | { type: 'CLEAR_MODIFIED_OPERATIONS' }; // ✅ NUEVO: Limpiar operaciones modificadas

// ============================================================================
// REDUCER
// ============================================================================

const initialState: WizardV2State = {
  status: 'processing', // Estado inicial basado en backend
  images: [],
  loading: false,
  currentStep: 'intake',
  canGoBack: false,
  canGoNext: false,
};

function wizardV2Reducer(state: WizardV2State, action: WizardV2Action): WizardV2State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_GENERATING_OPERATIONS':
      return { ...state, isGeneratingOperations: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
        canGoBack: action.payload !== 'intake',
        canGoNext: false, // Se habilitará según el estado de cada step
      };

    case 'SET_ASSESSMENT_ID':
      return {
        ...state,
        assessmentId: action.payload,
      };

    case 'SET_CAR_ID':
      return {
        ...state,
        carId: action.payload,
      };

    case 'START_INTAKE':
      return {
        ...state,
        plate: action.payload.plate,
        claimDescription: action.payload.claimDescription,
        images: action.payload.images,
        status: 'processing',
        loading: true,
        error: undefined,
      };

    case 'INTAKE_SUCCESS':
      return {
        ...state,
        assessmentId: action.payload.assessmentId,
        status: action.payload.status,
        loading: false,
        canGoNext: true,
      };

    case 'SET_DETECTED_DAMAGES':
      return {
        ...state,
        detectedDamages: action.payload,
        userCreatedDamages: action.payload.userCreatedDamages || [], // ✅ NUEVO: Extraer daños creados por usuario
        status: 'detected',
        loading: false,
        canGoNext: false, // Se habilita cuando se confirmen daños
      };

    case 'CONFIRM_DAMAGES': {
      const newState = {
        ...state,
        confirmedDamageIds: action.payload.ids,
        confirmedDamages: action.payload.damages,
        status: 'damages_confirmed' as WorkflowStatus,
        canGoNext: action.payload.ids.length > 0,
      };

      return newState;
    }

    case 'ADD_USER_CREATED_DAMAGE': {
      const newState = {
        ...state,
        userCreatedDamages: [...(state.userCreatedDamages || []), action.payload],
      };
      return newState;
    }

    case 'SET_OPERATIONS':
      return {
        ...state,
        operations: action.payload,
        status: 'operations_defined',
        canGoNext: true,
      };

    case 'SET_VALUATION':
      return {
        ...state,
        valuation: action.payload,
        status: 'valuated',
        canGoNext: true,
      };

    case 'FINALIZE_SUCCESS':
      return {
        ...state,
        status: 'completed',
        loading: false,
        canGoNext: false,
      };

    case 'RESET_WIZARD':
      return initialState;

    case 'UPDATE_OPERATION':
      return {
        ...state,
        modifiedOperations: {
          ...state.modifiedOperations,
          [action.payload.damageId]: action.payload.operation,
        },
      };

    case 'CLEAR_MODIFIED_OPERATIONS':
      return {
        ...state,
        modifiedOperations: undefined,
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface WizardV2ContextType {
  state: WizardV2State;
  dispatch: React.Dispatch<WizardV2Action>;

  // Acciones de conveniencia
  setLoading: (loading: boolean) => void;
  setGeneratingOperations: (loading: boolean) => void;
  setError: (error?: string) => void;
  setCurrentStep: (step: WizardV2State['currentStep']) => void;
  setCarId: (carId: string) => void;
  resetWizard: () => void;
}

const WizardV2Context = createContext<WizardV2ContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface WizardV2ProviderProps {
  children: ReactNode;
}

export const WizardV2Provider = ({ children }: WizardV2ProviderProps) => {
  const [state, dispatch] = useReducer(wizardV2Reducer, initialState);

  // Acciones de conveniencia
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setGeneratingOperations = (loading: boolean) =>
    dispatch({ type: 'SET_GENERATING_OPERATIONS', payload: loading });
  const setError = (error?: string) => dispatch({ type: 'SET_ERROR', payload: error });
  const setCurrentStep = (step: WizardV2State['currentStep']) =>
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  const setCarId = (carId: string) => dispatch({ type: 'SET_CAR_ID', payload: carId });
  const resetWizard = () => dispatch({ type: 'RESET_WIZARD' });

  const value: WizardV2ContextType = {
    state,
    dispatch,
    setLoading,
    setGeneratingOperations,
    setError,
    setCurrentStep,
    setCarId,
    resetWizard,
  };

  return <WizardV2Context.Provider value={value}>{children}</WizardV2Context.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useWizardV2 = (): WizardV2ContextType => {
  const context = useContext(WizardV2Context);
  if (!context) {
    throw new Error('useWizardV2 must be used within a WizardV2Provider');
  }
  return context;
};

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { WizardV2Action };
