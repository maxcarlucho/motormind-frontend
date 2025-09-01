import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Upload } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { useWizardV2 } from '../hooks/useWizardV2';
import { useWizardStepNav } from '../nav';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCarSearch } from '@/hooks/useCarSearch';
import { PageShell } from '../components/PageShell';
import { ReadOnlyBanner } from '../components/ReadOnlyBanner';
import { SectionPaper } from '../components/SectionPaper';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { DragZone } from '../components/DragZone';
import { ImagePreview } from '../components/ImagePreview';

const Intake = () => {
  const navigate = useNavigate();
  const [,] = useSearchParams();
  const { state, startIntake } = useWizardV2();
  const { mode, continueFromHere } = useWizardStepNav();
  const isReadOnly = mode === 'view';
  const { upload, isLoading: isUploading } = useFileUpload();
  const { searchCar, isLoading: isSearchingCar, error: carSearchError } = useCarSearch();

  // Usar datos del contexto si existen, sino estado local
  const [plate, setPlate] = useState(state.plate || '');
  const [claim, setClaim] = useState(state.claimDescription || '');

  // Sincronizar con el contexto cuando cambia
  useEffect(() => {
    if (state.plate && state.plate !== plate) {
      setPlate(state.plate);
    }
  }, [state.plate, plate]);

  useEffect(() => {
    if (state.claimDescription && state.claimDescription !== claim) {
      setClaim(state.claimDescription);
    }
  }, [state.claimDescription, claim]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determinar si es un assessment existente o nuevo
  const isExistingAssessment = !!state.assessmentId && state.assessmentId !== 'new';

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createAssessment = async () => {
    try {
      setIsProcessing(true);

      // 1. Buscar/crear el coche primero (como en el flujo original)
      console.log('🔍 Buscando/creando coche por matrícula:', plate);
      const car = await searchCar({ plate: plate.toUpperCase() });
      console.log('✅ Coche encontrado/creado:', car);

      // 2. Subir imágenes con el carId (si hay alguna)
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        console.log('📤 Subiendo imágenes con carId:', car._id);
        const uploadResult = await upload(selectedFiles, { carId: car._id }, 'damage-assessment');
        imageUrls = uploadResult.keys;
        console.log('✅ Imágenes subidas:', imageUrls);
      }

      // 3. Crear el assessment con las URLs reales y el carId
      const assessmentId = await startIntake({
        plate: plate.toUpperCase(),
        claimDescription: claim,
        images: imageUrls,
      });

      // Navegar con el ID real del assessment
      navigate(`/damage-assessments/${assessmentId}/wizard-v2?step=damages`, { replace: true });
    } catch (error) {
      console.error('❌ Error creando assessment:', error);
      // Mostrar error específico según el paso que falló
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const isValid = plate.trim().length > 0 && claim.trim().length > 0;

  // Si está procesando, mostrar como paso 2 (damages) con stepper visible
  if (isProcessing) {
    return (
      <PageShell
        header={<WizardStepperWithNav currentStep="damages" completedSteps={['intake']} />}
        loading={true}
        loadingTitle="Detectando daños"
        loadingDescription="Estamos procesando las imágenes... esto puede tardar unos minutos."
        content={<div />}
      />
    );
  }

  return (
    <PageShell
      header={<WizardStepperWithNav currentStep="intake" completedSteps={[]} />}
      title="Datos iniciales del vehículo"
      subtitle="Ingresá la matrícula y una breve descripción del siniestro. Podés subir fotos ahora o más tarde."
      loading={state.loading}
      loadingTitle="Creando peritaje"
      loadingDescription="Estamos creando tu peritaje con los datos proporcionados"
      content={
        <>
          {isReadOnly && <ReadOnlyBanner />}
          {/* Vehicle Data Section */}
          <SectionPaper title="Datos del Vehículo" icon={<Car className="h-5 w-5" />}>
            <div className="grid gap-4">
              <div>
                <label className="text-card-foreground mb-1 block text-sm font-medium">
                  Matrícula
                </label>
                <Input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="AA123BB"
                  maxLength={10}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-card-foreground mb-1 block text-sm font-medium">
                  Siniestro
                </label>
                <Textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Ej.: Impacto lateral en puerta delantera izquierda."
                  maxLength={500}
                  rows={4}
                  className="bg-background"
                  disabled={isReadOnly}
                />
                <div className="text-muted-foreground mt-2 ml-auto w-fit text-xs">
                  {claim.length}/500
                </div>
                {carSearchError && (
                  <div className="mt-2 text-sm text-red-600">Error: {carSearchError}</div>
                )}
              </div>
            </div>
          </SectionPaper>

          {/* Image Upload Section */}
          <SectionPaper title="Subir imágenes del vehículo" icon={<Upload className="h-5 w-5" />}>
            <DragZone onFilesSelected={handleFilesSelected} />
            <ImagePreview files={selectedFiles} onRemoveImage={removeImage} />

            {/* Mostrar imágenes del contexto si existen */}
            {state.images && state.images.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">
                  Imágenes del assessment ({state.images.length})
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {state.images.map((imageUrl, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={imageUrl}
                        alt={`Imagen ${index + 1}`}
                        className="border-border h-24 w-full rounded-lg border object-cover"
                      />
                      <p className="text-muted-foreground mt-1 truncate text-xs">
                        Imagen {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionPaper>
        </>
      }
      footer={
        <div className="flex justify-end">
          <Button
            onClick={isReadOnly ? continueFromHere : createAssessment}
            disabled={!isReadOnly && (!isValid || isUploading || isSearchingCar)}
            className="px-6"
          >
            {isReadOnly || isExistingAssessment ? 'Continuar' : 'Crear assessment'}
          </Button>
        </div>
      }
    />
  );
};

export default Intake;
