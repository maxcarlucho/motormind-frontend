import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { FileSearch, PlusIcon, SearchIcon } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { diagnosisLink, formatDate, getDiagnosisStatusLabel } from '@/utils';
import { useApi } from '@/hooks/useApi';
import { Diagnosis } from '@/types/Diagnosis';
import apiService from '@/service/api.service';
import Spinner from '@/components/atoms/Spinner';
import { DiagnosticListItem } from '@/components/molecules/DiagnosticListItem';
import { CreateDiagnosticModal } from '@/components/organisms/CreateDiagnosticModal';
import { DIAGNOSIS_STATUS } from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/Select';
import { FloatingButton } from '@/components/atoms/FloatingButton';
import { useEffect, useState } from 'react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';

const LIMIT = 1000;

const Diagnoses = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const queryClient = useQueryClient();
  const { execute: getDiagnosesRequest } = useApi<{ data: Diagnosis[]; total: number }>(
    'get',
    '/diagnoses',
  );

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page when search changes
    }, 800);

    handler();
    return () => {
      handler.cancel();
    };
  }, [searchTerm]);

  const {
    data: { data: diagnoses = [] } = { data: [] },
    isLoading: isLoadingDiagnoses,
    isError,
    error,
  } = useQuery<{ data: Diagnosis[]; total: number }>({
    queryKey: ['diagnoses', debouncedSearchTerm, currentPage, selectedStatus],
    queryFn: async () => {
      const response = await getDiagnosesRequest(
        undefined,
        {
          ...(debouncedSearchTerm.trim() ? { search: debouncedSearchTerm } : {}),
          ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
          limit: LIMIT.toString(),
          page: currentPage.toString(),
        },
        undefined,
      );
      return response.data;
    },
    enabled: true,
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    if (isError && error) {
      enqueueSnackbar(`Error: No se pudieron obtener los diagnósticos`, { variant: 'error' });
    }
  }, [isError, error]);

  // const handlePreviousPage = () => {
  //   if (currentPage > 1) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // };

  // const handleNextPage = () => {
  //   const totalPages = Math.ceil(total / LIMIT);
  //   if (currentPage < totalPages) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // };

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    try {
      await apiService.deleteDiagnosis(diagnosisId);
      enqueueSnackbar('Diagnóstico eliminado correctamente', { variant: 'success' });

      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      queryClient.invalidateQueries({ queryKey: ['getDiagnosesByCarId'] });
      queryClient.removeQueries({ queryKey: ['getDiagnosisById', diagnosisId] });
      queryClient.removeQueries({ queryKey: ['diagnosis', diagnosisId] });
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      enqueueSnackbar('Error al eliminar el diagnóstico', { variant: 'error' });
    }
  };

  return (
    <div className="flex flex-grow flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 flex flex-col items-center justify-between bg-white px-6 py-2 shadow-xs sm:flex-row sm:px-8 sm:py-4 lg:flex-row">
        <div className="lg:w-1/3">
          <h1 className="mr-2 py-0.5 text-xl font-semibold sm:py-0 lg:text-2xl">Diagnósticos</h1>
          <p className="text-muted hidden xl:block">
            Gestiona y revisa todos los diagnósticos del taller
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2 space-y-2 sm:mt-0 sm:w-auto sm:flex-row sm:space-y-0 sm:space-x-2 lg:w-2/3">
          <div className="relative mb-0 flex-grow xl:min-w-[300px]">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              className="h-8 w-full rounded-md py-2 pr-4 pl-9 sm:h-10"
              placeholder="Buscar por vehículo o problema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 w-full sm:h-10">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value={DIAGNOSIS_STATUS.GUIDED_QUESTIONS}>
                  {getDiagnosisStatusLabel(DIAGNOSIS_STATUS.GUIDED_QUESTIONS)}
                </SelectItem>
                <SelectItem value={DIAGNOSIS_STATUS.ASSIGN_OBD_CODES}>
                  {getDiagnosisStatusLabel(DIAGNOSIS_STATUS.ASSIGN_OBD_CODES)}
                </SelectItem>
                <SelectItem value={DIAGNOSIS_STATUS.PRELIMINARY}>
                  {getDiagnosisStatusLabel(DIAGNOSIS_STATUS.PRELIMINARY)}
                </SelectItem>
                <SelectItem value={DIAGNOSIS_STATUS.IN_REPARATION}>
                  {getDiagnosisStatusLabel(DIAGNOSIS_STATUS.IN_REPARATION)}
                </SelectItem>
                <SelectItem value={DIAGNOSIS_STATUS.REPAIRED}>
                  {getDiagnosisStatusLabel(DIAGNOSIS_STATUS.REPAIRED)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden h-8 w-8 sm:flex sm:h-auto sm:w-auto"
          >
            <PlusIcon className="!h-5 !w-5" />
            <span className="hidden lg:inline">Nuevo diagnóstico</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
          {isLoadingDiagnoses ? (
            <div className="flex items-center justify-center">
              <Spinner className="mt-5" />
            </div>
          ) : diagnoses.length > 0 ? (
            <>
              {diagnoses.map((diagnosis, index) => (
                <DiagnosticListItem
                  key={index}
                  vehicle={diagnosis.car}
                  summary={[diagnosis.fault, diagnosis.answers]}
                  problems={diagnosis.preliminary?.possibleReasons?.map(({ title }) => title) || []}
                  questions={diagnosis.questions || []}
                  technician={diagnosis.createdBy}
                  status={
                    diagnosis.status as (typeof DIAGNOSIS_STATUS)[keyof typeof DIAGNOSIS_STATUS]
                  }
                  timestamp={formatDate(diagnosis.createdAt)}
                  diagnosisLink={diagnosisLink(diagnosis, true)}
                  diagnosisId={diagnosis._id!}
                  onDelete={handleDeleteDiagnosis}
                />
              ))}
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <FileSearch className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium">No se encontraron diagnósticos</h3>
              <p className="mb-4 text-gray-500">Intenta buscar nuevos diagnósticos.</p>
            </div>
          )}
        </div>

        {/* Fixed Footer with Pagination */}
        {/* {diagnoses.length > 0 && (
          <div className="sticky bottom-0">
            <Pagination
              total={total}
              currentPage={currentPage}
              handlePreviousPage={handlePreviousPage}
              handleNextPage={handleNextPage}
              limit={LIMIT}
            />
          </div>
        )} */}
      </div>

      <CreateDiagnosticModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        submitButtonText="Comenzar diagnóstico"
      />
      <div className="sm:hidden">
        <FloatingButton onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="!h-5 !w-5" />
        </FloatingButton>
      </div>
    </div>
  );
};

export default Diagnoses;
