import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { CheckCircle, ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { useWizardV2 } from '../context/WizardV2Context';
import { PageShell } from '../components/PageShell';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { ValuationTable } from '../components/ValuationTable';
import { useSnackbar } from 'notistack';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BackendLaborOutput, BackendPaintWork } from '../types/backend.types';
import { operationLabels } from '@/types/DamageAssessment';

const getOperationLabel = (operationCode: string): string => {
  return operationLabels[operationCode] || operationCode;
};

const Finalize = () => {
  const navigate = useNavigate();
  const { state } = useWizardV2();
  const { enqueueSnackbar } = useSnackbar();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Verificar si el assessment está en estado válido para finalizar
  const canFinalize =
    state.valuation &&
    (state.valuation.workflow?.status === 'valuated' ||
      state.valuation.workflow?.status === 'completed');

  // Datos de mano de obra (NO pintura)
  const laborData = state.valuation?.laborOutput
    ? state.valuation.laborOutput
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
        }))
    : [];

  // Datos de pintura (MO + Materiales)
  const paintData = state.valuation?.paintWorks
    ? (() => {
        const paintDataArray: Array<{
          description?: string;
          units?: string;
          price?: number;
          total?: number;
          _isSubtitle?: boolean;
          _subtitleText?: string;
        }> = [];

        // Agrupar datos de mano de obra de pintura por pieza
        const laborByPart = new Map<string, { hours: number; rate: number; total: number }>();
        state.valuation.paintWorks.forEach((item: BackendPaintWork) => {
          const partName = item.partName || 'Pieza sin nombre';
          const hours = item.labor?.hours || 0;
          const rate = item.labor?.hourlyRate || 0;
          const total = item.labor?.total || 0;

          if (laborByPart.has(partName)) {
            const existing = laborByPart.get(partName)!;
            existing.hours += hours;
            existing.total += total;
            // Para el rate, tomamos el promedio si hay diferentes rates
            existing.rate = (existing.rate + rate) / 2;
          } else {
            laborByPart.set(partName, { hours, rate, total });
          }
        });

        // Agregar datos agrupados de mano de obra de pintura
        laborByPart.forEach((data, partName) => {
          paintDataArray.push({
            description: `Pintar ${partName}`,
            units: `${data.hours.toFixed(2)}h`,
            price: data.rate,
            total: data.total,
          });
        });

        // Agregar subtítulo para materiales
        if (paintDataArray.length > 0) {
          paintDataArray.push({
            _isSubtitle: true,
            _subtitleText: 'Materiales de pintura',
          });
        }

        // Agrupar datos de materiales por pieza
        const materialsByPart = new Map<string, { units: number; price: number; total: number }>();
        state.valuation.paintWorks.forEach((item: BackendPaintWork) => {
          const partName = item.partName || 'Pieza sin nombre';
          const price = item.materials?.unitPrice || 0;
          const total = item.materials?.total || 0;

          if (materialsByPart.has(partName)) {
            const existing = materialsByPart.get(partName)!;
            // Las unidades NO se suman, siempre es 1 por pieza
            existing.total += total;
            // Para el precio, tomamos el promedio si hay diferentes precios
            existing.price = (existing.price + price) / 2;
          } else {
            materialsByPart.set(partName, { units: 1, price, total });
          }
        });

        // Agregar datos agrupados de materiales
        materialsByPart.forEach((data, partName) => {
          paintDataArray.push({
            description: `Pintar ${partName}`,
            units: `${data.units.toFixed(2)}`,
            price: data.price,
            total: data.total,
          });
        });

        return paintDataArray;
      })()
    : [];

  // Datos de recambios
  const partsData = state.valuation?.parts
    ? state.valuation.parts.map((item: Record<string, unknown>) => ({
        ref: (item.ref as string) || 'REF-001',
        partName: (item.partName as string) || 'Pieza',
        unitPrice: (item.unitPrice as number) || 0,
        qty: (item.qty as number) || 1,
        total: (item.total as number) || 0,
      }))
    : [];

  // Calcular totales
  const laborTotal = laborData.reduce((sum, item) => sum + item.total, 0);
  const paintLaborTotal = paintData
    .filter((item) => !item._isSubtitle)
    .reduce((sum, item) => sum + (item.total || 0), 0);
  const paintMaterialsTotal = paintData
    .filter((item) => !item._isSubtitle && item.description?.includes('Pintar'))
    .reduce((sum, item) => sum + (item.total || 0), 0);
  const partsTotal = partsData.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = laborTotal + paintLaborTotal + paintMaterialsTotal + partsTotal;

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
      header={
        <WizardStepperWithNav
          currentStep="finalize"
          completedSteps={['intake', 'damages', 'operations', 'valuation']}
        />
      }
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

              {/* Mano de Obra (NO pintura) */}
              {laborData.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 font-semibold text-[#111827]">MANO DE OBRA</h4>
                  <ValuationTable
                    columns={[
                      { key: 'operation', header: 'OPERACIÓN' },
                      { key: 'hours', header: 'TIEMPO' },
                      { key: 'rate', header: 'PRECIO/H' },
                      { key: 'total', header: 'IMPORTE' },
                    ]}
                    data={laborData}
                  />
                  <div className="mt-3 bg-[#f9fafb] p-3 text-right">
                    <span className="font-medium">
                      Subtotal Mano de Obra: €{laborTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Pintura */}
              {paintData.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 font-semibold text-[#111827]">PINTURA</h4>
                  <ValuationTable
                    columns={[
                      { key: 'description', header: 'DESCRIPCIÓN' },
                      { key: 'units', header: 'CANT.' },
                      { key: 'price', header: 'PRECIO UNIT.' },
                      { key: 'total', header: 'IMPORTE' },
                    ]}
                    data={paintData}
                  />
                  <div className="mt-3 bg-[#f9fafb] p-3 text-right">
                    <span className="font-medium">
                      Subtotal Pintura: €{(paintLaborTotal + paintMaterialsTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Recambios */}
              {partsData.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 font-semibold text-[#111827]">RECAMBIOS</h4>
                  <ValuationTable
                    columns={[
                      { key: 'ref', header: 'REF.' },
                      { key: 'partName', header: 'DESCRIPCIÓN' },
                      { key: 'unitPrice', header: 'PRECIO' },
                      { key: 'qty', header: 'CANT.' },
                      { key: 'total', header: 'IMPORTE' },
                    ]}
                    data={partsData}
                  />
                  <div className="mt-3 bg-[#f9fafb] p-3 text-right">
                    <span className="font-medium">
                      Subtotal Recambios: €{partsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Resumen de costes */}
              <div>
                <h4 className="mb-3 font-semibold text-[#111827]">RESUMEN DE COSTES TOTALES</h4>
                <div className="rounded-lg bg-[#f9fafb] p-4 sm:p-6">
                  <div className="ml-auto max-w-md space-y-2 text-sm">
                    {laborData.length > 0 && (
                      <div className="flex justify-between">
                        <span>Subtotal Mano de Obra:</span>
                        <span className="font-medium">€{laborTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {paintData.length > 0 && (
                      <div className="flex justify-between">
                        <span>Subtotal Pintura:</span>
                        <span className="font-medium">
                          €{(paintLaborTotal + paintMaterialsTotal).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {partsData.length > 0 && (
                      <div className="flex justify-between">
                        <span>Subtotal Recambios:</span>
                        <span className="font-medium">€{partsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2 border-[#e5e7eb]" />
                    <div className="flex justify-between font-medium">
                      <span>BASE IMPONIBLE:</span>
                      <span>€{grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (21%):</span>
                      <span className="font-medium">€{(grandTotal * 0.21).toFixed(2)}</span>
                    </div>
                    <hr className="my-2 border-[#e5e7eb]" />
                    <div className="flex justify-between text-base font-bold sm:text-lg">
                      <span>TOTAL VALORACIÓN:</span>
                      <span>€{(grandTotal * 1.21).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
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
