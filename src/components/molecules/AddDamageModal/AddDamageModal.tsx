import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/Select';
import {
  Damage,
  DamageAction,
  DamageSeverity,
  DamageType,
  getDamageTypeLabel,
  operationLabels,
  severityLabels,
} from '@/types/DamageAssessment';
import { X } from 'lucide-react';

interface AddDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDamage: (damageData: Partial<Damage>) => Promise<void>;
  isAdding: boolean;
}

export const AddDamageModal = ({ isOpen, onClose, onAddDamage, isAdding }: AddDamageModalProps) => {
  const [formData, setFormData] = useState<Partial<Damage>>({
    area: '',
    subarea: '',
    description: '',
    type: DamageType.SCRATCH,
    severity: DamageSeverity.SEV3,
    action: DamageAction.REPAIR_AND_PAINT,
    notes: '',
    spareParts: [],
    additionalActions: [],
    paintWorks: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.area?.trim()) {
      errors.area = 'El área de la pieza afectada es obligatoria';
    }

    if (!formData.description?.trim()) {
      errors.description = 'La descripción del daño es obligatoria';
    }

    if (!formData.type) {
      errors.type = 'El tipo de daño es obligatorio';
    }

    if (!formData.severity) {
      errors.severity = 'La severidad del daño es obligatoria';
    }

    if (!formData.action) {
      errors.action = 'La operación de baremo es obligatoria';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await onAddDamage(formData);
      handleClose();
    } catch {
      // El error se maneja en el contexto
    }
  };

  const handleClose = () => {
    setFormData({
      area: '',
      subarea: '',
      description: '',
      type: DamageType.SCRATCH,
      severity: DamageSeverity.SEV3,
      action: DamageAction.REPAIR_AND_PAINT,
      notes: '',
      spareParts: [],
      additionalActions: [],
      paintWorks: [],
    });
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Añadir Nuevo Daño</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Pieza Afectada */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Pieza Afectada *</label>
            <Input
              value={formData.area || ''}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, area: e.target.value }));
                if (validationErrors.area) {
                  setValidationErrors((prev) => ({ ...prev, area: '' }));
                }
              }}
              className={validationErrors.area ? 'border-red-500' : ''}
              placeholder="Ej: Puerta Delantera Izquierda"
            />
            {validationErrors.area && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.area}</p>
            )}
          </div>

          {/* Subárea (opcional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Subárea (opcional)
            </label>
            <Input
              value={formData.subarea || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, subarea: e.target.value }))}
              placeholder="Ej: Panel inferior"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descripción del Daño *
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: '' }));
                }
              }}
              className={validationErrors.description ? 'border-red-500' : ''}
              placeholder="Describe el daño detectado..."
              rows={3}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          {/* Tipo de Daño */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Daño *</label>
            <Select
              value={formData.type || ''}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, type: value as DamageType }));
                if (validationErrors.type) {
                  setValidationErrors((prev) => ({ ...prev, type: '' }));
                }
              }}
            >
              <SelectTrigger className={validationErrors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona el tipo de daño" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DamageType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getDamageTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.type && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.type}</p>
            )}
          </div>

          {/* Severidad */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Severidad *</label>
            <Select
              value={formData.severity || ''}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, severity: value as DamageSeverity }));
                if (validationErrors.severity) {
                  setValidationErrors((prev) => ({ ...prev, severity: '' }));
                }
              }}
            >
              <SelectTrigger className={validationErrors.severity ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona la severidad" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DamageSeverity).map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severityLabels[severity]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.severity && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.severity}</p>
            )}
          </div>

          {/* Operación de Baremo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Operación de Baremo *
            </label>
            <Select
              value={formData.action || ''}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, action: value as DamageAction }));
                if (validationErrors.action) {
                  setValidationErrors((prev) => ({ ...prev, action: '' }));
                }
              }}
            >
              <SelectTrigger className={validationErrors.action ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona la operación" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DamageAction).map((action: DamageAction) => (
                  <SelectItem key={action} value={action}>
                    {operationLabels[action]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.action && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.action}</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Notas (opcional)</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Añadir notas adicionales..."
              rows={2}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isAdding}>
            {isAdding ? 'Añadiendo...' : 'Añadir Daño'}
          </Button>
        </div>
      </div>
    </div>
  );
};
