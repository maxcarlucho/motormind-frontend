import { SectionPaper } from './SectionPaper';
import { InlineEdit } from './InlineEdit';
import { SparePart } from '../types';

interface SparePartsTableProps {
  spareParts: SparePart[];
  onUpdatePart: (id: string, field: keyof SparePart, value: number) => void;
  className?: string;
}

/**
 * Tabla de Recambios y partes.
 * Diseñado para paridad 1:1 con el prototipo de Lovable.
 *
 * - Header: "Recambios y partes" con border-b
 * - Columns: Pieza | Referencia/Código | Descripción | Cantidad | Precio unitario (€) | Total (€)
 * - InlineEdit: cantidad y precio unitario editables
 * - Reference: text-muted-foreground para referencia/código
 * - Totals footer: bg-muted/30 + font-bold + text-lg
 * - Hover: bg-muted/30 en filas
 */
export const SparePartsTable = ({ spareParts, onUpdatePart, className }: SparePartsTableProps) => {
  const total = spareParts.reduce((sum, part) => sum + part.total, 0);

  return (
    <SectionPaper className={className}>
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recambios y partes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Pieza</th>
              <th className="text-left p-3 font-medium">Referencia/Código</th>
              <th className="text-left p-3 font-medium">Descripción</th>
              <th className="text-right p-3 font-medium">Cantidad</th>
              <th className="text-right p-3 font-medium">Precio unitario (€)</th>
              <th className="text-right p-3 font-medium">Total (€)</th>
            </tr>
          </thead>
          <tbody>
            {spareParts.map((part) => (
              <tr key={part.id} className="border-b border-border hover:bg-muted/30">
                <td className="p-3">{part.piece}</td>
                <td className="p-3 text-muted-foreground">{part.reference}</td>
                <td className="p-3">{part.description}</td>
                <td className="p-3 text-right">
                  <InlineEdit
                    value={part.quantity}
                    onSave={(value) => onUpdatePart(part.id, 'quantity', value)}
                    isAdjusted={part.isManuallyAdjusted}
                  />
                </td>
                <td className="p-3 text-right">
                  <InlineEdit
                    value={part.unitPrice}
                    onSave={(value) => onUpdatePart(part.id, 'unitPrice', value)}
                    suffix="€"
                    isAdjusted={part.isManuallyAdjusted}
                  />
                </td>
                <td className="p-3 text-right font-semibold">
                  {part.total.toFixed(2)}€
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/30">
            <tr>
              <td colSpan={5} className="p-3 text-right font-semibold">Total Recambios:</td>
              <td className="p-3 text-right font-bold text-lg">{total.toFixed(2)}€</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SectionPaper>
  );
};
