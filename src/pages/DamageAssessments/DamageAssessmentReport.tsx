import { useNavigate, useParams } from 'react-router-dom';
import { useDamageAssessmentDetailPage } from '@/hooks/useDamageAssessmentDetail.hook';
import { useAuth } from '@/context/Auth.context';
import { UserRole } from '@/types/User';
import { Navigate } from 'react-router-dom';
import Spinner from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { Share, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useWorkshop } from '@/context/Workshop.context';
import {
  groupPaintMaterials,
  calculatePaintMaterialsSubtotal,
} from '@/utils/paintMaterialGrouping';

const DamageAssessmentReport = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { damageAssessmentId } = useParams<{ damageAssessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { workshop } = useWorkshop();
  const { damageAssessment, isLoading, error, isCurrentAssessmentLoaded, damages } =
    useDamageAssessmentDetailPage();

  // Cargar el damage assessment al montar el componente
  useEffect(() => {
    // Este efecto se ejecuta para asegurar que se carga el assessment correcto
    // El hook interno ya maneja la carga automática
  }, [damageAssessmentId]);

  const handleDownloadPdf = async () => {
    const input = contentRef.current;
    if (!input) return;

    try {
      setIsGeneratingPDF(true);
      enqueueSnackbar('Generando PDF...', { variant: 'info' });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
      });

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

      pdf.save('informe_peritacion.pdf');
      enqueueSnackbar('PDF descargado correctamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      enqueueSnackbar('Error al generar el PDF', { variant: 'error' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Verificar permisos
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Estados de carga
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Cargando informe..." />
      </div>
    );
  }

  if (error || !isCurrentAssessmentLoaded || !damageAssessment || !damageAssessment.car) {
    return (
      <div className="text-destructive flex min-h-screen items-center justify-center">
        Error al cargar el informe
      </div>
    );
  }

  // Usar todos los daños disponibles (ya no se usa confirmación)
  const damagesToShow = damages;

  // Agrupar materiales de pintura por tipo
  const groupedPaintMaterials = groupPaintMaterials(damagesToShow);

  // Calcular totales
  const laborSubtotal = damagesToShow.reduce((total, damage) => {
    const additionalActions = damage.additionalActions || [];
    return (
      total +
      additionalActions.reduce(
        (sum, action) => sum + (action.time / 60) * (workshop?.bodyworkHourlyRate || 40),
        0,
      )
    );
  }, 0);

  const partsSubtotal = damagesToShow.reduce((total, damage) => {
    const spareParts = damage.spareParts || [];
    return total + spareParts.reduce((sum, part) => sum + part.quantity * part.price, 0);
  }, 0);

  const paintSubtotal = calculatePaintMaterialsSubtotal(groupedPaintMaterials);
  const subtotal = laborSubtotal + partsSubtotal + paintSubtotal;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const currentDate = new Date().toLocaleDateString('es-ES');
  const { car } = damageAssessment;

  return (
    <div className="min-h-screen bg-gray-50 pb-5">
      {/* Header con botones de acción */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/damage-assessments')}
            className="self-start !pl-0"
          >
            ← Volver a Peritajes
          </Button>

          <div className="flex gap-2 self-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                enqueueSnackbar('Link copiado al portapapeles', { variant: 'success' });
              }}
            >
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>

            <Button size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido del informe */}
      <div
        ref={contentRef}
        className={`mx-auto my-5 max-w-6xl rounded-lg bg-white px-1 py-3 sm:px-7 sm:py-5 ${!isGeneratingPDF && 'shadow-lg'}`}
      >
        <div className="p-4 sm:p-8">
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
              <p className="text-sm text-[#6b7280]">Fecha de emisión: {currentDate}</p>
            </div>
          </div>

          {/* Datos del Vehículo y Siniestro */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-[#e5e7eb] p-2 sm:p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">Datos del Vehículo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Marca y Modelo:</span>
                  <span className="font-medium">
                    {car.brand} {car.model}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Matrícula:</span>
                  <span className="font-medium">{car.plate || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Nº de Bastidor (VIN):</span>
                  <span className="font-medium break-all">{car.vinCode || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Kilometraje:</span>
                  <span className="font-medium">16,272 km</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Fecha de 1ª Matriculación:</span>
                  <span className="font-medium">{car.year || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] p-2 sm:p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">Datos del Siniestro</h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Aseguradora:</span>
                  <span className="font-medium">{damageAssessment.insuranceCompany}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Nº de Póliza:</span>
                  <span className="font-medium">-</span>
                </div>
                {damageAssessment.claimNumber && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-[#6b7280]">Nº de Siniestro:</span>
                    <span className="font-medium break-all">{damageAssessment.claimNumber}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Fecha del Siniestro:</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-[#6b7280]">Cliente/Asegurado:</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Daños Principales */}
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-[#111827]">Resumen de Daños Principales</h3>
            <div className="rounded-lg bg-[#f9fafb] p-4">
              <ul className="space-y-2 text-sm">
                {damagesToShow.map((damage, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mt-0.5 mr-2 text-[#9ca3af]">•</span>
                    <span>{damage.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fotografías Clave - Solo visibles cuando NO se está generando PDF */}
          {!isGeneratingPDF && (
            <div className="mb-6">
              <h3 className="mb-4 font-semibold text-[#111827]">Fotografías Clave</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {damageAssessment.images.slice(0, 8).map((image, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={image}
                      alt={`Fotografía ${index + 1}`}
                      className="h-full w-full rounded border border-[#e5e7eb] object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desglose Detallado de la Valoración */}
          <div className="mb-6">
            <h3 className="mb-6 text-lg font-bold text-[#111827]">
              DESGLOSE DETALLADO DE LA VALORACIÓN
            </h3>

            {/* Mano de Obra */}
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-[#111827]">MANO DE OBRA</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                        OPERACIÓN
                      </th>
                      <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                        CÓDIGO
                      </th>
                      <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                        TIEMPO
                      </th>
                      <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                        PRECIO/H
                      </th>
                      <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                        IMPORTE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {damagesToShow.map((damage, damageIndex) =>
                      (damage.additionalActions || []).map((action) => (
                        <tr key={`${damageIndex}-${action.description}`}>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            <span>{action.description}</span>
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            {/* ✅ NUEVO: Usar la nueva estructura de operaciones */}
                            {(damage.proposedOperation?.operation || damage.action) === 'REPLACE'
                              ? 'SUST-'
                              : (damage.proposedOperation?.operation || damage.action) ===
                                  'REPAIR_AND_PAINT'
                                ? 'REP-'
                                : 'PINT-'}
                            {String(damageIndex + 1).padStart(2, '0')}
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            {action.time}min
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            €{workshop?.bodyworkHourlyRate || 40}
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs font-medium sm:px-4 sm:text-sm">
                            €
                            {((action.time / 60) * (workshop?.bodyworkHourlyRate || 40)).toFixed(2)}
                          </td>
                        </tr>
                      )),
                    )}
                    <tr className="bg-[#f9fafb] font-medium">
                      <td
                        colSpan={4}
                        className="border border-[#e5e7eb] px-2 py-2 text-right text-xs sm:px-4 sm:text-sm"
                      >
                        Subtotal Mano de Obra:
                      </td>
                      <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                        €{laborSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recambios */}
            {damagesToShow.some((damage) => damage.spareParts && damage.spareParts.length > 0) && (
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-[#111827]">RECAMBIOS</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-[#e5e7eb] text-xs sm:text-sm">
                    <thead className="bg-[#f9fafb]">
                      <tr>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          DESCRIPCIÓN
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          REF.
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          CANT.
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          PRECIO
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          IMPORTE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {damagesToShow.map((damage, damageIndex) =>
                        (damage.spareParts || []).map((part, partIndex) => (
                          <tr key={`${damageIndex}-${partIndex}`}>
                            <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                              <span>{part.description}</span>
                            </td>
                            <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                              {damage.area.slice(0, 3).toUpperCase()}
                              {String(damageIndex + 1).padStart(3, '0')}-{String(partIndex + 1)}
                            </td>
                            <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                              {part.quantity}
                            </td>
                            <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                              €{part.price.toFixed(2)}
                            </td>
                            <td className="border border-[#e5e7eb] px-2 py-2 text-xs font-medium sm:px-4 sm:text-sm">
                              €{(part.quantity * part.price).toFixed(2)}
                            </td>
                          </tr>
                        )),
                      )}
                      <tr className="bg-[#f9fafb] font-medium">
                        <td
                          colSpan={4}
                          className="border border-[#e5e7eb] px-2 py-2 text-right text-xs sm:px-4 sm:text-sm"
                        >
                          Subtotal Recambios:
                        </td>
                        <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                          €{partsSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Materiales de Pintura */}
            {groupedPaintMaterials.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-[#111827]">MATERIALES DE PINTURA</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-[#e5e7eb] text-xs sm:text-sm">
                    <thead className="bg-[#f9fafb]">
                      <tr>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          DESCRIPCIÓN
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          CANT.
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          PRECIO UNIT.
                        </th>
                        <th className="border border-[#e5e7eb] px-2 py-2 text-left sm:px-4">
                          IMPORTE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPaintMaterials.map((material) => (
                        <tr key={material.type}>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-[#e5e7eb] px-2 py-1 font-mono text-xs">
                                {material.code}
                              </span>
                              <span className="">{material.description}</span>
                            </div>
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            {material.totalQuantity}ml
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                            €{material.averagePrice.toFixed(2)}/L
                          </td>
                          <td className="border border-[#e5e7eb] px-2 py-2 text-xs font-medium sm:px-4 sm:text-sm">
                            €{material.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#f9fafb] font-medium">
                        <td
                          colSpan={3}
                          className="border border-[#e5e7eb] px-2 py-2 text-right text-xs sm:px-4 sm:text-sm"
                        >
                          Subtotal Materiales Pintura:
                        </td>
                        <td className="border border-[#e5e7eb] px-2 py-2 text-xs sm:px-4 sm:text-sm">
                          €{paintSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumen de Costes */}
            <div>
              <h4 className="mb-3 font-semibold text-[#111827]">RESUMEN DE COSTES TOTALES</h4>
              <div className="rounded-lg bg-[#f9fafb] p-4 sm:p-6">
                <div className="ml-auto max-w-md space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal Mano de Obra:</span>
                    <span className="font-medium">€{laborSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Recambios:</span>
                    <span className="font-medium">€{partsSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Materiales Pintura:</span>
                    <span className="font-medium">€{paintSubtotal.toFixed(2)}</span>
                  </div>
                  <hr className="my-2 border-[#e5e7eb]" />
                  <div className="flex justify-between font-medium">
                    <span>BASE IMPONIBLE:</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (21%):</span>
                    <span className="font-medium">€{iva.toFixed(2)}</span>
                  </div>
                  <hr className="my-2 border-[#e5e7eb]" />
                  <div className="flex justify-between text-base font-bold sm:text-lg">
                    <span>TOTAL VALORACIÓN:</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageAssessmentReport;
