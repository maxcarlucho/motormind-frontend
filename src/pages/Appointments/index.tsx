import { AlertCircle, CalendarIcon, PlusIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { AppointmentCard } from '@/components/molecules/AppointmentCard';
import { CreatePreAppointmentModal } from '@/components/molecules/CreatePreAppointmentModal';
import Spinner from '@/components/atoms/Spinner';
import apiService from '@/service/api.service';
import { Appointment } from '@/types/Appointment';
import { useState } from 'react';

const Appointments = () => {
  const [isPreAppointmentModalOpen, setIsPreAppointmentModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const handlePreAppointmentModalChange = (open: boolean) => {
    setIsPreAppointmentModalOpen(open);
    // Si se cerró el modal, refrescar las queries
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
    }
  };

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
      <div className="flex flex-grow flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 flex w-full flex-col items-center justify-between bg-white px-6 py-2 shadow-xs sm:flex-row sm:px-8 sm:py-4 lg:flex-row">
          <div className="lg:w-1/3">
            <h1 className="py-0.5 text-xl font-semibold sm:py-0 lg:text-2xl">Citas</h1>
            <p className="text-muted hidden xl:block">
              Gestiona y revisa todas las citas del taller
            </p>
          </div>

          <Button 
            className="hidden h-8 w-8 sm:flex sm:h-auto sm:w-auto"
            onClick={() => setIsPreAppointmentModalOpen(true)}
          >
            <PlusIcon className="!h-5 !w-5" />
            <span className="hidden lg:inline">Crear pre-cita</span>
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
            <Button onClick={() => setIsPreAppointmentModalOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Crear pre-cita
            </Button>
          </div>
        </div>

        <CreatePreAppointmentModal
          open={isPreAppointmentModalOpen}
          onOpenChange={handlePreAppointmentModalChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-grow flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 flex flex-col items-center justify-between bg-white px-6 py-2 shadow-xs sm:flex-row sm:px-8 sm:py-4 lg:flex-row">
        <div className="lg:w-1/3">
          <h1 className="py-0.5 text-xl font-semibold sm:py-0 lg:text-2xl">Citas</h1>
          <p className="text-muted hidden xl:block">Gestiona y revisa todas las citas del taller</p>
        </div>

        <Button 
          className="hidden h-8 w-8 sm:flex sm:h-auto sm:w-auto"
          onClick={() => setIsPreAppointmentModalOpen(true)}
        >
          <PlusIcon className="!h-5 !w-5" />
          <span className="hidden lg:inline">Crear pre-cita</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </div>
      </div>

      <CreatePreAppointmentModal
        open={isPreAppointmentModalOpen}
        onOpenChange={handlePreAppointmentModalChange}
      />
    </div>
  );
};

export default Appointments;
