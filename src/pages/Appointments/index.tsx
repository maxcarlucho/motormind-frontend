import { AlertCircle, CalendarIcon, PlusIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { AppointmentCard } from '@/components/molecules/AppointmentCard';
import Spinner from '@/components/atoms/Spinner';
import apiService from '@/service/api.service';
import { Appointment } from '@/types/Appointment';

const Appointments = () => {
  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await apiService.getAllAppointments();
      return response.data;
    },
    staleTime: 60000, // 1 minute
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label="Cargando citas..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
        <div className="text-destructive flex items-center gap-2 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error al cargar las citas</span>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex h-full flex-grow flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-primary h-6 w-6" />
            <h1 className="text-xl font-semibold text-gray-900">Citas</h1>
          </div>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear pre-cita
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <CalendarIcon className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No hay citas registradas</h3>
            <p className="text-muted mb-4">
              No se encontraron citas agendadas. Crea una nueva cita para comenzar.
            </p>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Crear pre-cita
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-grow flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-primary h-6 w-6" />
          <h1 className="text-xl font-semibold text-gray-900">Citas</h1>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600">
            {appointments.length}
          </span>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Crear pre-cita
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
