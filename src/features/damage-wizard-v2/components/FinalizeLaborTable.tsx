import { ValuationTable } from './ValuationTable';

interface LaborData {
  operation: string;
  hours: string;
  rate: number;
  total: number;
}

interface LaborTableProps {
  data: LaborData[];
}

export const FinalizeLaborTable = ({ data }: LaborTableProps) => {
  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.total, 0);

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
        data={data.map((item) => ({
          operation: item.operation,
          hours: item.hours,
          rate: `€${item.rate}`,
          total: `€${item.total.toFixed(2)}`,
        }))}
      />
      <div className="mt-3 bg-[#f9fafb] p-3 text-right">
        <span className="font-medium">
          Subtotal Mano de Obra: €{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
