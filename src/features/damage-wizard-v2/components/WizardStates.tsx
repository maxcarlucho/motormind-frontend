import { ProgressCard } from './ProgressCard';
import { PageShell } from './PageShell';
import { WizardStepperWithNav } from './WizardStepperWithNav';
import { WizardStepKey } from '../types';

// Helper para obtener los pasos completados según el paso actual
const getCompletedSteps = (currentStep: WizardStepKey): WizardStepKey[] => {
  const allSteps: WizardStepKey[] = ['intake', 'damages', 'operations', 'valuation', 'finalize'];
  const currentIndex = allSteps.indexOf(currentStep);
  return allSteps.slice(0, currentIndex);
};

interface LoadingStateProps {
  currentStep?: WizardStepKey;
}

/**
 * Componente para mostrar estado de carga CON STEPPER
 */
export const LoadingState = ({ currentStep = 'intake' }: LoadingStateProps) => (
  <PageShell
    header={
      <WizardStepperWithNav
        currentStep={currentStep}
        completedSteps={getCompletedSteps(currentStep)}
        loading={true}
      />
    }
    loading={true}
    loadingTitle="Cargando peritaje"
    loadingDescription="Estamos preparando la información del peritaje para ti"
    content={<div />}
  />
);

/**
 * Componente para mostrar estado de error
 */
export const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mb-4 text-6xl text-red-600">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Error al cargar el peritaje</h2>
      <p className="mb-4 text-gray-600">{error}</p>
      <button
        onClick={onRetry}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  </div>
);

/**
 * Componente para mostrar estado de no encontrado
 */
export const NotFoundState = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mb-4 text-6xl text-gray-600">❓</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Peritaje no encontrado</h2>
      <p className="text-gray-600">No se pudo cargar la información del peritaje.</p>
    </div>
  </div>
);
