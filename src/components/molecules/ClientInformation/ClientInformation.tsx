import { CalendarIcon, PhoneIcon, UserIcon } from 'lucide-react';
import { Appointment } from '@/types/Appointment';
import { formatAppointmentDateTime } from '@/utils';

type ClientInformationProps = {
  appointment?: Appointment | null;
  minimized?: boolean;
};

const ClientInformation: React.FC<ClientInformationProps> = ({
  appointment,
  minimized = false,
}) => {
  if (minimized) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-100 p-2">
              <UserIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-muted text-xs sm:text-sm">Cliente</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment
                  ? `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim() ||
                    'Sin nombre'
                  : 'Sin datos'}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-md bg-blue-100 p-2">
              <PhoneIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-muted text-xs sm:text-sm">Teléfono</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment?.client?.phone || 'Sin teléfono'}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-md bg-blue-100 p-2">
              <CalendarIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-muted text-xs sm:text-sm">Fecha agendada</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment
                  ? formatAppointmentDateTime(
                      appointment.reception?.date || '',
                      appointment.reception?.time || '',
                    )
                  : 'Sin fecha'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
      <h5 className="text-md mb-2 font-medium sm:text-lg">Información del cliente</h5>

      <div className="container space-y-2 sm:space-y-0">
        <div className="grids-cols-1 grid gap-2 space-y-1 sm:grid-cols-2 sm:gap-4 sm:space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon className="text-muted mr-2 !h-5 !w-5" />
            <div>
              <p className="text-muted mb-0 text-xs sm:text-sm">Nombre completo</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment
                  ? `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim() ||
                    '-'
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PhoneIcon className="text-muted mr-2 !h-5 !w-5" />
            <div>
              <p className="text-muted mb-0 text-xs sm:text-sm">Teléfono</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment?.client?.phone || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="text-muted mr-2 !h-5 !w-5" />
            <div>
              <p className="text-muted mb-0 text-xs sm:text-sm">Fecha agendada</p>
              <p className="text-sm font-medium sm:text-base">
                {appointment
                  ? formatAppointmentDateTime(
                      appointment.reception?.date || '',
                      appointment.reception?.time || '',
                    )
                  : '-'}
              </p>
            </div>
          </div>

          {appointment?.client?.email && (
            <div className="flex items-center gap-2">
              <div className="text-muted mr-2 flex !h-5 !w-5 items-center justify-center">@</div>
              <div>
                <p className="text-muted mb-0 text-xs sm:text-sm">Email</p>
                <p className="text-sm font-medium sm:text-base">{appointment.client.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientInformation;
