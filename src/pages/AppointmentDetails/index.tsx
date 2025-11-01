import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { Appointment } from '@/types/Appointment';
import apiService from '@/service/api.service';
import VehicleInformation from '@/components/molecules/VehicleInformation/VehicleInformation';
import ClientInformation from '@/components/molecules/ClientInformation/ClientInformation';
import AppointmentDiagnosis from '@/components/molecules/AppointmentDiagnosis/AppointmentDiagnosis';
import AppointmentDiagnosisHistory from '@/components/molecules/AppointmentDiagnosisHistory/AppointmentDiagnosisHistory';
import Spinner from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import HeaderPage from '@/components/molecules/HeaderPage';
import { PlusIcon } from 'lucide-react';
import DetailsContainer from '@/components/atoms/DetailsContainer';

const AppointmentDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['getAppointmentById'] });
    };
  }, [params.appointmentId, queryClient]);

  const {
    data: appointment = null,
    isLoading: isLoadingAppointment,
    isError,
  } = useQuery<Appointment | null>({
    queryKey: ['getAppointmentById', params.appointmentId],
    queryFn: async () => {
      const response = await apiService.getAppointmentById(params.appointmentId as string);
      return response.data;
    },
    enabled: !!params.appointmentId,
    staleTime: 60000, // 1 minute
    retry: 0,
  });

  const clientName = appointment
    ? `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim() || '—'
    : '—';

  if (isLoadingAppointment)
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2">
        <Spinner />
      </div>
    );

  if (isError || !appointment) {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
        <div className="text-destructive flex items-center gap-2 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error al cargar los datos de la cita</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/appointments')}>
          Volver atrás
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <HeaderPage
        onBack={() => navigate('/appointments')}
        data={{
          title: 'Detalles de la Cita',
          description: `${clientName}${appointment?.car ? ` - ${appointment.car.brand} ${appointment.car.model}` : ''}`,
        }}
        headerActions={
          appointment?.car?._id && (
            <Button
              onClick={() =>
                navigate(
                  `/appointments/${params.appointmentId}/cars/${appointment.car!._id}/new-diagnosis`,
                )
              }
            >
              <PlusIcon className="!h-5 !w-5" />
              <span className="hidden sm:inline">Nuevo diagnóstico</span>
            </Button>
          )
        }
      />
      <DetailsContainer>
        {/* Información del cliente */}
        <ClientInformation appointment={appointment} />

        {/* Información del vehículo */}
        {appointment?.car && (
          <VehicleInformation car={appointment.car} editMode={false} minimized={false} />
        )}

        {/* Diagnóstico relacionado */}
        {appointment?.diagnosisId && (
          <AppointmentDiagnosis diagnosisId={appointment.diagnosisId} appointment={appointment} />
        )}

        {/* Historial de diagnósticos */}
        {appointment?.car?._id && (
          <AppointmentDiagnosisHistory
            appointmentId={params.appointmentId as string}
            carId={appointment.car._id}
          />
        )}
      </DetailsContainer>
    </div>
  );
};

export default AppointmentDetails;
