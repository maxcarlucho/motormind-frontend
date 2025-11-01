import { Calculator, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { DamageAssessment } from '@/types/DamageAssessment';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { useWorkshop } from '@/context/Workshop.context';
import {
  groupPaintMaterials,
  calculatePaintMaterialsSubtotal,
} from '@/utils/paintMaterialGrouping';

interface CostBreakdownProps {
  damageAssessment: DamageAssessment;
  onUpdateNotes: (notes: string) => void;
}

export const CostBreakdown = ({ damageAssessment, onUpdateNotes }: CostBreakdownProps) => {
  const { workshop } = useWorkshop();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(damageAssessment.notes || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Detectar si es mobile y establecer estado inicial
  useEffect(() => {
    const checkIsMobile = () => {
      return window.innerWidth < 768; // md breakpoint
    };

    setIsExpanded(!checkIsMobile());
  }, []);

  // Cálculos de costes
  const costBreakdown = useMemo(() => {
    // Calcular total de mano de obra basándose en additionalActions
    const laborCost = damageAssessment.damages.reduce((total, damage) => {
      if (!damage.additionalActions || damage.additionalActions.length === 0) return total;

      const damageAdditionalActionsTotal = damage.additionalActions.reduce(
        (damageTotal, action) => {
          // Convertir minutos a horas y multiplicar por tarifa por hora
          const hours = action.time / 60;
          // Usar la tarifa del taller como fuente única de verdad
          const actionCost = hours * (workshop?.bodyworkHourlyRate || 40);
          return damageTotal + actionCost;
        },
        0,
      );

      return total + damageAdditionalActionsTotal;
    }, 0);

    // Calcular total de materiales de pintura usando la nueva lógica de agrupación
    // Ya no se usa confirmación - usar todos los daños disponibles
    const groupedPaintMaterials = groupPaintMaterials(damageAssessment.damages);
    const paintWorksCost = calculatePaintMaterialsSubtotal(groupedPaintMaterials);

    // Calcular total de recambios de todos los daños
    const sparePartsCost = damageAssessment.damages.reduce((total, damage) => {
      if (!damage.spareParts || damage.spareParts.length === 0) return total;

      const damageSparePartsTotal = damage.spareParts.reduce((damageTotal, part) => {
        return damageTotal + part.price * part.quantity;
      }, 0);

      return total + damageSparePartsTotal;
    }, 0);

    // Verificar si hay recambios para mostrar/ocultar la línea
    const hasSpareParts = damageAssessment.damages.some(
      (damage) => damage.spareParts && damage.spareParts.length > 0,
    );

    // Verificar si hay mano de obra
    const hasLaborWork = damageAssessment.damages.some(
      (damage) => damage.additionalActions && damage.additionalActions.length > 0,
    );

    // Verificar si hay materiales de pintura
    const hasPaintWorks = groupedPaintMaterials.length > 0;

    const subtotal = laborCost + sparePartsCost + paintWorksCost;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    return {
      laborCost,
      sparePartsCost,
      paintWorksCost,
      hasSpareParts,
      hasLaborWork,
      hasPaintWorks,
      subtotal,
      iva,
      total,
    };
  }, [damageAssessment.damages]);

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(notesValue);
    }
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(damageAssessment.notes || '');
    setIsEditingNotes(false);
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <div
      className={`fixed right-4 bottom-4 z-20 h-fit w-80 rounded-lg border p-3 shadow-sm md:top-26 md:right-16 md:p-4 ${
        isExpanded ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
      }`}
    >
      {/* Header con botón de toggle */}
      <div className={`flex items-center justify-between ${isExpanded ? 'mb-6' : 'mb-0'}`}>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Resumen de Valoración</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Contenido colapsable */}
      <div className={`${isExpanded ? 'block' : 'hidden'}`}>
        {/* Desglose de Costes */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Desglose de Costes</h4>

          <div className="space-y-2 text-sm">
            {/* Mano de Obra - Solo mostrar si hay additionalActions */}
            {costBreakdown.hasLaborWork && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mano de Obra</span>
                <span className="font-medium">{formatCurrency(costBreakdown.laborCost)}</span>
              </div>
            )}

            {/* Recambios - Solo mostrar si hay recambios */}
            {costBreakdown.hasSpareParts && (
              <div className="flex justify-between">
                <span className="text-gray-600">Recambios</span>
                <span className="font-medium">{formatCurrency(costBreakdown.sparePartsCost)}</span>
              </div>
            )}

            {/* Materiales de Pintura - Solo mostrar si hay paintWorks */}
            {costBreakdown.hasPaintWorks && (
              <div className="flex justify-between">
                <span className="text-gray-600">Materiales de Pintura</span>
                <span className="font-medium">{formatCurrency(costBreakdown.paintWorksCost)}</span>
              </div>
            )}
          </div>

          {/* Subtotal */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700">Subtotal</span>
              <span>{formatCurrency(costBreakdown.subtotal)}</span>
            </div>
          </div>

          {/* IVA */}
          <div className="mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (21%)</span>
              <span className="font-medium">{formatCurrency(costBreakdown.iva)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-gray-900">{formatCurrency(costBreakdown.total)}</span>
            </div>
          </div>
        </div>

        {/* Información de Tarifa */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Información de Tarifa</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Aseguradora</span>
              <span className="font-medium">{damageAssessment.insuranceCompany}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarifa Hora</span>
              <span className="font-medium">€{workshop?.bodyworkHourlyRate || 40}.00/h</span>
            </div>
          </div>
        </div>

        {/* Notas Adicionales */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Notas Adicionales
            </h4>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Editar
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={3}
                className="w-full text-sm"
                placeholder="Añade cualquier observación o detalle adicional sobre la valoración..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelNotes}
                  className="text-gray-600"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {damageAssessment.notes ||
                'Añade cualquier observación o detalle adicional sobre la valoración...'}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="space-y-2"></div>
      </div>
    </div>
  );
};
