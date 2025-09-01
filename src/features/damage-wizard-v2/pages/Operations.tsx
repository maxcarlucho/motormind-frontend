import { Button } from '@/components/atoms/Button';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NoConfirmedDamagesMessage } from '../components/NoConfirmedDamagesMessage';
import { OperationsInfoAlert } from '../components/OperationsInfoAlert';
import { PageShell } from '../components/PageShell';
import { RecommendedOperationCard } from '../components/RecommendedOperationCard';
import { DamageOperationsGroup } from '../components/DamageOperationsGroup';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { useWizardV2 } from '../hooks/useWizardV2';
import { useWizardV2 as useWizardV2Context } from '../context/WizardV2Context';
import { DamageAction } from '../types';
import { Damage } from '@/types/DamageAssessment';
import apiService from '@/service/api.service';

const Operations = () => {
  const navigate = useNavigate();

  const { state } = useWizardV2();
  const { dispatch } = useWizardV2Context();

  const confirmedDamages = useMemo(() => state.confirmedDamages || [], [state.confirmedDamages]);

  const handleUpdateOperation = async (damageId: string, newOperation: DamageAction) => {
    if (!state.assessmentId) return;

    try {
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

      // ✅ NUEVO: Trackear operación modificada (sin hacer request al backend)
      dispatch({
        type: 'UPDATE_OPERATION',
        payload: { damageId, operation: newOperation },
      });
    } catch (error) {
      console.error(`Error al actualizar la operación de daño ${damageId}:`, error);
    }
  };

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
      // ✅ NUEVO: Verificar si hay operaciones modificadas
      const modifiedOperations = state.modifiedOperations;

      if (modifiedOperations && Object.keys(modifiedOperations).length > 0) {
        // ✅ NUEVO: Guardar todas las operaciones modificadas en paralelo
        const updatePromises = Object.entries(modifiedOperations).map(([damageId, operation]) =>
          apiService.updateDamage(state.assessmentId!, damageId, {
            proposedOperation: {
              operation: operation as DamageAction,
              confidence: 0.85,
              reason: `Operación actualizada manualmente a ${operation}`,
              source: 'rule_engine',
            },
          }),
        );

        // ✅ NUEVO: Esperar a que todas las actualizaciones terminen
        await Promise.all(updatePromises);

        // ✅ NUEVO: Limpiar operaciones modificadas del estado
        dispatch({ type: 'CLEAR_MODIFIED_OPERATIONS' });
      }

      navigate(`?step=valuation`, { replace: true });
    } catch (error) {
      console.error('Error navegando a valuation:', error);

      navigate(`?step=valuation`, { replace: true });
    }
  };

  const handleGoBack = () => {
    navigate(`?step=damages`, { replace: true });
  };

  if (confirmedDamages.length === 0) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="operations"
            completedSteps={['intake', 'damages']}
            loading={state.loading}
          />
        }
        title="Operaciones de reparación"
        subtitle="Define las operaciones necesarias para cada daño confirmado"
        loading={state.loading}
        loadingTitle="Cargando operaciones"
        loadingDescription="Estamos cargando las operaciones de reparación"
        content={<NoConfirmedDamagesMessage onGoBack={handleGoBack} />}
      />
    );
  }

  return (
    <PageShell
      header={
        <WizardStepperWithNav
          currentStep="operations"
          completedSteps={['intake', 'damages']}
          loading={state.loading}
        />
      }
      title="Operaciones de reparación"
      subtitle="Define las operaciones necesarias para cada daño confirmado"
      loading={state.loading}
      loadingTitle="Guardando operaciones"
      loadingDescription="Estamos guardando las operaciones de reparación definidas"
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
