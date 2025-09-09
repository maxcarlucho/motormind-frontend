import { useState } from 'react';
import { CheckIcon, HashIcon, FileTextIcon, XIcon, ArrowLeftIcon } from 'lucide-react';
import { Calendar } from '@/components/atoms/Calendar';
import { useSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosResponse } from 'axios';

import { Button } from '@/components/atoms/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/Dialog';
import { Input } from '@/components/atoms/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/Tabs';
import { PLATE_REGEX, VIN_REGEX } from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/Select';
import { format } from 'date-fns';
import { useApi } from '@/hooks/useApi';
import { CreateCar, Car } from '@/types/Car';
import { useDamageAssessmentCreation } from '@/context/DamageAssessment.context';

const MIN_YEAR = 1980;

// Lista de aseguradoras disponibles
const INSURANCE_COMPANIES = [
  'Mapfre',
  'Allianz',
  'AXA',
  'Mutua Madrileña',
  'Generali',
  'Línea Directa',
  'Reale',
  'Zurich',
  'Otra',
];

interface CreateDiagnosticModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createOnly?: boolean;
  title?: string;
  allowManualCar?: boolean;
  submitButtonText: string;
  redirectTo?: 'car-details' | 'damage-assessment';
}

export const CreateDiagnosticModal = ({
  open,
  onOpenChange,
  createOnly = false,
  title = 'Crear Nuevo Diagnóstico',
  allowManualCar = true,
  submitButtonText,
  redirectTo = 'car-details',
}: CreateDiagnosticModalProps) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [activeTab, setActiveTab] = useState<'licensePlate' | 'vin'>('licensePlate');
  const [isLicensePlateValid, setIsLicensePlateValid] = useState<boolean | null>(null);
  const [isVinValid, setIsVinValid] = useState<boolean | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // Estados para datos del siniestro - ahora usando el contexto
  const { data, setInsuranceCompany, setClaimNumber } = useDamageAssessmentCreation();
  const { insuranceCompany, claimNumber } = data;

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { execute: addVehicleRequest } = useApi<Car>('post', '/cars');
  const { execute: getOrCreateVehicleRequest } = useApi<Car>('get', '/cars/vin-or-plate');

  // Manual creation form state
  const [manualData, setManualData] = useState({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    kilometers: '',
    fuel: '',
    lastRevision: '',
    vinCode: '',
  });

  const addVehicleMutation = useMutation<AxiosResponse<Car>, Error, CreateCar>({
    mutationFn: (carData: CreateCar) => addVehicleRequest(carData),
    onSuccess: (response) => {
      enqueueSnackbar('Vehículo creado exitosamente', { variant: 'success' });
      onOpenChange(false);
      if (redirectTo === 'damage-assessment') {
        // Navegar directamente sin query params
        navigate(`/damage-assessments/create?carId=${response.data._id}`);
      } else {
        navigate(`/cars/${response.data._id}`);
      }
    },
    onError: () => {
      enqueueSnackbar('Error al crear el vehículo', { variant: 'error' });
    },
  });

  const getOrCreateVehicleMutation = useMutation<
    AxiosResponse<Car>,
    Error,
    { vinCode?: string; plate?: string }
  >({
    mutationFn: (params: { vinCode?: string; plate?: string }) =>
      getOrCreateVehicleRequest(undefined, params),
    onSuccess: (response) => {
      if (redirectTo === 'damage-assessment') {
        // Navegar directamente sin query params
        navigate(`/damage-assessments/create?carId=${response.data._id}`);
      } else {
        navigate(`/cars/${response.data._id}`);
      }
    },
    onError: () => {
      enqueueSnackbar('Error al obtener el vehículo', { variant: 'error' });
    },
  });

  const validateLicensePlate = (value: string) => {
    // Only allow letters, numbers, hyphen and space
    const filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    // Convert to uppercase
    const upperValue = filteredValue.toUpperCase();

    if (isManualMode) handleManualInputChange('licensePlate', upperValue);
    else setLicensePlate(upperValue);

    // Validate using regex pattern
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

    if (isManualMode) handleManualInputChange('vinCode', upperValue);
    else setVin(upperValue);

    // Validate using regex pattern
    if (upperValue.length > 0) {
      setIsVinValid(VIN_REGEX.test(upperValue));
    } else {
      setIsVinValid(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isManualMode) {
      const carData: CreateCar = {
        vinCode: manualData.vinCode || '',
        brand: manualData.brand,
        model: manualData.model,
        year: manualData.year,
        plate: manualData.licensePlate || '',
        kilometers: Number(manualData.kilometers) || 0,
        lastRevision: manualData.lastRevision ? manualData.lastRevision : new Date().toISOString(),
        fuel: manualData.fuel || '',
      };
      addVehicleMutation.mutate(carData);
    } else if (activeTab === 'licensePlate' && licensePlate.trim()) {
      getOrCreateVehicleMutation.mutate({ plate: licensePlate });
    } else if (activeTab === 'vin' && vin.trim()) {
      getOrCreateVehicleMutation.mutate({ vinCode: vin });
    }
  };

  const handleBackToSearch = () => {
    setIsManualMode(false);
  };

  const resetForm = () => {
    setLicensePlate('');
    setVin('');
    setActiveTab('licensePlate');
    setIsLicensePlateValid(null);
    setIsVinValid(null);
    setIsManualMode(false);
    // NO resetear los datos del siniestro aquí - los necesitamos en la página de creación
    setManualData({
      brand: '',
      model: '',
      year: '',
      licensePlate: '',
      kilometers: '',
      fuel: '',
      lastRevision: '',
      vinCode: '',
    });
  };

  const handleManualInputChange = (field: string, value: string) => {
    if (field === 'brand') {
      // Solo permitir letras y espacios
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    setManualData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Determinar si el botón de envío debe estar deshabilitado
  const isLoading = addVehicleMutation.isPending || getOrCreateVehicleMutation.isPending;

  // Para peritajes, la aseguradora es obligatoria
  const isDamageAssessment = redirectTo === 'damage-assessment';
  const isInsuranceValid = !isDamageAssessment || insuranceCompany !== '';

  const isSubmitDisabled =
    isLoading ||
    !isInsuranceValid ||
    (isManualMode
      ? !manualData.brand ||
        !manualData.model ||
        !manualData.year ||
        Number(manualData.year) < MIN_YEAR ||
        Number(manualData.year) > new Date().getFullYear() ||
        (manualData.licensePlate && isLicensePlateValid === false) ||
        (manualData.vinCode && isVinValid === false)
      : (activeTab === 'licensePlate' && (!licensePlate || isLicensePlateValid === false)) ||
        (activeTab === 'vin' && (!vin || isVinValid === false)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:min-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-muted">
            {isManualMode
              ? 'Introduce los datos del vehículo manualmente'
              : isDamageAssessment
                ? 'Introduce los datos del vehículo y la aseguradora para iniciar un nuevo peritaje.'
                : 'Introduce los datos del vehículo para iniciar un nuevo diagnóstico.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-5">
          {isManualMode ? (
            <div className="grid gap-2 py-0 sm:gap-4 sm:py-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                <div>
                  <p className="mb-0.5 text-xs font-medium sm:text-sm">
                    Marca <span className="text-red-500">*</span>
                  </p>
                  <Input
                    id="brand"
                    value={manualData.brand}
                    onChange={(e) => handleManualInputChange('brand', e.target.value)}
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
                    value={manualData.model}
                    onChange={(e) => handleManualInputChange('model', e.target.value)}
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
                    value={manualData.year}
                    onChange={(e) => handleManualInputChange('year', e.target.value)}
                    placeholder="Ej: 2020"
                    type="number"
                    min={MIN_YEAR}
                    max={new Date().getFullYear()}
                    required
                  />
                  {(Number(manualData.year) < MIN_YEAR ||
                    Number(manualData.year) > new Date().getFullYear()) &&
                    manualData.year?.toString().length === 4 && (
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
                        value={manualData.licensePlate}
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                <div>
                  <p className="mb-0.5 text-xs font-medium sm:text-sm">Nº Bastidor (VIN)</p>
                  <div className="relative">
                    <Input
                      id="vin"
                      value={manualData.vinCode}
                      onChange={(e) => validateVin(e.target.value)}
                      className={`${
                        isVinValid === true
                          ? 'border-green-500 pr-10'
                          : isVinValid === false
                            ? 'border-red-500 pr-10'
                            : ''
                      }`}
                      pattern={VIN_REGEX.source}
                      placeholder="VIN del vehículo"
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

                <div>
                  <p className="mb-0.5 text-xs font-medium sm:text-sm">KMs</p>
                  <Input
                    id="kilometers"
                    value={manualData.kilometers}
                    onChange={(e) => handleManualInputChange('kilometers', e.target.value)}
                    placeholder="Ej: 50000"
                    type="number"
                    min="1"
                  />
                  {!!manualData.kilometers && Number(manualData.kilometers) <= 0 && (
                    <p className="mt-1 text-xs text-red-500">Ingrese números mayores que 0</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                <div>
                  <p className="mb-0.5 text-xs font-medium sm:text-sm">Combustible</p>
                  <Select
                    value={manualData.fuel}
                    onValueChange={(value) => handleManualInputChange('fuel', value)}
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

                <div>
                  <p className="mb-0.5 text-xs font-medium sm:text-sm">Última Revisión</p>
                  <Calendar
                    value={manualData.lastRevision ? new Date(manualData.lastRevision) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        handleManualInputChange('lastRevision', formattedDate);
                      } else {
                        handleManualInputChange('lastRevision', '');
                      }
                    }}
                    maxDate={new Date()}
                    placeholder="Selecciona fecha de revisión"
                  />
                </div>
              </div>

              {/* Campos para peritaje en modo manual */}
              {isDamageAssessment && (
                <div className="grid grid-cols-1 gap-2 border-t border-gray-200 pt-4 sm:gap-4">
                  <div>
                    <p className="mb-0.5 text-xs font-medium sm:text-sm">
                      Aseguradora <span className="text-red-500">*</span>
                    </p>
                    <Select value={insuranceCompany} onValueChange={setInsuranceCompany} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una aseguradora" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSURANCE_COMPANIES.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-0.5 text-xs font-medium sm:text-sm">
                      Número de siniestro (opcional)
                    </p>
                    <Input
                      value={claimNumber}
                      onChange={(e) => setClaimNumber(e.target.value)}
                      placeholder="Ej: SIN-2023-45678"
                    />
                  </div>
                </div>
              )}

              <div className="flex w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToSearch}
                  className="mr-auto flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Volver a búsqueda
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Tabs
                defaultValue="licensePlate"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'licensePlate' | 'vin')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="licensePlate">Por Matrícula</TabsTrigger>
                  <TabsTrigger value="vin">Por Bastidor (VIN)</TabsTrigger>
                </TabsList>
                <TabsContent value="licensePlate" className="mt-4">
                  <div>
                    <p className="mb-0.5 text-sm font-medium">Matrícula del Vehículo</p>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FileTextIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="licensePlate"
                        value={licensePlate}
                        onChange={(e) => validateLicensePlate(e.target.value)}
                        className={`pl-10 ${
                          isLicensePlateValid === true
                            ? 'border-green-500 pr-10'
                            : isLicensePlateValid === false
                              ? 'border-red-500 pr-10'
                              : ''
                        }`}
                        pattern={PLATE_REGEX.source}
                        placeholder="Ej: 4859 JKL / M-1234-AB"
                        autoComplete="off"
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
                </TabsContent>
                <TabsContent value="vin" className="mt-4">
                  <div>
                    <p className="mb-0.5 text-sm font-medium">Número de Bastidor (VIN)</p>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <HashIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="vin"
                        value={vin}
                        onChange={(e) => validateVin(e.target.value)}
                        className={`pl-10 ${
                          isVinValid === true
                            ? 'border-green-500 pr-10'
                            : isVinValid === false
                              ? 'border-red-500 pr-10'
                              : ''
                        }`}
                        pattern={VIN_REGEX.source}
                        placeholder="VIN del vehículo"
                        autoComplete="off"
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
                </TabsContent>
              </Tabs>

              {/* Campos para peritaje fuera del modo manual */}
              {isDamageAssessment && (
                <div className="grid grid-cols-1 gap-2 border-t border-gray-200 pt-4 sm:gap-4">
                  <div>
                    <p className="mb-0.5 text-sm font-medium">
                      Aseguradora <span className="text-red-500">*</span>
                    </p>
                    <Select value={insuranceCompany} onValueChange={setInsuranceCompany} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una aseguradora" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSURANCE_COMPANIES.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-0.5 text-sm font-medium">Número de siniestro (opcional)</p>
                    <Input
                      value={claimNumber}
                      onChange={(e) => setClaimNumber(e.target.value)}
                      placeholder="Ej: SIN-2023-45678"
                    />
                  </div>
                </div>
              )}

              {allowManualCar && !isManualMode && (
                <div className="my-4 flex justify-center">
                  <button
                    type="button"
                    className="text-primary hover:text-primary cursor-pointer text-sm font-medium transition-colors hover:underline"
                    onClick={() => setIsManualMode(true)}
                  >
                    + O crear manualmente
                  </button>
                </div>
              )}
            </>
          )}

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
            <Button type="submit" disabled={isSubmitDisabled || isLoading}>
              {createOnly
                ? isLoading
                  ? 'Creando Vehículo...'
                  : 'Crear Vehículo'
                : isLoading
                  ? 'Comenzando...'
                  : submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
