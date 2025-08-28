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

type TableRow = Record<string, unknown> & { _isSubtitle?: boolean; _subtitleText?: string };

type ValuationTableProps = {
  columns: Column[];
  data: TableRow[];
  emptyStateMessage?: string;
};

/**
 * Formatea un valor para mostrar en la tabla
 * - Si es un número, lo formatea con máximo 2 decimales
 * - Si es un string que NO contiene números, lo devuelve tal como está
 * - Si es un string que contiene números, verifica si ya está formateado
 * - Mantiene ReactNodes tal como están
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

  // Si es un número, formatearlo con 2 decimales
  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  // Si es un string, verificar si ya está formateado
  if (typeof value === 'string') {
    // Si el string ya contiene "h" (horas), no hacer conversiones
    if (value.includes('h')) {
      return value;
    }

    // Si el string ya tiene formato de número con decimales, no convertirlo
    if (/^\d+\.\d{2}$/.test(value)) {
      return value;
    }

    // Intentar parsear como número solo si no está ya formateado
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue.toFixed(2);
    }

    // Si no es un número, devolver el string tal como está
    return value;
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
        {data.map((row, index) => {
          // Si es un subtítulo, renderizar una fila especial
          if (row._isSubtitle && row._subtitleText) {
            return (
              <TableRow key={`subtitle-${index}`} className="bg-gray-50">
                <TableCell colSpan={columns.length} className="py-3 font-semibold text-gray-700">
                  {row._subtitleText}
                </TableCell>
              </TableRow>
            );
          }

          // Fila normal de datos
          return (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.key}>{formatTableCellValue(row[column.key])}</TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
