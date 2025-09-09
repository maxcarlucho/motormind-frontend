import { useState, useEffect } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

import { Button } from '@/components/atoms/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/Dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { Calendar } from '@/components/atoms/Calendar';
import { PLATE_REGEX, VIN_REGEX } from '@/constants';
import { Car, CreateCar } from '@/types/Car';
import { useApi } from '@/hooks/useApi';

const MIN_YEAR = 1980;

interface EditVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car;
}

export const EditVehicleModal = ({ open, onOpenChange, car }: EditVehicleModalProps) => {
  const [isLicensePlateValid, setIsLicensePlateValid] = useState<boolean | null>(null);
  const [isVinValid, setIsVinValid] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { execute: updateCarRequest } = useApi<CreateCar>('put', '/cars/:id');

  const updateCarMutation = useMutation({
    mutationFn: (carData: CreateCar) => updateCarRequest(carData, undefined, { id: car._id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getCarById', car._id] });
      enqueueSnackbar('Vehículo actualizado exitosamente', { variant: 'success' });
      onOpenChange(false);
    },
    onError: () => {
      enqueueSnackbar('Error al actualizar el vehículo', { variant: 'error' });
    },
  });

  const [carData, setCarData] = useState({
    brand: car.brand || '',
    model: car.model || '',
    year: car.year || '',
    licensePlate: car.plate || '',
    vinCode: car.vinCode || '',
    kilometers: car?.kilometers,
    fuel: car?.fuel || '',
    lastRevision: car?.lastRevision || '',
  });

  // Add validation on mount
  useEffect(() => {
    if (carData.licensePlate) {
      validateLicensePlate(carData.licensePlate);
    }
    if (carData.vinCode) {
      validateVin(carData.vinCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateLicensePlate = (value: string) => {
    // Only allow letters, numbers, hyphen and space
    const filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    // Convert to uppercase
    const upperValue = filteredValue.toUpperCase();

    handleInputChange('licensePlate', upperValue);

    // Only validate if there's a value
    if (upperValue.length > 0) {
      setIsLicensePlateValid(PLATE_REGEX.test(upperValue));
    } else {
      setIsLicensePlateValid(null);
    }
  };

  const validateVin = (value: string) => {
    // Only allow letters, numbers, hyphen and space
    const filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    // Convert to uppercase
    const upperValue = filteredValue.toUpperCase();
    handleInputChange('vinCode', upperValue);

    // Only validate if there's a value
    if (upperValue.length > 0) {
      setIsVinValid(VIN_REGEX.test(upperValue));
    } else {
      setIsVinValid(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCar: CreateCar = {
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      plate: carData.licensePlate,
      vinCode: carData.vinCode,
      kilometers: Number(carData.kilometers),
      fuel: carData.fuel,
      lastRevision: carData.lastRevision ? carData.lastRevision : new Date().toISOString(),
    };
    updateCarMutation.mutate(updatedCar);
  };

  const resetForm = () => {
    setCarData({
      brand: car.brand || '',
      model: car.model || '',
      year: car.year || '',
      licensePlate: car.plate || '',
      vinCode: car.vinCode || '',
      kilometers: car?.kilometers,
      fuel: car?.fuel || '',
      lastRevision: car?.lastRevision || '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'brand') {
      // Only allow letters and spaces
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    setCarData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isSubmitDisabled = Boolean(
    !carData.brand || // Brand is required
      carData.brand.length < 2 || // Brand must be at least 3 characters
      !carData.model || // Model is required
      !carData.year || // Year is required
      Number(carData.year) < MIN_YEAR || // Year must be greater than 1980
      Number(carData.year) > new Date().getFullYear() || // Year must be less than current year
      (carData.kilometers && Number(carData.kilometers) <= 0) || // Kilometers must be greater than 0
      (carData.licensePlate.length > 0 && !isLicensePlateValid) || // License plate must be valid if provided
      (carData.vinCode.length > 0 && !isVinValid), // VIN must be valid if provided
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:min-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold sm:text-xl">
            Editar información <span className="hidden sm:inline">del vehículo</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-5">
          <div className="grid gap-2 py-0 sm:gap-4 sm:py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">
                  Marca <span className="text-red-500">*</span>
                </p>
                <Input
                  id="brand"
                  value={carData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Ej: Seat"
                  required
                  maxLength={30}
                  minLength={2}
                />
              </div>

              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">
                  Modelo <span className="text-red-500">*</span>
                </p>
                <Input
                  id="model"
                  value={carData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Ej: León"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">
                  Año <span className="text-red-500">*</span>
                </p>
                <Input
                  id="year"
                  value={carData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="Ej: 2020"
                  type="number"
                  min={MIN_YEAR}
                  max={new Date().getFullYear()}
                  required
                />
                {(Number(carData.year) < MIN_YEAR ||
                  Number(carData.year) > new Date().getFullYear()) &&
                  carData.year?.toString().length === 4 && (
                    <p className="mt-1 text-xs text-red-500">
                      Ingrese valores entre {MIN_YEAR} y {new Date().getFullYear()}
                    </p>
                  )}
              </div>

              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">Matrícula</p>
                <div>
                  <div className="relative">
                    <Input
                      id="licensePlate"
                      value={carData.licensePlate}
                      onChange={(e) => validateLicensePlate(e.target.value)}
                      className={`${
                        isLicensePlateValid === true
                          ? 'border-green-500 pr-10'
                          : isLicensePlateValid === false
                            ? 'border-red-500 pr-10'
                            : ''
                      }`}
                      pattern={PLATE_REGEX.source}
                      placeholder="Ej: 4859 JKL / M-1234-AB"
                    />

                    {isLicensePlateValid !== null && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        {isLicensePlateValid ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {isLicensePlateValid === false && (
                    <p className="mt-1 text-xs text-red-500">
                      Matrícula inválida. Por favor, introduce una matrícula válida.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-0.5 text-xs font-medium sm:text-sm">VIN</p>
              <div>
                <div className="relative">
                  <Input
                    id="vinCode"
                    value={carData.vinCode}
                    onChange={(e) => validateVin(e.target.value)}
                    className={`${
                      isVinValid === true
                        ? 'border-green-500 pr-10'
                        : isVinValid === false
                          ? 'border-red-500 pr-10'
                          : ''
                    }`}
                    pattern={VIN_REGEX.source}
                    placeholder="Ej: 12345678901234567"
                  />

                  {isVinValid !== null && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {isVinValid ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {isVinValid === false && (
                  <p className="mt-1 text-xs text-red-500">
                    VIN inválido. Por favor, introduce un VIN válido.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">KMs</p>
                <Input
                  id="kilometers"
                  value={carData.kilometers}
                  onChange={(e) => handleInputChange('kilometers', e.target.value)}
                  placeholder="Ej: 50000"
                  type="number"
                  min="1"
                />
                {!!carData.kilometers && Number(carData.kilometers) <= 0 && (
                  <p className="mt-1 text-xs text-red-500">Ingrese números mayores que 0</p>
                )}
              </div>

              <div>
                <p className="mb-0.5 text-xs font-medium sm:text-sm">Combustible</p>
                <Select
                  value={carData.fuel}
                  onValueChange={(value) => handleInputChange('fuel', value)}
                >
                  <SelectTrigger id="fuel">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Diésel">Diésel</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                    <SelectItem value="GLP">GLP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="mb-0.5 text-xs font-medium sm:text-sm">Última revisión</p>
              <Calendar
                value={carData.lastRevision ? new Date(carData.lastRevision) : null}
                onChange={(date) =>
                  handleInputChange(
                    'lastRevision',
                    date ? format(date, 'dd/MM/yyyy', { locale: es }) : '',
                  )
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled || updateCarMutation.isPending}
              className="mt-3 sm:mt-0"
            >
              {updateCarMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
