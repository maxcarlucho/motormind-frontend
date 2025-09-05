import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddManualDamageModal } from '../components/AddManualDamageModal';
import { ConfirmDamagesActions } from '../components/ConfirmDamagesActions';
import { DamageCard } from '../components/DamageCard';
import { PageShell } from '../components/PageShell';
import { ReadOnlyBanner } from '../components/ReadOnlyBanner';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { useWizardStepNav } from '../nav';
import { useWizardV2 } from '../hooks/useWizardV2';

const Damages = () => {
  const navigate = useNavigate();

  const { state, confirmDamages, createManualDamage, setGeneratingOperations } = useWizardV2();
  const { mode, continueFromHere } = useWizardStepNav();
  const isReadOnly = mode === 'view';
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDamages, setSelectedDamages] = useState<string[]>([]);
  const [showAddDamageModal, setShowAddDamageModal] = useState(false);
  const [isAddingDamage, setIsAddingDamage] = useState(false);

  useEffect(() => {
    if (
      state.detectedDamages &&
      state.detectedDamages.detectedDamages &&
      state.detectedDamages.detectedDamages.length > 0
    ) {
      setIsProcessing(false);
      return;
    }

    if (state.status === 'processing') {
      setIsProcessing(true);
    }

    if (!state.detectedDamages) {
      setIsProcessing(true);
    }
  }, [state.detectedDamages, state.status, isProcessing]);

  useEffect(() => {
    if (state.confirmedDamages?.length) {
      setSelectedDamages(state.confirmedDamages.map((d) => d._id));
    }
  }, [state.confirmedDamages]);

  const toggleDamage = (id: string) => {
    if (isReadOnly) return;
    setSelectedDamages((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const confirmAll = () => {
    const allIds = [
      ...(state.detectedDamages?.detectedDamages.map((d) => d._id) || []),
      ...(state.userCreatedDamages?.map((d) => d._id) || []),
    ];
    setSelectedDamages(allIds);
  };

  const confirmSelected = async () => {
    if (isReadOnly) {
      continueFromHere();
      return;
    }

    const confirmedIds = state.confirmedDamages?.map((d) => d._id) || [];
    const noChangesInSelection =
      confirmedIds.length === selectedDamages.length &&
      confirmedIds.every((id) => selectedDamages.includes(id)) &&
      selectedDamages.every((id) => confirmedIds.includes(id));

    if (noChangesInSelection) {
      navigate(`?step=operations`, { replace: true });
      return;
    }

    try {
      setGeneratingOperations(true);
      await confirmDamages(selectedDamages);
      navigate(`?step=operations`, { replace: true });
    } catch (error) {
      console.error('Error confirming damages:', error);
      navigate(`?step=operations`, { replace: true });
    } finally {
      setGeneratingOperations(false);
    }
  };

  const handleAddManualDamage = async (damageData: {
    area?: string;
    subarea?: string;
    type: string;
    severity: string;
    description?: string;
    imageUrl?: string;
  }) => {
    try {
      setIsAddingDamage(true);
      await createManualDamage(damageData);
      setShowAddDamageModal(false);
    } catch (error) {
      console.error('Error adding manual damage:', error);
    } finally {
      setIsAddingDamage(false);
    }
  };

  const filteredDamages = [
    ...(state.detectedDamages?.detectedDamages || []),
    ...(state.userCreatedDamages || []),
  ];

  if (isProcessing || state.isGeneratingOperations) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="damages"
            completedSteps={['intake']}
            loading={true}
            isNavigationLocked={state.isGeneratingOperations}
          />
        }
        loading={true}
        loadingTitle={state.isGeneratingOperations ? 'Generando operaciones' : 'Detectando daños'}
        loadingDescription={
          state.isGeneratingOperations
            ? 'Estamos analizando los daños y generando las operaciones recomendadas...'
            : 'Estamos procesando las imágenes... esto puede tardar unos minutos.'
        }
        content={<div />}
      />
    );
  }

  return (
    <>
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="damages"
            completedSteps={['intake']}
            isNavigationLocked={state.isGeneratingOperations}
          />
        }
        title="Verificación de Daños"
        subtitle="Seleccioná los daños que se detectaron en las imágenes."
        content={
          <>
            {isReadOnly && <ReadOnlyBanner />}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDamages.map((damage) => (
                <DamageCard
                  key={damage._id}
                  damage={damage}
                  isConfirmed={
                    state.confirmedDamages?.some((d) => d._id === damage._id) ||
                    selectedDamages.includes(damage._id) ||
                    false
                  }
                  isUserCreated={
                    state.userCreatedDamages?.some((d) => d._id === damage._id) || false
                  }
                  onStatusChange={(id, status) => {
                    if (isReadOnly) return;
                    if (status === 'confirmed') {
                      toggleDamage(id);
                    } else {
                      setSelectedDamages((prev) => prev.filter((selectedId) => selectedId !== id));
                    }
                  }}
                />
              ))}
            </div>
          </>
        }
        footer={
          <ConfirmDamagesActions
            isReadOnly={isReadOnly}
            selectedDamagesCount={selectedDamages.length}
            totalDamagesCount={
              (state.detectedDamages?.detectedDamages?.length || 0) +
              (state.userCreatedDamages?.length || 0)
            }
            onAddDamage={() => setShowAddDamageModal(true)}
            onConfirmAll={confirmAll}
            onConfirmSelected={confirmSelected}
          />
        }
      />

      {/* Modal para agregar daño manual */}
      <AddManualDamageModal
        isOpen={showAddDamageModal}
        onClose={() => setShowAddDamageModal(false)}
        onAddDamage={handleAddManualDamage}
        isAdding={isAddingDamage}
      />
    </>
  );
};

export default Damages;
