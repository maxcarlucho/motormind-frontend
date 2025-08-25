import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWizardV2 } from '../hooks/useWizardV2';
import { useReadOnlyMode } from '../hooks/useReadOnlyMode';
import { PageShell } from '../components/PageShell';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { DamageCard } from '../components/DamageCard';
import { ConfirmDamagesActions } from '../components/ConfirmDamagesActions';
import { ProgressCard } from '../components/ProgressCard';
import { ReadOnlyBanner } from '../components/ReadOnlyBanner';
import { adaptBackendDamagesResponse } from '../adapters/damageAdapter';
import { BackendDamage } from '../types/backend.types';
import damagesMock from '../mocks/damages.json';
import { AddManualDamageModal } from '../components/AddManualDamageModal';
import { damageTypeMap } from '@/types/shared/damage.types';

// Mapeo de severidades del backend al frontend (mismo que en adapter)
const severityMap: Record<string, 'leve' | 'medio' | 'grave'> = {
  SEV1: 'leve',
  SEV2: 'leve',
  SEV3: 'medio',
  SEV4: 'grave',
  SEV5: 'grave',
};

const Damages = () => {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { state, confirmDamages, createManualDamage } = useWizardV2();
  const { isReadOnly, continueFromHere } = useReadOnlyMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDamages, setSelectedDamages] = useState<string[]>([]);
  const [showOnlyConfident, setShowOnlyConfident] = useState(false);
  const [showAddDamageModal, setShowAddDamageModal] = useState(false);
  const [isAddingDamage, setIsAddingDamage] = useState(false);

  useEffect(() => {
    if (
      state.detectedDamages &&
      state.detectedDamages.detectedDamages &&
      state.detectedDamages.detectedDamages.length > 0
    ) {
      setIsProcessing(false);
      setProgress(100);
      return;
    }

    if (state.status === 'processing') {
      setIsProcessing(true);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    }

    if (!state.detectedDamages) {
      setIsProcessing(true);
      setProgress(0);
    }
  }, [state.detectedDamages, state.status, isProcessing]);

  const toggleDamage = (id: string) => {
    if (isReadOnly) return;
    setSelectedDamages((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const confirmAll = () => {
    const allIds = damagesData.map((d) => d.id);
    setSelectedDamages(allIds);
  };

  const confirmSelected = async () => {
    if (isReadOnly) {
      continueFromHere();
      return;
    }

    try {
      if (adaptedDamagesWithMeta) {
        const backendIds = selectedDamages; // Usar IDs directamente
        console.log('🔄 IDs finales para enviar al backend:', backendIds);
        await confirmDamages(backendIds);
      } else {
        await confirmDamages(selectedDamages);
      }

      setParams({ step: 'operations' });
      navigate(`?step=operations`, { replace: true });
    } catch (error) {
      console.error('Error confirming damages:', error);
      console.warn('Fallback: navegando a operations después de error');
      setParams({ step: 'operations' });
      navigate(`?step=operations`, { replace: true });
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

  const { damagesData, adaptedDamagesWithMeta } = (() => {
    if (
      state.detectedDamages &&
      state.detectedDamages.detectedDamages &&
      state.detectedDamages.detectedDamages.length > 0
    ) {
      const backendResponse = state.detectedDamages;
      const adaptedDamagesRaw = adaptBackendDamagesResponse(backendResponse);

      const userCreatedDamagesRaw = (state.userCreatedDamages || []).map((damage, index) => ({
        id: damage._id || `user_${index}`,
        zone: damage.area,
        subzone: damage.subarea || '',
        type: damageTypeMap[damage.type] || damage.type, // ✅ NUEVO: Mapear tipo de daño
        severity: severityMap[damage.severity] || 'medio', // ✅ NUEVO: Usar mapeo correcto
        confidence: damage.confidence || 1.0,
        imageUrl: damage.evidences?.[0]?.originalUrl || '',
        status: (selectedDamages.includes(damage._id || `user_${index}`)
          ? 'confirmed'
          : 'pending') as 'confirmed' | 'pending',
        __originalData: damage,
        __originalIndex: index,
        __isUserCreated: true,
      }));

      // ✅ NUEVO: Unir daños externos y daños creados por usuario
      const allDamages = [...adaptedDamagesRaw, ...userCreatedDamagesRaw];

      // Aplicar estados de selección con tipado correcto
      const damagesData = allDamages.map((damage) => ({
        id: damage.id,
        zone: damage.zone,
        subzone: damage.subzone,
        type: damage.type,
        severity: damage.severity, // ✅ Ya está mapeado correctamente por el adapter
        confidence: damage.confidence,
        imageUrl: damage.imageUrl,
        status: (selectedDamages.includes(damage.id) ? 'confirmed' : 'pending') as
          | 'confirmed'
          | 'pending',
        isUserCreated: (damage as { __isUserCreated?: boolean }).__isUserCreated || false, // ✅ NUEVO: Flag para UI
      }));

      // Convertir a formato esperado por mapFrontendIdsToBackendIds
      const adaptedDamagesWithMeta = allDamages.map((damage) => ({
        id: damage.id,
        __originalData: damage.__originalData as BackendDamage,
      }));

      return { damagesData, adaptedDamagesWithMeta };
    }

    // Fallback a datos mock
    const damagesData = damagesMock.damages.map((d) => ({
      id: d.id,
      zone: d.title,
      subzone: d.subtitle,
      type: 'Daño detectado',
      severity: d.severity as 'leve' | 'medio' | 'grave',
      confidence: d.confidencePct || 85,
      imageUrl: d.imageUrl,
      status: (selectedDamages.includes(d.id) ? 'confirmed' : 'pending') as 'confirmed' | 'pending',
      isUserCreated: false,
    }));

    return { damagesData, adaptedDamagesWithMeta: null };
  })();

  const filteredDamages = showOnlyConfident
    ? damagesData.filter((d) => d.confidence && d.confidence * 100 > 85)
    : damagesData;

  // Si está procesando, mostrar ProgressCard como contenido del layout
  if (isProcessing) {
    return (
      <PageShell
        header={<WizardStepperWithNav currentStep="damages" completedSteps={['intake']} />}
        content={
          <ProgressCard
            title="Detectando daños"
            description="Estamos procesando las imágenes... esto puede tardar unos minutos."
            progress={progress}
          />
        }
      />
    );
  }

  return (
    <>
      <PageShell
        header={<WizardStepperWithNav currentStep="damages" completedSteps={['intake']} />}
        title="Verificación de Daños"
        subtitle="Seleccioná los daños que se detectaron en las imágenes."
        content={
          <>
            {isReadOnly && <ReadOnlyBanner />}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDamages.map((damage) => (
                <DamageCard
                  key={damage.id}
                  damage={damage}
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
            totalDamagesCount={damagesData.length}
            showOnlyConfident={showOnlyConfident}
            onAddDamage={() => setShowAddDamageModal(true)}
            onToggleConfidentFilter={() => setShowOnlyConfident(!showOnlyConfident)}
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
