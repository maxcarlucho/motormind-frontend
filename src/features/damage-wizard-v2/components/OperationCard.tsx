import { Settings } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/Select';
import { SectionPaper } from './SectionPaper';
import { OperationKind } from '../types';

interface OperationCardProps {
  operation: {
    id: string;
    partName: string;
    damageType: string;
    severity: 'leve' | 'medio' | 'grave';
    operation: OperationKind;
  };
  severityConfig: Record<string, { color: string; label: string }>;
  onUpdateOperation: (id: string, operation: OperationKind) => void;
}

export const OperationCard = ({ operation, severityConfig, onUpdateOperation }: OperationCardProps) => {
  const severityStyle = severityConfig[operation.severity];

  return (
    <SectionPaper>
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-3">
        {/* Left column - Part info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{operation.partName}</h3>
          <p className="text-sm text-gray-600">{operation.damageType}</p>
          <Badge variant="outline" className={severityStyle.color}>
            {severityStyle.label}
          </Badge>
        </div>

        {/* Right column - Operation selection */}
        <div className="space-y-3 lg:col-span-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Operación principal
            </label>
            <Select
              value={operation.operation}
              onValueChange={(value) => onUpdateOperation(operation.id, value as OperationKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PULIR">Pulir</SelectItem>
                <SelectItem value="REPARAR">Reparar</SelectItem>
                <SelectItem value="PINTAR">Pintar</SelectItem>
                <SelectItem value="REPARAR_Y_PINTAR">Reparar y Pintar</SelectItem>
                <SelectItem value="SUSTITUIR">Sustituir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="mr-1 h-4 w-4" />
              Suplementos
            </Button>
            <span className="text-xs text-amber-700">Pendiente de valoración</span>
          </div>
        </div>
      </div>
    </SectionPaper>
  );
};
