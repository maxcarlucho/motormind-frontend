import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarPlus,
  User,
  Car as CarIcon,
  Loader2,
  CheckIcon,
  XIcon,
  FileTextIcon,
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';

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
import { PLATE_REGEX } from '@/constants';
import { useApi } from '@/hooks/useApi';
import { Car } from '@/types/Car';
import { Appointment } from '@/types/Appointment';

interface CreatePreAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface PreAppointmentData {
  clientName: string;
  clientPhone: string;
  carPlate: string;
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
}

interface FormData {
  clientName: string;
  clientPhone: string;
  carPlate: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

interface ValidationErrors {
  clientName?: string;
  clientPhone?: string;
  carPlate?: string;
}

export const CreatePreAppointmentModal = ({
  open,
  onOpenChange,
}: CreatePreAppointmentModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '+54',
    carPlate: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isCarPlateValid, setIsCarPlateValid] = useState<boolean | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { execute: getOrCreateVehicleRequest } = useApi<Car>('get', '/cars/vin-or-plate');
  const { execute: createAppointmentRequest } = useApi<CreateAppointmentResponse>(
    'post',
    '/appointments',
  );

  // Mutations
  const getOrCreateVehicleMutation = useMutation<AxiosResponse<Car>, Error, { plate: string }>({
    mutationFn: (params: { plate: string }) => getOrCreateVehicleRequest(undefined, params),
    onSuccess: (response) => {
      // Una vez que tenemos el carId, crear la appointment
      const preAppointmentData: PreAppointmentData = {
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone,
        carPlate: formData.carPlate.trim(),
        appointmentDate: formData.appointmentDate.trim() || undefined,
        appointmentTime: formData.appointmentTime.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      createAppointmentMutation.mutate({
        ...preAppointmentData,
        carId: response.data._id!,
      });
    },
    onError: () => {
      enqueueSnackbar('Error al obtener el vehículo. Verificá que la matrícula exista.', {
        variant: 'error',
      });
    },
  });

  interface CreateAppointmentResponse {
    success: boolean;
    appointment: Appointment;
    carId: string;
    diagnosisId: string;
    link: string;
    message: string;
  }

  const createAppointmentMutation = useMutation<
    AxiosResponse<CreateAppointmentResponse>,
    Error,
    PreAppointmentData & { carId: string }
  >({
    mutationFn: (data: PreAppointmentData & { carId: string }) =>
      createAppointmentRequest({
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        carPlate: data.carPlate,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        notes: data.notes,
      }),
    onSuccess: () => {
      enqueueSnackbar('Pre-cita creada. El cliente recibirá un WhatsApp con los próximos pasos.', {
        variant: 'success',
      });
      onOpenChange(false);
    },
    onError: () => {
      enqueueSnackbar('Error al crear la pre-cita. Intentalo nuevamente.', {
        variant: 'error',
      });
    },
  });

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
        clientName: '',
        clientPhone: '+54',
        carPlate: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: '',
      });
      setValidationErrors({});
      setIsCarPlateValid(null);
    }
  }, [open]);

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validar nombre
    if (!formData.clientName.trim() || formData.clientName.trim().length < 2) {
      errors.clientName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar teléfono
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
    if (!formData.clientPhone || !phoneRegex.test(formData.clientPhone)) {
      errors.clientPhone = 'Ingresá un número válido con prefijo de país';
    }

    // Validar matrícula
    if (!formData.carPlate.trim()) {
      errors.carPlate = 'La matrícula es obligatoria';
    } else if (!PLATE_REGEX.test(formData.carPlate)) {
      errors.carPlate = 'Formato de matrícula inválido';
    }

    return errors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error cuando el usuario empieza a escribir
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Normalizar: solo números y + al inicio
    const normalized = value.replace(/[^\d+]/g, '');
    // Asegurar que empiece con +
    const formatted = normalized.startsWith('+') ? normalized : `+${normalized}`;
    handleInputChange('clientPhone', formatted);
  };

  const validateCarPlate = (value: string) => {
    // Only allow letters, numbers, hyphen and space
    const filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    // Convert to uppercase
    const upperValue = filteredValue.toUpperCase();

    handleInputChange('carPlate', upperValue);

    // Validate using regex pattern
    if (upperValue.length > 0) {
      setIsCarPlateValid(PLATE_REGEX.test(upperValue));
    } else {
      setIsCarPlateValid(null);
    }

  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Hacer getOrCreate del vehículo y luego crear la appointment
    getOrCreateVehicleMutation.mutate({ plate: formData.carPlate.trim() });
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const isFormValid = Object.keys(validateForm()).length === 0;
  const isLoading = getOrCreateVehicleMutation.isPending || createAppointmentMutation.isPending;

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
                <label
                  htmlFor="clientName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Nombre y apellido <span className="text-red-500">*</span>
                </label>
                <Input
                  ref={nameInputRef}
                  id="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={isLoading}
                  className={
                    validationErrors.clientName ? 'border-red-500 focus:border-red-500' : ''
                  }
                  aria-describedby={validationErrors.clientName ? 'clientName-error' : undefined}
                />
                {validationErrors.clientName && (
                  <p id="clientName-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.clientName}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="clientPhone"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Teléfono (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+5491173659111"
                  disabled={isLoading}
                  className={
                    validationErrors.clientPhone ? 'border-red-500 focus:border-red-500' : ''
                  }
                  aria-describedby={validationErrors.clientPhone ? 'clientPhone-error' : undefined}
                />
                {validationErrors.clientPhone && (
                  <p id="clientPhone-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.clientPhone}
                  </p>
                )}
              </div>

              {/* Fecha de cita */}
              <div>
                <label
                  htmlFor="appointmentDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Fecha de cita (opcional)
                </label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Hora de cita */}
              <div>
                <label
                  htmlFor="appointmentTime"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Hora de cita (opcional)
                </label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200"></div>

          {/* Sección 2: Datos del vehículo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CarIcon className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Datos del vehículo</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Matrícula */}
              <div>
                <label htmlFor="carPlate" className="mb-1 block text-sm font-medium text-gray-700">
                  Matrícula <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FileTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="carPlate"
                    type="text"
                    value={formData.carPlate}
                    onChange={(e) => validateCarPlate(e.target.value)}
                    placeholder="Ej: 4859 JKL / M-1234-AB"
                    disabled={isLoading}
                    className={`pl-10 ${
                      isCarPlateValid === true
                        ? 'border-green-500 pr-10'
                        : isCarPlateValid === false
                          ? 'border-red-500 pr-10'
                          : validationErrors.carPlate
                            ? 'border-red-500'
                            : ''
                    }`}
                    pattern={PLATE_REGEX.source}
                    autoComplete="off"
                    aria-describedby={validationErrors.carPlate ? 'carPlate-error' : undefined}
                  />

                  {isCarPlateValid !== null && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {isCarPlateValid ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.carPlate && (
                  <p id="carPlate-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.carPlate}
                  </p>
                )}

              </div>

              {/* Motivo/Notas */}
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
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
