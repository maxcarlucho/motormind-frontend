import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, User, Car, Loader2 } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/Dialog';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';

interface CreatePreAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PreAppointmentData) => Promise<void>;
}

export interface PreAppointmentData {
  customer: {
    fullName: string;
    phoneE164: string;
    email?: string;
  };
  vehicle: {
    plate: string;
    notes?: string;
  };
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  plate: string;
  notes: string;
}

interface ValidationErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  plate?: string;
}

export const CreatePreAppointmentModal = ({
  open,
  onOpenChange,
  onSubmit,
}: CreatePreAppointmentModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '+54',
    email: '',
    plate: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Limpiar formulario cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setFormData({
        fullName: '',
        phone: '+54',
        email: '',
        plate: '',
        notes: '',
      });
      setValidationErrors({});
      setIsLoading(false);
    }
  }, [open]);

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validar nombre
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar teléfono
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      errors.phone = 'Ingresá un número válido con prefijo de país';
    }

    // Validar email si está presente
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Ingresá un email válido';
      }
    }

    // Validar matrícula
    if (!formData.plate.trim()) {
      errors.plate = 'La matrícula es obligatoria';
    }

    return errors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Normalizar: solo números y + al inicio
    const normalized = value.replace(/[^\d+]/g, '');
    // Asegurar que empiece con +
    const formatted = normalized.startsWith('+') ? normalized : `+${normalized}`;
    handleInputChange('phone', formatted);
  };

  const handlePlateChange = (value: string) => {
    // Normalizar a mayúsculas y sin espacios
    const normalized = value.toUpperCase().replace(/\s/g, '');
    handleInputChange('plate', normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const preAppointmentData: PreAppointmentData = {
        customer: {
          fullName: formData.fullName.trim(),
          phoneE164: formData.phone,
          email: formData.email.trim() || undefined,
        },
        vehicle: {
          plate: formData.plate.trim(),
          notes: formData.notes.trim() || undefined,
        },
      };

      await onSubmit(preAppointmentData);
      
      enqueueSnackbar('Pre-cita creada. El cliente recibirá un WhatsApp con los próximos pasos.', {
        variant: 'success',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating pre-appointment:', error);
      enqueueSnackbar('Error al crear la pre-cita. Intentalo nuevamente.', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Nueva pre-cita
          </DialogTitle>
          <DialogDescription>
            Cargá los datos del cliente y del vehículo para iniciar el diagnóstico por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Datos del cliente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Datos del cliente</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Nombre y apellido */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre y apellido <span className="text-red-500">*</span>
                </label>
                <Input
                  ref={nameInputRef}
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={isLoading}
                  className={validationErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}
                  aria-describedby={validationErrors.fullName ? 'fullName-error' : undefined}
                />
                {validationErrors.fullName && (
                  <p id="fullName-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+5491173659111"
                  disabled={isLoading}
                  className={validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
                  aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
                />
                {validationErrors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading}
                  className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                />
                {validationErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200"></div>

          {/* Sección 2: Datos del vehículo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Datos del vehículo</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Matrícula */}
              <div>
                <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula/Patente <span className="text-red-500">*</span>
                </label>
                <Input
                  id="plate"
                  type="text"
                  value={formData.plate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="ABC123"
                  disabled={isLoading}
                  className={validationErrors.plate ? 'border-red-500 focus:border-red-500' : ''}
                  aria-describedby={validationErrors.plate ? 'plate-error' : undefined}
                />
                {validationErrors.plate && (
                  <p id="plate-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.plate}
                  </p>
                )}
              </div>

              {/* Motivo/Notas */}
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo/Notas iniciales (opcional)
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Breve descripción del problema o motivo de la consulta..."
                  disabled={isLoading}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear pre-cita'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
