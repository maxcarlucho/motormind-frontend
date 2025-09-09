import { ValuationTable } from './ValuationTable';

import { PaintOperation, PaintMaterial } from '../types';

interface PaintTableProps {
  paintOperations: PaintOperation[];
  paintMaterials: PaintMaterial[];
}

export const PaintTable = ({ paintOperations, paintMaterials }: PaintTableProps) => {
  if (paintOperations.length === 0 && paintMaterials.length === 0) return null;

  const laborTotal = paintOperations.reduce((sum, item) => sum + item.total, 0);
  const materialTotal = paintMaterials.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = laborTotal + materialTotal;

  // Crear una sola estructura de datos como en el original con subtítulos
  const paintDataArray: Array<{
    description?: string;
    units?: string;
    price?: string;
    total?: string;
    _isSubtitle?: boolean;
    _subtitleText?: string;
  }> = [];

  // Agregar datos de mano de obra
  paintOperations.forEach((item) => {
    paintDataArray.push({
      description: item.operation,
      units: item.hours.toString(),
      price: `€${item.rate}`,
      total: `€${item.total.toFixed(2)}`,
    });
  });

  // Agregar subtítulo para materiales si hay ambos tipos
  if (paintOperations.length > 0 && paintMaterials.length > 0) {
    paintDataArray.push({
      _isSubtitle: true,
      _subtitleText: 'Materiales de pintura',
    });
  }

  // Agregar datos de materiales
  paintMaterials.forEach((item) => {
    paintDataArray.push({
      description: item.description,
      units: item.units,
      price: `€${item.pricePerUnit.toFixed(2)}`,
      total: `€${item.total.toFixed(2)}`,
    });
  });

  return (
    <div className="mb-6">
      <h4 className="mb-3 font-semibold text-[#111827]">PINTURA</h4>
      <ValuationTable
        columns={[
          { key: 'description', header: 'DESCRIPCIÓN' },
          { key: 'units', header: 'CANT.' },
          { key: 'price', header: 'PRECIO UNIT.' },
          { key: 'total', header: 'IMPORTE' },
        ]}
        data={paintDataArray}
      />
      <div className="mt-3 bg-[#f9fafb] p-3 text-right">
        <span className="font-medium">Subtotal Pintura: €{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
