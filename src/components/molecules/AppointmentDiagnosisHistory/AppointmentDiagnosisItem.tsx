import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MoreVertical, Trash2, Share2 } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { Diagnosis } from '@/types/Diagnosis';
import { useSymptom } from '@/hooks/useSymptom';
import {
  diagnosisLink,
  formatToddmmyyyy,
  getDiagnosisStatusLabel,
  getDiagnosisStatusColor,
} from '@/utils';
import { Button } from '@/components/atoms/Button';
import { Dropdown } from '@/components/atoms/Dropdown';
import { DeleteDiagnosisModal } from '../DeleteDiagnosisModal';
import { Badge } from '@/components/atoms/Badge';
import { DIAGNOSIS_STATUS } from '@/constants';

interface AppointmentDiagnosisItemProps {
  diagnosis: Diagnosis;
  index: number;
  onDelete?: (diagnosisId: string) => void;
}

export const AppointmentDiagnosisItem = ({
  diagnosis,
  index,
  onDelete,
}: AppointmentDiagnosisItemProps) => {
  const { symptom } = useSymptom(diagnosis);
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
    copyDiagnosis(diagnosisLink(diagnosis));
  };

  const handleConfirmDelete = async () => {
    if (onDelete && diagnosis._id) {
      await onDelete(diagnosis._id);
      setShowDeleteModal(false);
    }
  };

  // Determinar si el diagnóstico es redireccionable
  // Solo es redireccionable si está en estado "ASSIGN_OBD_CODES" o superior
  const isRedirectable =
    diagnosis.status === DIAGNOSIS_STATUS.ASSIGN_OBD_CODES ||
    diagnosis.status === DIAGNOSIS_STATUS.PRELIMINARY ||
    diagnosis.status === DIAGNOSIS_STATUS.IN_REPARATION ||
    diagnosis.status === DIAGNOSIS_STATUS.REPAIRED;

  const cardContent = (
    <div
      key={diagnosis._id}
      className={`border-b last:border-b-0 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      } transition-colors duration-200 ${isRedirectable ? 'cursor-pointer hover:bg-[#EAF2FD]' : ''}`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center">
            <p className="text-muted mr-2 text-xs sm:text-sm">
              Fecha:{' '}
              {diagnosis.createdAt ? formatToddmmyyyy(new Date(diagnosis.createdAt)) || '-' : '-'}
            </p>
            <Badge
              variant="outline"
              className={`${getDiagnosisStatusColor(diagnosis.status)} truncate px-2 py-0.5 text-xs font-medium`}
            >
              {getDiagnosisStatusLabel(diagnosis.status)}
            </Badge>
          </div>

          {/* Dropdown de opciones */}
          {onDelete && (
            <div onClick={(e) => e.preventDefault()}>
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
            </div>
          )}
        </div>

        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900">
            {diagnosis.car?.brand} {diagnosis.car?.model}
          </p>
          <p className="text-xs text-gray-500">{diagnosis.car?.plate || diagnosis.car?.vinCode}</p>
        </div>

        {symptom && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Síntomas reportados:</p>
            <p className="line-clamp-2 text-sm text-gray-700">{symptom}</p>
          </div>
        )}

        {!isRedirectable && (
          <div className="mt-2">
            <p className="text-xs text-amber-600">
              ⚠️ Este diagnóstico aún no está disponible para revisión
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isRedirectable ? <Link to={diagnosisLink(diagnosis)}>{cardContent}</Link> : cardContent}

      {/* Modal de confirmación de eliminación - fuera del Link */}
      <DeleteDiagnosisModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
