import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/Table';

type Column = { key: string; header: string };

type ValuationTableProps = {
  columns: Column[];
  data: any[];
  emptyStateMessage?: string;
};

export const ValuationTable = ({
  columns,
  data,
  emptyStateMessage = 'No hay datos disponibles',
}: ValuationTableProps) => {
  const hasData = data && data.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <p className="text-sm">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.key}>{row[column.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
