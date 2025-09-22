import { CarIcon, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { CreatedByUser } from '@/components/molecules/CreatedByUser';
import { cn } from '@/utils/cn';
import { getDiagnosisStatusLabel, getDiagnosisStatusColor } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { DIAGNOSIS_STATUS } from '@/constants';
import TitledStringList from '../../atoms/TitledStringList';
import { Dropdown } from '@/components/atoms/Dropdown';
import { DeleteDiagnosisModal } from '../DeleteDiagnosisModal';

interface DiagnosticListItemProps {
  vehicle?: {
    _id: string;
    brand: string;
    model: string;
    plate: string;
    vinCode: string;
  };
  problems: string[];
  questions: string[];
  technician?: {
    name: string;
    avatar?: string;
  };
  summary: string[];
  status: (typeof DIAGNOSIS_STATUS)[keyof typeof DIAGNOSIS_STATUS];
  timestamp: string;
  className?: string;
  diagnosisLink: string;
  diagnosisId: string;
  onDelete?: (diagnosisId: string) => void;
}

export const DiagnosticListItem = ({
  vehicle,
  problems,
  questions,
  technician,
  timestamp,
  className,
  diagnosisLink,
  status,
  diagnosisId,
  summary = [],
  onDelete,
}: DiagnosticListItemProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyDiagnosis = (link: string) => {
    navigator.clipboard.writeText(link);
    enqueueSnackbar('🔗 Link del diagnóstico copiado', { variant: 'success' });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false);
    setShowDeleteModal(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false);
    copyDiagnosis(diagnosisLink);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(diagnosisId);
      setShowDeleteModal(false);
    }
  };

  // Determinar si es un estado de pre-cita (no interactivo)
  const isPreAppointmentStatus =
    (status as string) === 'WHATSAPP_AWAITING_SYMPTOM' ||
    (status as string) === 'WHATSAPP_AWAITING_QUESTIONS' ||
    (status as string) === 'WHATSAPP_COMPLETED';

  const cardContent = (
    <div
      className={cn(
        'mb-4 rounded-lg border border-gray-300 bg-white p-4',
        !isPreAppointmentStatus && 'transition-colors duration-200 hover:bg-[#EAF2FD]',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 sm:h-10 sm:w-10">
            <CarIcon className="text-primary h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium sm:text-base">
              {vehicle?.brand} {vehicle?.model}
            </p>
            <p className="text-xs text-gray-500 sm:text-sm">{vehicle?.plate || vehicle?.vinCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          {status && (
            <Badge
              variant="outline"
              className={`${getDiagnosisStatusColor(status)} truncate px-2 py-0.5 text-xs font-medium`}
            >
              {getDiagnosisStatusLabel(status)}
            </Badge>
          )}

          {/* Dropdown de opciones - solo para estados no pre-cita */}
          {!isPreAppointmentStatus && (
            <Dropdown.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <Dropdown.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Content>
                <Dropdown.Item
                  onClick={handleShareClick}
                  className="focus:bg-blue-50 focus:text-blue-600"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir diagnóstico
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={handleDeleteClick}
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar diagnóstico
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Root>
          )}
        </div>
      </div>

      {status === DIAGNOSIS_STATUS.GUIDED_QUESTIONS ? (
        <TitledStringList title="Preguntas guiadas:" items={questions} />
      ) : status === DIAGNOSIS_STATUS.ASSIGN_OBD_CODES ? (
        <TitledStringList title="Asignar Códigos OBD:" items={summary} />
      ) : status === DIAGNOSIS_STATUS.PRELIMINARY ? (
        <TitledStringList title="Potenciales averías:" items={problems} />
      ) : (
        <TitledStringList title="Problemas detectados:" items={problems} />
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <CreatedByUser user={technician} />
        </div>
        <span className="text-xs text-gray-500">{timestamp}</span>
      </div>
    </div>
  );

  return (
    <>
      {isPreAppointmentStatus ? (
        // Card no interactiva para estados de pre-cita
        cardContent
      ) : (
        // Card interactiva para otros estados
        <Link to={`/cars${diagnosisLink.split('/cars')[1]}`}>{cardContent}</Link>
      )}

      {/* Modal de confirmación de eliminación - fuera del Link */}
      <DeleteDiagnosisModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
