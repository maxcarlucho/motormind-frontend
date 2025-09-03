import React, { useState } from 'react';
import { WizardStepperMobile } from './WizardStepperMobile';
import { WizardStepKey } from '../types';

/**
 * Ejemplo de uso del WizardStepperMobile
 * Este archivo es solo para demostración y testing
 */
export const WizardStepperMobileExample: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStepKey>('intake');
  const [completedSteps, setCompletedSteps] = useState<WizardStepKey[]>([]);

  const handleStepClick = (step: WizardStepKey) => {
    console.log('Navegando a:', step);
    setCurrentStep(step);
  };

  const handleCompleteCurrentStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const handleReset = () => {
    setCurrentStep('intake');
    setCompletedSteps([]);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          WizardStepperMobile - Ejemplo de Uso
        </h1>
        
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Estado Actual</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Paso actual:</strong> {currentStep}</p>
            <p><strong>Pasos completados:</strong> {completedSteps.join(', ') || 'Ninguno'}</p>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Controles</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentStep('intake')}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Ir a Intake
            </button>
            <button
              onClick={() => setCurrentStep('damages')}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Ir a Daños
            </button>
            <button
              onClick={() => setCurrentStep('operations')}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Ir a Operaciones
            </button>
            <button
              onClick={() => setCurrentStep('valuation')}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Ir a Valoración
            </button>
            <button
              onClick={() => setCurrentStep('finalize')}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Ir a Finalizar
            </button>
            <button
              onClick={handleCompleteCurrentStep}
              className="px-3 py-2 bg-success text-success-foreground rounded-md text-sm"
            >
              Completar Paso Actual
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* WizardStepperMobile */}
        <div className="bg-card rounded-lg border">
          <h2 className="text-lg font-semibold p-4 border-b">WizardStepperMobile</h2>
          <WizardStepperMobile
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Instrucciones */}
        <div className="bg-muted rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Instrucciones</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Mobile:</strong> Reducir el ancho de la ventana para ver la vista mobile</li>
            <li>• <strong>Desktop:</strong> Ancho normal para ver el stepper completo</li>
            <li>• <strong>Navegación:</strong> Click en los pasos para navegar</li>
            <li>• <strong>Progreso:</strong> La barra de progreso se actualiza automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
