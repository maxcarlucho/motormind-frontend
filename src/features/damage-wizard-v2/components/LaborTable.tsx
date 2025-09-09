import { ValuationTable } from './ValuationTable';

import { LaborOperation } from '../types';

interface LaborTableProps {
  operations: LaborOperation[];
  onUpdateOperation: (id: string, field: keyof LaborOperation, value: number) => void;
}

export const LaborTable = ({ operations, onUpdateOperation }: LaborTableProps) => {
  if (operations.length === 0) return null;

  const total = operations.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h4 className="mb-3 font-semibold text-[#111827]">MANO DE OBRA (NO PINTURA)</h4>
      <ValuationTable
        columns={[
          { key: 'operation', header: 'OPERACIÓN' },
          { key: 'hours', header: 'TIEMPO' },
          { key: 'rate', header: 'PRECIO/H' },
          { key: 'total', header: 'IMPORTE' },
        ]}
        data={operations.map((item) => ({
          operation: item.operation,
          hours: {
            value: item.hours.toString(),
            editable: true,
            onChange: (value: string) => onUpdateOperation(item.id, 'hours', parseFloat(value)),
          },
          rate: {
            value: `€${item.rate}`,
            editable: true,
            onChange: (value: string) =>
              onUpdateOperation(item.id, 'rate', parseFloat(value.replace('€', ''))),
          },
          total: `€${item.total.toFixed(2)}`,
        }))}
      />
      <div className="mt-3 bg-[#f9fafb] p-3 text-right">
        <span className="font-medium">Subtotal Mano de Obra: €{total.toFixed(2)}</span>
      </div>
    </div>
  );
};
