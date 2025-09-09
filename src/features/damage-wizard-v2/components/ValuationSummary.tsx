import { SectionPaper } from './SectionPaper';
import { ValuationTotals } from '../types';

interface ValuationSummaryProps {
  totals: ValuationTotals;
  className?: string;
}

/**
 * Resumen final de la valoración con todos los totales.
 * Diseñado para paridad 1:1 con el prototipo de Lovable.
 *
 * - Layout: bg-primary-muted/20 + border-primary-muted
 * - Title: "Resumen de la valoración" + text-lg + font-semibold
 * - Breakdown: todos los conceptos con justify-between
 * - Subtotal: border-t + pt-3 antes del subtotal
 * - IVA: después del subtotal
 * - TOTAL: border-t + pt-3 + text-lg + font-bold + text-primary
 * - Spacing: space-y-3 para separación uniforme
 */
export const ValuationSummary = ({ totals, className }: ValuationSummaryProps) => {
  return (
    <SectionPaper className={`p-6 bg-primary-muted/20 border-primary-muted ${className || ''}`}>
      <h3 className="text-lg font-semibold mb-4">Resumen de la valoración</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Mano de Obra (no pintura):</span>
          <span className="font-semibold">{totals.laborWithoutPaint.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span>Pintura - MO:</span>
          <span className="font-semibold">{totals.paintLabor.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span>Pintura - Materiales:</span>
          <span className="font-semibold">{totals.paintMaterials.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span>Recambios:</span>
          <span className="font-semibold">{totals.spareParts.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span>Subtotal:</span>
          <span className="font-semibold">{totals.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (21%):</span>
          <span className="font-semibold">{totals.tax.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-lg">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold text-primary">{totals.total.toFixed(2)}€</span>
        </div>
      </div>
    </SectionPaper>
  );
};
