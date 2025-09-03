import { ValuationTable } from './ValuationTable';

interface PaintData {
  type: 'labor' | 'material';
  description: string;
  hours?: string;
  rate?: number;
  quantity?: string;
  unitCost?: number;
  total: number;
}

interface PaintTableProps {
  data: PaintData[];
}

export const FinalizePaintTable = ({ data }: PaintTableProps) => {
  if (data.length === 0) return null;

  const laborData = data.filter((item) => item.type === 'labor');
  const materialData = data.filter((item) => item.type === 'material');

  const laborTotal = laborData.reduce((sum, item) => sum + item.total, 0);
  const materialTotal = materialData.reduce((sum, item) => sum + item.total, 0);
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
  laborData.forEach((item) => {
    paintDataArray.push({
      description: item.description,
      units: item.hours || '',
      price: item.rate ? `€${item.rate}` : '',
      total: `€${item.total.toFixed(2)}`,
    });
  });

  // Agregar subtítulo para materiales si hay ambos tipos
  if (laborData.length > 0 && materialData.length > 0) {
    paintDataArray.push({
      _isSubtitle: true,
      _subtitleText: 'Materiales de pintura',
    });
  }

  // Agregar datos de materiales
  materialData.forEach((item) => {
    paintDataArray.push({
      description: item.description,
      units: item.quantity || '',
      price: item.unitCost ? `€${item.unitCost.toFixed(2)}` : '',
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
