import { Button } from '@/components/atoms/Button';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NoConfirmedDamagesMessage } from '../components/NoConfirmedDamagesMessage';
import { OperationsInfoAlert } from '../components/OperationsInfoAlert';
import { PageShell } from '../components/PageShell';
import { RecommendedOperationCard } from '../components/RecommendedOperationCard';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { useWizardV2 } from '../hooks/useWizardV2';
import { DamageAction } from '../types';
import { useWizardV2 as useWizardV2Context } from '../context/WizardV2Context';
import { Damage } from '@/types/DamageAssessment';

const Operations = () => {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { state, loadAssessmentData } = useWizardV2();
  const { dispatch } = useWizardV2Context();

  const confirmedDamages = state.confirmedDamages || [];

  console.log('🔍 Operations Debug:', {
    assessmentId: state.assessmentId,
    confirmedDamagesCount: confirmedDamages.length,
    confirmedDamages: confirmedDamages,
    state: state,
  });

  useEffect(() => {
    if (state.assessmentId && !state.confirmedDamages?.length) {
      loadAssessmentData().catch((error: Error) => {
        console.error('Error cargando datos del assessment:', error);
      });
    }
  }, [state.assessmentId]);

  const handleUpdateOperation = (damageType: string, newOperation: DamageAction) => {
    if (!state.assessmentId) return;

    // ✅ ACTUALIZAR: Modificar el estado local con la nueva operación
    const updatedDamages = confirmedDamages.map((damage) => {
      if (damage.type === damageType) {
        return {
          ...damage,
          proposedOperation: {
            ...damage.proposedOperation,
            operation: newOperation,
          },
        };
      }
      return damage;
    });

    // ✅ ACTUALIZAR: Dispatch para actualizar el estado del contexto
    dispatch({
      type: 'CONFIRM_DAMAGES',
      payload: {
        ids: updatedDamages.map((d) => d._id || ''),
        damages: updatedDamages as unknown as Damage[],
      },
    });
  };

  const goValuation = async () => {
    try {
      setParams({ step: 'valuation' });
      navigate(`?step=valuation`, { replace: true });
    } catch (error) {
      console.error('Error navegando a valuation:', error);
      console.warn('Fallback: navegando a valuation después de error');
      setParams({ step: 'valuation' });
      navigate(`?step=valuation`, { replace: true });
    }
  };

  const handleGoBack = () => {
    setParams({ step: 'damages' });
    navigate(`?step=damages`, { replace: true });
  };

  if (confirmedDamages.length === 0) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav currentStep="operations" completedSteps={['intake', 'damages']} />
        }
        title="Operaciones de reparación"
        subtitle="Define las operaciones necesarias para cada daño confirmado"
        content={<NoConfirmedDamagesMessage onGoBack={handleGoBack} />}
      />
    );
  }

  return (
    <PageShell
      header={
        <WizardStepperWithNav currentStep="operations" completedSteps={['intake', 'damages']} />
      }
      title="Operaciones de reparación"
      subtitle="Define las operaciones necesarias para cada daño confirmado"
      content={
        <>
          <OperationsInfoAlert />

          <div className="space-y-4">
            {confirmedDamages.map((confirmedDamage) => {
              const proposedOperation = (confirmedDamage.proposedOperation?.operation ||
                confirmedDamage.action) as DamageAction;

              return (
                <RecommendedOperationCard
                  key={confirmedDamage._id}
                  damage={confirmedDamage}
                  proposedOperation={proposedOperation}
                  onUpdateOperation={handleUpdateOperation}
                />
              );
            })}
          </div>
        </>
      }
      footer={
        <div className="flex justify-end">
          <Button onClick={goValuation} className="px-6">
            Continuar a Valoración
          </Button>
        </div>
      }
    />
  );
};

export default Operations;
