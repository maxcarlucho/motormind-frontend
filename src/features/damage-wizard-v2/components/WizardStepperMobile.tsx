import { cn } from '@/utils/cn';
import { WizardStepKey } from '../types';

interface Step {
  key: WizardStepKey;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { key: 'intake', label: 'Datos Iniciales', description: 'Subir imágenes y datos del vehículo' },
  { key: 'damages', label: 'Daños', description: 'Revisar y confirmar daños detectados' },
  { key: 'operations', label: 'Operaciones', description: 'Definir operaciones de reparación' },
  { key: 'valuation', label: 'Valoración', description: 'Revisar costes y precios finales' },
  {
    key: 'finalize',
    label: 'Finalizar',
    description: 'Completar evaluación y generar presupuesto',
  },
];

interface WizardStepperMobileProps {
  currentStep: WizardStepKey;
  onStepClick?: (step: WizardStepKey) => void;
  completedSteps?: WizardStepKey[];
  /** Disable all interactions when loading */
  loading?: boolean;
  /** Disable navigation when locked */
  isNavigationLocked?: boolean;
}

export const WizardStepperMobile = ({
  currentStep,
  onStepClick,
  completedSteps = [],
  loading = false,
  isNavigationLocked = false,
}: WizardStepperMobileProps) => {
  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStep);
  const currentStepData = STEPS[currentStepIndex];

  const getStepStatus = (stepIndex: number) => {
    const stepKey = STEPS[stepIndex].key;

    // Si el paso está completado (según completedSteps o es anterior al actual)
    if (completedSteps.includes(stepKey) || stepIndex < currentStepIndex) {
      return 'completed';
    }

    // Si es el paso actual
    if (stepIndex === currentStepIndex) {
      return 'current';
    }

    // Si es un paso futuro
    return 'upcoming';
  };

  return (
    <div className="bg-card border-border border-b">
      <div className="mx-auto max-w-7xl p-4">
        {/* Mobile: Show only current step */}
        <div className="md:hidden">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  getStepStatus(currentStepIndex) === 'completed' &&
                    'bg-success text-success-foreground',
                  getStepStatus(currentStepIndex) === 'current' &&
                    'bg-primary text-primary-foreground',
                  getStepStatus(currentStepIndex) === 'upcoming' &&
                    'bg-muted text-muted-foreground border-border border',
                )}
              >
                {getStepStatus(currentStepIndex) === 'completed' ? '✓' : currentStepIndex + 1}
              </div>
              <div>
                <p className="text-primary text-sm font-medium">{currentStepData.label}</p>
                <p className="text-xs">
                  Paso {currentStepIndex + 1} de {STEPS.length}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-card border-border h-2 w-full rounded-full border">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Show full stepper (hidden on mobile) */}
        <div className="hidden md:block">
          <div
            className={cn(
              'flex items-center justify-center transition-opacity',
              loading && 'pointer-events-none opacity-60',
            )}
          >
            {STEPS.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable =
                onStepClick &&
                !loading &&
                !isNavigationLocked &&
                (status === 'completed' || status === 'current' || index < currentStepIndex);

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3 transition-colors',
                      status === 'current' && 'bg-primary-muted/20 border-primary-muted',
                      status === 'completed' && 'bg-success-muted/20',
                      isClickable && 'hover:bg-muted/50 cursor-pointer',
                      !isClickable && 'cursor-default',
                    )}
                    onClick={isClickable ? () => onStepClick(step.key) : undefined}
                  >
                    {/* Step Icon */}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                        status === 'completed' && 'bg-success text-success-foreground',
                        status === 'current' && 'bg-primary text-primary-foreground',
                        status === 'upcoming' &&
                          'bg-muted text-muted-foreground border-border border',
                      )}
                    >
                      {status === 'completed' ? '✓' : index + 1}
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          status === 'current' && 'text-primary',
                          status === 'completed' && 'text-success',
                          status === 'upcoming' && 'text-muted',
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-muted truncate text-xs">{step.description}</p>
                    </div>
                  </div>

                  {/* Arrow between steps */}
                  {index < STEPS.length - 1 && (
                    <div className="text-muted-foreground mx-2 h-4 w-4 flex-shrink-0">→</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
