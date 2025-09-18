import { CalendarIcon, PhoneIcon, UserIcon, ClockIcon } from 'lucide-react';
import { formatDate, getDiagnosisStatusLabel, getDiagnosisStatusColor } from '@/utils';
import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/utils/cn';
import { Appointment } from '@/types/Appointment';

interface AppointmentCardProps {
  appointment: Appointment;
  className?: string;
}

export const AppointmentCard = ({ appointment, className }: AppointmentCardProps) => {
  const { client, reception, status, createdAt, diagnosisStatus } = appointment;

  // Formatear nombre del cliente
  const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || '—';

  // Formatear teléfono
  const phoneDisplay = client.phone || '—';

  // Formatear fecha agendada
  const scheduledDate =
    reception.date && reception.time ? `${reception.date} ${reception.time}` : '—';

  // Formatear agente
  const agentName = reception.agent?.name || '—';

  // Formatear timestamp relativo
  const timestamp = formatDate(createdAt);

  // Usar el status del diagnóstico si está disponible, sino usar el status del appointment
  const displayStatus = diagnosisStatus || status;
  const statusLabel = getDiagnosisStatusLabel(displayStatus);
  const statusColor = getDiagnosisStatusColor(displayStatus);

  return (
    <div
      className={cn(
        'mb-4 rounded-lg border border-gray-300 bg-white p-4 transition-colors duration-200 hover:bg-[#EAF2FD]',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 sm:h-10 sm:w-10">
            <CalendarIcon className="text-primary h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium sm:text-base">{clientName}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
              <PhoneIcon className="h-3 w-3" />
              {phoneDisplay}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${statusColor} truncate px-2 py-0.5 text-xs font-medium`}
          >
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          <span className="font-medium">Fecha agendada:</span>
          <span>{scheduledDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="font-medium">Agente:</span>
          <span>{agentName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Creado</span>
        </div>
        <span className="text-xs text-gray-500">{timestamp}</span>
      </div>
    </div>
  );
};
