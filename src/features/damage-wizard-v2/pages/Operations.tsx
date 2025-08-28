import { Button } from '@/components/atoms/Button';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NoConfirmedDamagesMessage } from '../components/NoConfirmedDamagesMessage';
import { OperationsInfoAlert } from '../components/OperationsInfoAlert';
import { PageShell } from '../components/PageShell';
import { RecommendedOperationCard } from '../components/RecommendedOperationCard';
import { DamageOperationsGroup } from '../components/DamageOperationsGroup';
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

  const handleUpdateOperation = (damageId: string, newOperation: DamageAction) => {
    if (!state.assessmentId) return;

    // ✅ CORREGIDO: Usar _id único en lugar de type
    const updatedDamages = confirmedDamages.map((damage) => {
      if (damage._id === damageId) {
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

  // ✅ NUEVO: Agrupar daños por pieza
  const groupedDamages = useMemo(() => {
    const groups: Record<string, { title: string; items: Damage[] }> = {};

    confirmedDamages.forEach((damage) => {
      // Crear clave de grupo basada en área y subárea
      const groupKey = `${damage.area}-${damage.subarea || ''}`;
      const groupTitle = damage.partLabel || `${damage.area} - ${damage.subarea || 'Parte'}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          items: [],
        };
      }

      groups[groupKey].items.push(damage);
    });

    // Ordenar grupos por título
    return Object.entries(groups)
      .sort(([, a], [, b]) => a.title.localeCompare(b.title))
      .map(([key, group]) => ({ key, ...group }));
  }, [confirmedDamages]);

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

          <div className="space-y-8">
            {groupedDamages.map((group) => {
              // ✅ NUEVO: Verificar si hay sustitución activa en el grupo
              const isSubstitutionActive = group.items.some(
                (damage) => damage.proposedOperation?.operation === 'REPLACE',
              );

              return (
                <DamageOperationsGroup
                  key={group.key}
                  title={group.title}
                  count={group.items.length}
                  isSubstitutionActive={isSubstitutionActive}
                >
                  {group.items.map((confirmedDamage) => {
                    const proposedOperation = (confirmedDamage.proposedOperation?.operation ||
                      confirmedDamage.action) as DamageAction;

                    // ✅ NUEVO: Determinar si la card está deshabilitada
                    const isDisabled = isSubstitutionActive && proposedOperation !== 'REPLACE';

                    return (
                      <RecommendedOperationCard
                        key={confirmedDamage._id}
                        damage={confirmedDamage}
                        proposedOperation={proposedOperation}
                        onUpdateOperation={handleUpdateOperation}
                        disabled={isDisabled}
                        hideTitle={true} // ✅ NUEVO: Ocultar título ya que está en el header del grupo
                      />
                    );
                  })}
                </DamageOperationsGroup>
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
