import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { DamageSparePartsTable } from '@/components/molecules/DamageSparePartsTable';
import { DamageAdditionalActionsTable } from '@/components/molecules/DamageAdditionalActionsTable';
import { DamageAction, Damage, operationLabels } from '@/types/DamageAssessment';
import { useDamageAssessmentDetail } from '@/context/DamageAssessment.context';
import { useState } from 'react';
import { clsx } from 'clsx';
import { DamageSeverity } from '@/types/DamageAssessment';
import { Wrench, ChevronDown, Clock, Trash } from 'lucide-react';

const severityLabelMap: Record<DamageSeverity, string> = {
  [DamageSeverity.SEV1]: 'Muy Leve (Pulido)',
  [DamageSeverity.SEV2]: 'Leve (Reparación rápida)',
  [DamageSeverity.SEV3]: 'Medio (Rayón)',
  [DamageSeverity.SEV4]: 'Grave (Chapa y pintura)',
  [DamageSeverity.SEV5]: 'Muy Grave (Reemplazo)',
};

interface DamageCardProps {
  damage: Damage;
  onUpdateDamage?: (updatedDamage: Damage) => void;
  onDeleteDamage?: (damageId: string) => void;
  isEditable?: boolean;
}

const DamageCard = ({
  damage,
  onUpdateDamage,
  onDeleteDamage,
  isEditable = false,
}: DamageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editFormData, setEditFormData] = useState<Damage>(damage);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Usar el contexto para el estado de edición
  const { isEditingDamage, startEditingDamage, stopEditingDamage, isUpdating, isDeleting } =
    useDamageAssessmentDetail();

  const isEditing = isEditingDamage(damage._id || '');
  const isThisDamageUpdating = isUpdating && isEditing;
  const isThisDamageDeleting = isDeleting && isEditing;

  const { area, subarea, severity, action, notes } = damage;

  const validateFormData = () => {
    const errors: Record<string, string> = {};

    // Validar pieza afectada
    if (!editFormData.area || !editFormData.area.trim()) {
      errors.pieceAffected = 'La pieza afectada es obligatoria';
    }

    // Validar operación de baremo
    if (!editFormData.action) {
      errors.action = 'La operación de baremo es obligatoria';
    }

    // Validar piezas de recambio
    if (editFormData.spareParts && editFormData.spareParts.length > 0) {
      editFormData.spareParts.forEach((part, index) => {
        if (!part.description.trim()) {
          errors[`sparePart_${index}_description`] = 'La descripción es obligatoria';
        }
        if (!part.quantity || part.quantity <= 0) {
          errors[`sparePart_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
        }
        if (!part.price || part.price <= 0) {
          errors[`sparePart_${index}_price`] = 'El precio debe ser mayor a 0';
        }
      });
    }

    // Validar operaciones adicionales
    if (editFormData.additionalActions && editFormData.additionalActions.length > 0) {
      editFormData.additionalActions.forEach((action, index) => {
        if (!action.description.trim()) {
          errors[`additionalAction_${index}_description`] = 'La descripción es obligatoria';
        }
        if (!action.time || action.time <= 0) {
          errors[`additionalAction_${index}_time`] = 'El tiempo debe ser mayor a 0';
        }
      });
    }

    return errors;
  };

  const getSeverityColor = (s: DamageSeverity) => {
    switch (s) {
      case DamageSeverity.SEV1:
        return 'bg-blue-100 text-blue-800';
      case DamageSeverity.SEV2:
        return 'bg-green-100 text-green-800';
      case DamageSeverity.SEV3:
        return 'bg-yellow-100 text-yellow-800';
      case DamageSeverity.SEV4:
        return 'bg-orange-200 text-orange-800';
      case DamageSeverity.SEV5:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = () => {
    setEditFormData(damage);
    startEditingDamage(damage._id || '');
    setIsExpanded(true);
  };

  const handleSave = () => {
    // Validar los datos antes de enviar
    const errors = validateFormData();
    setValidationErrors(errors);

    // Si hay errores, no enviar
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (onUpdateDamage) {
      onUpdateDamage(editFormData);
    }
    // No llamar stopEditingDamage aquí, lo hará el contexto en caso de éxito
  };

  const handleCancel = () => {
    setEditFormData(damage);
    stopEditingDamage();
  };

  const handleDelete = () => {
    if (onDeleteDamage && damage._id) {
      onDeleteDamage(damage._id);
    }
  };

  const updateField = <K extends keyof Damage>(field: K, value: Damage[K]) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className={`mb-4 overflow-hidden rounded-lg border border-gray-200 shadow-md ${isEditing ? 'bg-blue-50' : 'bg-white'}`}
    >
      {/* Header del daño */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
          >
            <p className="text-base font-semibold text-gray-900">
              {subarea ? `${area} - ${subarea}` : area}
            </p>
            <p className="mt-1 text-sm text-gray-600">{damage.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-1 text-xs font-medium ${getSeverityColor(severity)}`}>
              {severityLabelMap[severity] || 'Desconocida'}
            </span>

            {isEditable && !isEditing && (
              <button
                onClick={handleEdit}
                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Editar
              </button>
            )}

            {!isEditing && (
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Operación de Baremo - siempre visible */}
        {action && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">{operationLabels[action]}</span>
              <span className="text-gray-500">| Código: PDI-REP-M</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Tiempo estándar: 1.5h</span>
            </div>
          </div>
        )}
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className={`border-t border-gray-100 p-4 ${isEditing ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="space-y-6">
            {/* Edición de campos básicos */}
            {isEditing && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-blue-700">
                  Editando: {damage.subarea ? `${damage.area} - ${damage.subarea}` : damage.area}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Pieza Afectada
                  </label>
                  <div className="relative flex items-center gap-2">
                    <Input
                      value={editFormData.area || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Siempre usar solo el área y resetear subarea
                        updateField('area', value);
                        updateField('subarea', '');

                        // Limpiar error cuando el usuario empiece a escribir
                        if (validationErrors.pieceAffected) {
                          setValidationErrors((prev) => ({ ...prev, pieceAffected: '' }));
                        }
                      }}
                      className={clsx(
                        'flex-1 bg-white',
                        validationErrors.pieceAffected && 'border-red-500 focus:border-red-500',
                      )}
                      placeholder="Ej: Puerta Delantera Izquierda"
                    />
                    {validationErrors.pieceAffected && (
                      <div className="absolute top-full left-0 z-10 mt-1 max-w-xs rounded bg-red-100 px-2 py-1 text-xs text-red-600 shadow-sm">
                        {validationErrors.pieceAffected}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Operación de Baremo
                  </label>
                  <div className="relative">
                    <Select
                      value={editFormData.action || ''}
                      onValueChange={(value: string) => {
                        updateField('action', value as DamageAction);
                        // Limpiar error cuando el usuario empiece a escribir
                        if (validationErrors.action) {
                          setValidationErrors((prev) => ({ ...prev, action: '' }));
                        }
                      }}
                    >
                      <SelectTrigger
                        className={clsx(
                          'w-full bg-white',
                          validationErrors.action && 'border-red-500 focus:border-red-500',
                        )}
                      >
                        <SelectValue placeholder="Selecciona una operación" />
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
                      <div className="absolute top-full left-0 z-10 mt-1 max-w-xs rounded bg-red-100 px-2 py-1 text-xs text-red-600 shadow-sm">
                        {validationErrors.action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Piezas de recambio */}
            <DamageSparePartsTable
              damageId={damage._id!}
              isEditing={isEditing}
              editFormData={isEditing ? editFormData : undefined}
              onUpdateField={isEditing ? updateField : undefined}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
            />

            {/* Suplementos / Operaciones Adicionales */}
            <DamageAdditionalActionsTable
              damageId={damage._id!}
              isEditing={isEditing}
              editFormData={isEditing ? editFormData : undefined}
              onUpdateField={isEditing ? updateField : undefined}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
            />

            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Notas específicas</h4>
              <textarea
                value={isEditing ? editFormData.notes || '' : notes || ''}
                onChange={isEditing ? (e) => updateField('notes', e.target.value) : undefined}
                className={clsx(
                  'w-full rounded-lg border border-gray-200 bg-white p-3 text-sm',
                  !isEditing && 'cursor-not-allowed',
                )}
                rows={3}
                placeholder={isEditing ? 'Añadir notas específicas...' : 'Sin notas'}
                readOnly={!isEditing}
              />
            </div>

            {/* Botones de acción en modo edición */}
            {isEditing && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <Button variant="outline" onClick={handleCancel} className="text-gray-600">
                  Cancelar Edición
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="flex min-w-[120px] items-center justify-center border-red-200 text-red-600 hover:bg-red-50"
                    disabled={isThisDamageDeleting}
                  >
                    {isThisDamageDeleting ? (
                      <div className="flex items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-r-transparent" />
                      </div>
                    ) : (
                      <>
                        <Trash className="mr-1 h-4 w-4" />
                        Eliminar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex min-w-[140px] items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isThisDamageUpdating}
                  >
                    {isThisDamageUpdating ? (
                      <div className="flex items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      </div>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageCard;
