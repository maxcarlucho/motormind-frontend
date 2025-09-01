import { ValuationTable } from './ValuationTable';

interface PartsData {
  ref: string;
  partName: string;
  unitPrice: number;
  qty: number;
  total: number;
}

interface PartsTableProps {
  data: PartsData[];
}

export const FinalizePartsTable = ({ data }: PartsTableProps) => {
  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h4 className="mb-3 font-semibold text-[#111827]">PIEZAS DE RECAMBIO</h4>
      <ValuationTable
        columns={[
          { key: 'ref', header: 'REF.' },
          { key: 'partName', header: 'DESCRIPCIÓN' },
          { key: 'unitPrice', header: 'PRECIO' },
          { key: 'qty', header: 'CANT.' },
          { key: 'total', header: 'IMPORTE' },
        ]}
        data={data.map((item) => ({
          ref: item.ref,
          partName: item.partName,
          unitPrice: `€${item.unitPrice.toFixed(2)}`,
          qty: item.qty,
          total: `€${item.total.toFixed(2)}`,
        }))}
      />
      <div className="mt-3 bg-[#f9fafb] p-3 text-right">
        <span className="font-medium">
          Subtotal Recambios: €{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
