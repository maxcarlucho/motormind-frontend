import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { useWizardV2 } from '../hooks/useWizardV2';
import { PageShell } from '../components/PageShell';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { useSnackbar } from 'notistack';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BackendLaborOutput,
  BackendPaintWork,
  BackendDamageAssessment,
} from '../types/backend.types';
import { operationLabels } from '@/types/DamageAssessment';
import { ValuationCostsSummary } from '../components/ValuationCostsSummary';
import { FinalizeLaborTable } from '../components/FinalizeLaborTable';
import { FinalizePaintTable } from '../components/FinalizePaintTable';
import { FinalizePartsTable } from '../components/FinalizePartsTable';

const getOperationLabel = (operationCode: string): string => {
  return operationLabels[operationCode] || operationCode;
};

// Helper para verificar si el assessment puede finalizar
const canFinalizeAssessment = (valuation: BackendDamageAssessment | undefined): boolean => {
  return Boolean(
    valuation &&
      (valuation.workflow?.status === 'valuated' || valuation.workflow?.status === 'completed'),
  );
};

// Helper para determinar si está cargando datos
const isDataLoading = (
  isInitialLoading: boolean,
  stateLoading: boolean,
  assessmentId?: string,
  valuation?: BackendDamageAssessment,
): boolean => {
  return Boolean(isInitialLoading || stateLoading || (assessmentId && !valuation));
};

// Helper para procesar datos de mano de obra (sin pintura)
const processLaborData = (laborOutput?: BackendLaborOutput[]) => {
  if (!laborOutput) return [];

  return laborOutput
    .filter((item: BackendLaborOutput) => {
      // Solo operaciones de Sustituir/Reparar (sin pintar)
      const operation = item.mainOperation?.operation;
      return operation === 'REPLACE' || operation === 'REPAIR';
    })
    .map((item: BackendLaborOutput) => ({
      operation: `${getOperationLabel(item.mainOperation?.operation || 'REPAIR')} - ${item.partName}`,
      hours: `${item.mainOperation?.estimatedHours || 0}h`,
      rate: 42, // Rate fijo por ahora
      total: (item.mainOperation?.estimatedHours || 0) * 42,
    }));
};

// Helper para procesar datos de pintura
const processPaintData = (paintWorks?: BackendPaintWork[]) => {
  if (!paintWorks) return [];

  const paintDataArray: Array<{
    type: 'labor' | 'material';
    description: string;
    hours?: string;
    rate?: number;
    quantity?: string;
    unitCost?: number;
    total: number;
  }> = [];

  // Agrupar datos de mano de obra por pieza
  const laborByPart = new Map<string, { hours: number; rate: number; total: number }>();
  paintWorks.forEach((item: BackendPaintWork) => {
    const partName = item.partName || 'Pieza sin nombre';
    const hours = item.labor?.hours || 0;
    const rate = item.labor?.hourlyRate || 0;
    const total = item.labor?.total || 0;

    if (laborByPart.has(partName)) {
      const existing = laborByPart.get(partName)!;
      existing.hours += hours;
      existing.total += total;
      existing.rate = (existing.rate + rate) / 2;
    } else {
      laborByPart.set(partName, { hours, rate, total });
    }
  });

  // Agregar datos agrupados de mano de obra de pintura
  laborByPart.forEach((data, partName) => {
    paintDataArray.push({
      type: 'labor',
      description: `Pintar ${partName}`,
      hours: `${data.hours.toFixed(2)}h`,
      rate: data.rate,
      total: data.total,
    });
  });

  // Agrupar datos de materiales por pieza
  const materialsByPart = new Map<string, { units: number; unitCost: number; total: number }>();
  paintWorks.forEach((item: BackendPaintWork) => {
    const partName = item.partName || 'Pieza sin nombre';
    const unitCost = item.materials?.unitPrice || 0;
    const total = item.materials?.total || 0;

    if (materialsByPart.has(partName)) {
      const existing = materialsByPart.get(partName)!;
      existing.total += total;
      existing.unitCost = (existing.unitCost + unitCost) / 2;
    } else {
      materialsByPart.set(partName, { units: 1, unitCost, total });
    }
  });

  // Agregar datos agrupados de materiales
  materialsByPart.forEach((data, partName) => {
    paintDataArray.push({
      type: 'material',
      description: `Materiales para ${partName}`,
      quantity: `${data.units.toFixed(2)}`,
      unitCost: data.unitCost,
      total: data.total,
    });
  });

  return paintDataArray;
};

// Helper para procesar datos de recambios
const processPartsData = (parts?: Record<string, unknown>[]) => {
  if (!parts) return [];

  return parts.map((item: Record<string, unknown>) => ({
    ref: (item.ref as string) || 'REF-001',
    partName: (item.partName as string) || 'Pieza',
    unitPrice: (item.unitPrice as number) || 0,
    qty: (item.qty as number) || 1,
    total: (item.total as number) || 0,
  }));
};

// STEPPER FIJO - Definido fuera del componente para evitar re-renders
const FIXED_STEPPER = (
  <WizardStepperWithNav
    currentStep="finalize"
    completedSteps={['intake', 'damages', 'operations', 'valuation']}
    loading={false} // Nunca loading para evitar flicker
  />
);

const Finalize = () => {
  const navigate = useNavigate();
  const { state, loadAssessmentData } = useWizardV2();
  const { enqueueSnackbar } = useSnackbar();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Cargar datos del assessment al montar el componente
  useEffect(() => {
    let isCancelled = false;

    // Si ya tenemos los datos de valoración, no cargar de nuevo
    if (state.valuation) {
      setIsInitialLoading(false);
      return;
    }

    if (state.assessmentId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsInitialLoading(true);
      loadAssessmentData()
        .then(() => {
          if (!isCancelled) {
            setIsInitialLoading(false);
          }
        })
        .catch((error: unknown) => {
          if (!isCancelled) {
            console.error('Error cargando datos del assessment:', error);
            setIsInitialLoading(false);
            hasLoadedRef.current = false; // Permitir reintentos en caso de error
          }
        });
    } else if (!state.assessmentId) {
      setIsInitialLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [state.assessmentId]);

  // Estados derivados - Simplificados para evitar flicker
  const canFinalize = canFinalizeAssessment(state.valuation);
  
  // Solo mostrar loading si realmente no tenemos datos Y tenemos un assessmentId válido
  // Si no hay assessmentId, no mostrar loading (evita el primer render con loading)
  const isLoadingData = Boolean(
    state.assessmentId && 
    state.assessmentId.length > 0 && 
    !state.valuation && 
    !state.error
  );



  // Procesar datos para las tablas
  const laborData = processLaborData(state.valuation?.laborOutput);

  const paintData = processPaintData(state.valuation?.paintWorks);
  const partsData = processPartsData(state.valuation?.parts);

  // Calcular totales
  const laborTotal = laborData.reduce((sum, item) => sum + item.total, 0);
  const paintLaborTotal = paintData
    .filter((item) => item.type === 'labor')
    .reduce((sum, item) => sum + item.total, 0);
  const paintMaterialsTotal = paintData
    .filter((item) => item.type === 'material')
    .reduce((sum, item) => sum + item.total, 0);
  const partsTotal = partsData.reduce((sum, item) => sum + item.total, 0);

  const handleDownloadPdf = async () => {
    const input = contentRef.current;
    if (!input) return;

    try {
      setIsGeneratingPDF(true);
      enqueueSnackbar('Generando PDF...', { variant: 'info' });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Clonar el elemento para aplicar estilos compatibles
      const clonedElement = input.cloneNode(true) as HTMLElement;

      // Aplicar estilos compatibles con html2canvas
      const style = document.createElement('style');
      style.textContent = `
        .pdf-compatible {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #cccccc !important;
        }
        .pdf-compatible * {
          color: inherit !important;
          background-color: inherit !important;
          border-color: inherit !important;
        }
        .pdf-compatible .bg-green-100 { background-color: #dcfce7 !important; }
        .pdf-compatible .text-green-600 { color: #16a34a !important; }
        .pdf-compatible .bg-gray-50 { background-color: #f9fafb !important; }
        .pdf-compatible .text-gray-600 { color: #4b5563 !important; }
        .pdf-compatible .text-gray-900 { color: #111827 !important; }
        .pdf-compatible .border-gray-200 { border-color: #e5e7eb !important; }
        .pdf-compatible .bg-gray-100 { background-color: #f3f4f6 !important; }
      `;
      clonedElement.appendChild(style);
      clonedElement.classList.add('pdf-compatible');

      // Agregar temporalmente al DOM
      document.body.appendChild(clonedElement);
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
      });

      // Limpiar
      document.body.removeChild(clonedElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);

      while (heightLeft > pdfHeight) {
        heightLeft -= pdfHeight;
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      }

      pdf.save(`peritaje_${state.plate || 'vehiculo'}.pdf`);
      enqueueSnackbar('PDF descargado correctamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      enqueueSnackbar('Error al generar el PDF', { variant: 'error' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const goToList = () => {
    navigate('/damage-assessments');
  };

  return (
    <PageShell
      header={FIXED_STEPPER}
      loading={isLoadingData}
      loadingTitle="Cargando peritaje"
      loadingDescription="Estamos cargando la información completa del peritaje"
      content={
        <div className="space-y-6">
          {/* Header con estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¡Peritaje completado!</h2>
                <p className="text-gray-600">Matrícula: {state.plate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!canFinalize && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Pendiente de valoración</span>
                </div>
              )}
              <Button
                onClick={handleDownloadPdf}
                disabled={!canFinalize || isGeneratingPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>
          </div>

          {/* Contenido del PDF */}
          <div
            ref={contentRef}
            className={`rounded-lg bg-white p-6 shadow-sm ${!isGeneratingPDF && 'border border-gray-200'}`}
          >
            {/* Header del informe */}
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="w-32 sm:w-40">
                  <img src="/logo_motormind.png" alt="Motormind" className="w-full" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="font-semibold text-[#111827]">Talleres Motormind</h2>
                  <p className="text-sm text-[#6b7280]">Calle Principal 123, 28001 Madrid</p>
                  <p className="text-sm text-[#6b7280]">CIF: B12345678 | Tel: 91 234 56 78</p>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <h1 className="mb-2 text-lg font-bold text-[#111827] sm:text-xl">
                  INFORME DE PERITACIÓN DE DAÑOS
                </h1>
                <p className="text-sm text-[#6b7280]">
                  Fecha de emisión: {new Date().toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-[#6b7280]">Matrícula: {state.plate}</p>
              </div>
            </div>

            {/* Desglose de la valoración */}
            <div className="mb-6">
              <h3 className="mb-6 text-lg font-bold text-[#111827]">
                DESGLOSE DETALLADO DE LA VALORACIÓN
              </h3>

              {/* Tablas de valoración */}
              <FinalizeLaborTable data={laborData} />

              <FinalizePaintTable data={paintData} />

              <FinalizePartsTable data={partsData} />

              {/* Resumen de costes */}
              <ValuationCostsSummary
                laborTotal={laborTotal}
                paintLaborTotal={paintLaborTotal}
                paintMaterialsTotal={paintMaterialsTotal}
                partsTotal={partsTotal}
                showLaborSubtotal={laborData.length > 0}
                showPaintSubtotal={paintData.length > 0}
                showPartsSubtotal={partsData.length > 0}
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-center">
            <Button onClick={goToList} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default Finalize;
