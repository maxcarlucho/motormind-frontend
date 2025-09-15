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

interface FaultsHistoryItemProps {
  diagnosis: Diagnosis;
  index: number;
  onDelete?: (diagnosisId: string) => void;
}

export const FaultsHistoryItem = ({ diagnosis, index, onDelete }: FaultsHistoryItemProps) => {
  const { symptom } = useSymptom(diagnosis);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyDiagnosis = () => {
    const link = `${window.location.origin}${diagnosisLink(diagnosis)}`;
    navigator.clipboard.writeText(link);
    enqueueSnackbar('🔗 Link del diagnóstico copiado', { variant: 'success' });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false); // Cerramos el dropdown
    setShowDeleteModal(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false); // Cerramos el dropdown
    copyDiagnosis();
  };

  const handleConfirmDelete = async () => {
    if (onDelete && diagnosis._id) {
      await onDelete(diagnosis._id);
      // Cerramos el modal después de que el componente padre haya hecho el refresco
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Link to={diagnosisLink(diagnosis)}>
        <div
          key={diagnosis._id}
          className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-colors duration-200 hover:bg-[#EAF2FD]`}
        >
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1 sm:flex-row sm:items-center">
                <p className="text-muted mr-2 text-xs sm:text-sm">
                  Fecha:{' '}
                  {diagnosis.createdAt
                    ? formatToddmmyyyy(new Date(diagnosis.createdAt)) || '-'
                    : '-'}
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
                        className="h-6 w-6 p-0"
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
            <p className="mt-2 text-sm font-medium sm:mt-0 sm:text-base">{symptom}</p>
          </div>
        </div>
      </Link>

      {/* Modal de confirmación */}
      <DeleteDiagnosisModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
