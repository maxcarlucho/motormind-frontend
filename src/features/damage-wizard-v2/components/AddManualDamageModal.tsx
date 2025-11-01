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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/Dialog';
import { DamageType, DamageSeverity, getDamageTypeLabel } from '@/types/DamageAssessment';
import { Upload, Loader2 } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { severityLabels } from '@/types/DamageAssessment';
import { ImagePreviewItem } from './ImagePreviewItem';

interface AddManualDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDamage: (damageData: {
    area?: string;
    subarea?: string;
    type: string;
    severity: string;
    description?: string;
    imageUrl?: string;
  }) => Promise<void>;
  isAdding: boolean;
}

export const AddManualDamageModal = ({
  isOpen,
  onClose,
  onAddDamage,
  isAdding,
}: AddManualDamageModalProps) => {
  const [formData, setFormData] = useState({
    area: '',
    subarea: '',
    description: '',
    type: DamageType.SCRATCH,
    severity: DamageSeverity.SEV3,
    imageUrl: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.area) {
      errors.area = 'El área del daño es obligatoria';
    }

    if (!formData.subarea) {
      errors.subarea = 'La subárea del daño es obligatoria';
    }

    if (!formData.type) {
      errors.type = 'El tipo de daño es obligatorio';
    }

    if (!formData.severity) {
      errors.severity = 'La severidad del daño es obligatoria';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      enqueueSnackbar('Por favor, completa los campos requeridos', { variant: 'error' });
      return;
    }

    try {
      // Convertir el primer archivo a base64 si existe
      let imageUrl = formData.imageUrl;
      if (imageFiles.length > 0) {
        const file = imageFiles[0];
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      }

      await onAddDamage({
        area: formData.area || 'Carrocería',
        subarea: formData.subarea,
        type: formData.type,
        severity: formData.severity,
        description: formData.description,
        imageUrl: imageUrl,
      });

      // Reset form on success
      setFormData({
        area: '',
        subarea: '',
        description: '',
        type: DamageType.SCRATCH,
        severity: DamageSeverity.SEV3,
        imageUrl: '',
      });
      setImageFiles([]);
      setValidationErrors({});

      onClose();
    } catch (error: unknown) {
      console.error('Error adding damage:', error);

      // Mostrar mensaje de error específico
      let errorMessage = 'Error al crear el daño';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño de archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        enqueueSnackbar('La imagen es demasiado grande. Máximo 5MB.', { variant: 'error' });
        return;
      }

      // Solo permitir una imagen por ahora
      setImageFiles([file]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:min-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold sm:text-xl">Nuevo Daño</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-5">
          <div className="grid gap-2 py-0 sm:gap-4 sm:py-4">
            {/* Área */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">
                Área <span className="text-red-500">*</span>
              </p>
              <Input
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Ej: Carrocería"
                disabled={isAdding}
              />
            </div>

            {/* Subárea */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">
                Subárea <span className="text-red-500">*</span>
              </p>
              <Input
                value={formData.subarea}
                onChange={(e) => setFormData({ ...formData, subarea: e.target.value })}
                placeholder="Ej: Aleta delantera izquierda"
                disabled={isAdding}
              />
            </div>

            {/* Tipo de daño */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">
                Tipo de daño <span className="text-red-500">*</span>
              </p>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as DamageType })}
                disabled={isAdding}
              >
                <SelectTrigger className={validationErrors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {[DamageType.SCRATCH, DamageType.DENT, DamageType.BREAK].map((type) => (
                    <SelectItem key={type} value={type}>
                      {getDamageTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.type && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.type}</p>
              )}
            </div>

            {/* Severidad */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">
                Severidad <span className="text-red-500">*</span>
              </p>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({ ...formData, severity: value as DamageSeverity })
                }
                disabled={isAdding}
              >
                <SelectTrigger className={validationErrors.severity ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar severidad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DamageSeverity).map((severity: DamageSeverity) => (
                    <SelectItem key={severity} value={severity}>
                      {severityLabels[severity]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.severity && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.severity}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">Descripción</p>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción adicional del daño..."
                rows={3}
                disabled={isAdding}
              />
            </div>

            {/* Imagen */}
            <div>
              <p className="mb-1 text-xs font-medium sm:text-sm">Foto (opcional)</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isAdding}
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    Subir imagen
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isAdding}
                  />
                </div>
                {imageFiles.length > 0 && (
                  <ImagePreviewItem
                    file={imageFiles[0]}
                    onRemove={() => handleRemoveImage(0)}
                    showFileName={false}
                    imageClassName="h-32"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isAdding}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isAdding} className="mt-3 sm:mt-0">
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear daño'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
