import { useWizardStepNav, STEP_ORDER } from '../nav';
import { WizardStepperMobile } from './WizardStepperMobile';
import { WizardStepKey } from '../types';

interface WizardStepperWithNavProps {
  currentStep: WizardStepKey;
  completedSteps?: WizardStepKey[];
  loading?: boolean;
  isNavigationLocked?: boolean;
}

export const WizardStepperWithNav: React.FC<WizardStepperWithNavProps> = ({
  currentStep,
  completedSteps = [],
  loading = false,
  isNavigationLocked = false,
}) => {
  const { canGoTo, goTo } = useWizardStepNav();

  const handleStepClick = (step: WizardStepKey) => {
    if (isNavigationLocked) return;

    // Siempre permitir navegación hacia atrás
    const stepIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(currentStep);

    // Permitir navegar hacia atrás siempre, hacia adelante solo si canGoTo permite
    if (stepIndex < currentIndex || canGoTo(step)) {
      goTo(step);
    }
  };

  return (
    <WizardStepperMobile
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      loading={loading}
      isNavigationLocked={isNavigationLocked}
    />
  );
};
