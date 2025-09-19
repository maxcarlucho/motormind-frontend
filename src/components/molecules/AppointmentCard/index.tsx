import { Appointment } from '@/types/Appointment';
import { formatDate, formatAppointmentDateTime } from '@/utils';
import { cn } from '@/utils/cn';
import { CalendarIcon, ClockIcon, PhoneIcon, AlertTriangleIcon } from 'lucide-react';
import { CreatedByUser } from '@/components/molecules/CreatedByUser';
import { Link } from 'react-router-dom';

interface AppointmentCardProps {
  appointment: Appointment;
  className?: string;
}

export const AppointmentCard = ({ appointment, className }: AppointmentCardProps) => {
  const { client, reception, createdAt, createdBy, diagnosis } = appointment;

  const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || '—';
  const phoneDisplay = client.phone || '—';
  const scheduledDate = formatAppointmentDateTime(reception.date || '', reception.time || '');
  const timestamp = formatDate(createdAt);
  const symptom = diagnosis?.symptoms || null;

  const cardContent = (
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
      </div>

      <div className="mb-2 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          <span className="font-medium">Fecha agendada:</span>
          <span>{scheduledDate}</span>
        </div>
        
        {symptom && (
          <div className="flex items-start gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium">Síntoma:</span>
              <span className="ml-1">{symptom}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <CreatedByUser user={createdBy} />
        <span className="ml-auto text-xs text-gray-500">{timestamp}</span>
      </div>
    </div>
  );

  return <Link to={`/appointments/${appointment._id}`}>{cardContent}</Link>;
};
