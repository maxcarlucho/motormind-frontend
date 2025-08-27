import * as React from 'react';
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
  data: Record<string, unknown>[];
  emptyStateMessage?: string;
};

/**
 * Formatea un valor para mostrar en la tabla
 * - Si es un número, lo formatea con máximo 2 decimales
 * - Si es un string que contiene un número, lo formatea
 * - Si es otro tipo, lo devuelve tal como está
 */
const formatTableCellValue = (value: unknown): string | React.ReactNode => {
  // Si es un ReactNode (como un Badge), devolverlo tal como está
  if (React.isValidElement(value)) {
    return value;
  }

  // Si es null o undefined, devolver string vacío
  if (value === null || value === undefined) {
    return '';
  }

  // Si es un string, intentar parsearlo como número
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue.toFixed(2);
    }
    return value;
  }

  // Si es un número, formatearlo con 2 decimales
  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  // Para otros tipos, convertir a string
  return String(value);
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
              <TableCell key={column.key}>
                {formatTableCellValue(row[column.key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
