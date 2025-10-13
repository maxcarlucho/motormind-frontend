import { BarChartIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { DocumentLink } from '@/types/Diagnosis';
import PartDiagramItem from '@/components/molecules/PartDiagramItem';
import { useAuth } from '@/context/Auth.context';
import { useLiveViewSessions } from '@/context/LiveViewSessions.context';
// import { useBrowserbaseDisconnect } from '@/hooks/useBrowserbaseDisconnect';
import { SearchResourceButton } from '@/components/atoms/SearchResourceButton';
import { ApiService } from '@/service/api.service';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/atoms/Dialog';
import Spinner from '@/components/atoms/Spinner';
// import { LiveViewSession } from '@/types/LiveViewSession';

const diagramLoadingMessages = [
  'Buscando diagramas... esta operación puede tardar varios segundos',
  'Accediendo a documentación técnica del fabricante...',
  'Analizando la avería y localizando diagramas relevantes...',
  'Explorando secciones técnicas en busca de esquemas de piezas...',
  'Preparando recursos visuales para facilitar la reparación...',
];

const electricalDiagramLoadingMessages = [
  'Buscando diagramas eléctricos... esta operación puede tardar varios segundos',
  'Accediendo a HaynesPro WorkshopData...',
  'Navegando a sección de esquemas eléctricos...',
  'Extrayendo enlaces de documentación técnica...',
  'Preparando diagramas de cableado para facilitar la reparación...',
];

type EstimatedResourcesProps = {
  estimatedResources: {
    parts: [
      {
        name: string;
        price: number;
        quality: string;
      },
    ];
    laborHours: number;
    partsDiagrams?: DocumentLink[];
  };
  diagnosisId: string;
  electricalDiagrams?: DocumentLink[];
  carId: string;
};

// Componente interno para el modal de Live View (temporalmente comentado)
// const LiveViewDialog: React.FC<{ session: LiveViewSession }> = ({ session }) => {
//   const { minimizeSession, markSessionDisconnected } = useLiveViewSessions();
//   // ... código comentado temporalmente
// };

export const EstimatedResources = ({
  estimatedResources,
  diagnosisId,
  electricalDiagrams,
  carId,
}: EstimatedResourcesProps) => {
  const { user } = useAuth();
  const apiService = ApiService.getInstance();
  const { addSession, updateSession, getActiveSessions, removeSession, minimizeSession, sessions } =
    useLiveViewSessions();

  const [diagramResults, setDiagramResults] = useState<DocumentLink[] | null>(
    estimatedResources.partsDiagrams || null,
  );

  const [electricalResults, setElectricalResults] = useState<DocumentLink[] | null>(
    electricalDiagrams || null,
  );

  // Estado local temporal para mantener funcionamiento
  const [currentLiveViewUrl, setCurrentLiveViewUrl] = useState<string | null>(null);
  const [isCurrentModalOpen, setIsCurrentModalOpen] = useState(false);
  const [currentModalTitle, setCurrentModalTitle] = useState<string>('');

  const fetchDiagramsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiService.get<DocumentLink[]>(
        `/diagnoses/${diagnosisId}/failure-diagrams`,
      );
      if (res.status !== 200) throw new Error('No se pudo buscar diagramas');
      return res.data || [];
    },
    onSuccess: (data) => {
      setDiagramResults(data);
    },
    onError: (error) => {
      console.error('Error fetching diagrams:', error);
      setDiagramResults([]);
    },
  });

  const fetchElectricalDiagramsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiService.get<{ data: { diagrams: DocumentLink[] } }>(
        `/diagnoses/${diagnosisId}/electrical-diagrams?carId=${carId}`,
      );
      if (res.status !== 200) throw new Error('No se pudo buscar diagramas eléctricos');
      return res.data?.data?.diagrams || [];
    },
    onSuccess: (data) => {
      setElectricalResults(data);
    },
    onError: (error) => {
      console.error('Error fetching electrical diagrams:', error);
      setElectricalResults([]);
    },
  });

  const initiateLiveViewMutation = useMutation({
    mutationFn: async (linkUrl: string) => {
      const res = await apiService.post<{ success: boolean; liveViewUrl?: string; error?: string }>(
        `/diagnoses/${diagnosisId}/initiate-live-view`,
        { linkUrl, linkLabel: 'Diagrama Eléctrico' }, // Usar un label genérico por ahora
      );
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.error || 'No se pudo iniciar Live View');
      }
      return res.data.liveViewUrl!;
    },
    onSuccess: (url) => {
      setCurrentLiveViewUrl(url);
      setIsCurrentModalOpen(true);

      // Actualizar la sesión más reciente con la URL
      const activeSessions = getActiveSessions();
      if (activeSessions.length > 0) {
        const latestSession = activeSessions[activeSessions.length - 1];
        updateSession(latestSession.id, {
          liveViewUrl: url,
        });
      }
    },
    onError: (error) => {
      console.error('Error initiating live view:', error);
      enqueueSnackbar('Error al abrir el diagrama en Live View', { variant: 'error' });

      // Remover la sesión más reciente si hay error
      const activeSessions = getActiveSessions();
      if (activeSessions.length > 0) {
        const latestSession = activeSessions[activeSessions.length - 1];
        removeSession(latestSession.id);
      }
    },
  });

  // Escuchar cuando una sesión se activa desde el floater
  useEffect(() => {
    const activeSession = sessions.find((session) => session.isActive);

    if (activeSession) {
      // Abrir el modal si hay una sesión activa (con o sin URL)
      setCurrentLiveViewUrl(activeSession.liveViewUrl || null);
      setCurrentModalTitle(activeSession.label);
      setIsCurrentModalOpen(true);

      // Si la sesión no tiene URL pero está activa, significa que está cargando
      // No necesitamos hacer nada más, el spinner ya se mostrará
    }
  }, [sessions]);

  const handleElectricalDiagramClick = (linkUrl: string, linkLabel: string) => {
    // Agregar sesión al context
    addSession({
      linkUrl,
      liveViewUrl: '', // Se actualizará cuando llegue la respuesta
      label: linkLabel,
      isActive: true,
      isConnected: true,
      diagnosisId,
    });

    // Abrir modal inmediatamente con spinner
    setCurrentModalTitle(linkLabel);
    setIsCurrentModalOpen(true);
    setCurrentLiveViewUrl(null); // Limpiar URL anterior

    // Iniciar la mutación para obtener la Live View URL
    initiateLiveViewMutation.mutate(linkUrl);
  };

  // const activeSessions = getActiveSessions();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-md bg-green-100 p-2">
          <BarChartIcon className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
        </div>
        <h2 className="text-sm font-semibold sm:text-lg">PRESUPUESTO ORIENTATIVO / RECURSOS</h2>
      </div>

      <p className="text-muted mb-4 text-xs italic sm:text-sm">
        *Estimación basada en tiempos estándar. Verificar precios de repuestos con proveedor y
        aplicar tarifa de mano de obra de cliente.*
      </p>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-2 sm:p-4">
          <h3 className="mb-3 text-sm font-medium sm:text-base">Repuestos Sugeridos</h3>
          <ul className="list-disc space-y-2 pl-4 sm:pl-6">
            {estimatedResources.parts?.map((part, index) => (
              <li key={index} className="text-muted text-xs sm:text-base">
                {`${part?.name} ${part?.quality}`}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-gray-50 p-2 sm:p-4">
          <h3 className="mb-1 text-sm font-medium sm:mb-3 sm:text-base">Mano de Obra Estimada</h3>
          <div className="text-lg font-semibold sm:text-xl">
            {estimatedResources.laborHours} Horas
          </div>
          <p className="text-muted mt-2 text-xs sm:text-sm">
            Incluye diagnóstico, desmontaje, reemplazo y pruebas finales.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <SearchResourceButton
          buttonText="Buscar diagramas de piezas"
          resourceName="diagramas"
          loadingMessages={diagramLoadingMessages}
          onClick={() => fetchDiagramsMutation.mutate()}
          isLoading={fetchDiagramsMutation.isPending}
          resultsData={diagramResults}
          userHasVendorResources={user.hasVendorResources}
          renderItem={(item: DocumentLink) => (
            <PartDiagramItem
              key={item.label + item.url}
              title={item.label}
              type="document"
              onClick={() => window.open(item.url, '_blank')}
            />
          )}
        />
      </div>

      <div className="mt-8">
        <SearchResourceButton
          buttonText="Buscar diagramas eléctricos"
          resourceName="diagramas eléctricos"
          loadingMessages={electricalDiagramLoadingMessages}
          onClick={() => fetchElectricalDiagramsMutation.mutate()}
          isLoading={fetchElectricalDiagramsMutation.isPending}
          resultsData={electricalResults}
          userHasVendorResources={user.hasVendorResources}
          renderItem={(item: DocumentLink) => (
            <PartDiagramItem
              key={item.label + item.url}
              title={item.label}
              type="document"
              onClick={() => handleElectricalDiagramClick(item.url, item.label)}
            />
          )}
        />
      </div>

      <Dialog
        open={isCurrentModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Al cerrar el modal, minimizar la sesión más reciente
            const activeSessions = getActiveSessions();
            if (activeSessions.length > 0) {
              const latestSession = activeSessions[activeSessions.length - 1];
              minimizeSession(latestSession.id);
            }
          }
          setIsCurrentModalOpen(open);
        }}
      >
        <DialogContent
          className="grid h-[90vh] w-[90vw] max-w-none grid-rows-[auto_1fr] gap-0 rounded-none border-none bg-white p-0 shadow-none"
          closeButton={false}
        >
          {/* Header personalizado con botón de cerrar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {currentModalTitle}
            </DialogTitle>
            <DialogClose className="cursor-pointer rounded-full p-1 opacity-70 transition-opacity hover:bg-gray-100 hover:opacity-100 disabled:pointer-events-none">
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
          </div>

          {/* Body del modal */}
          <div className="relative overflow-hidden bg-white">
            {(initiateLiveViewMutation.isPending || !currentLiveViewUrl) && (
              <div className="flex h-full items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Spinner label="Iniciando sesión remota..." />
                  <p className="mt-4 text-sm text-gray-600">
                    Conectando con HaynesPro WorkshopData...
                  </p>
                  {initiateLiveViewMutation.isPending && (
                    <p className="mt-2 text-xs text-gray-500">Esto puede tomar unos segundos</p>
                  )}
                </div>
              </div>
            )}
            {currentLiveViewUrl && !initiateLiveViewMutation.isPending && (
              <iframe
                src={currentLiveViewUrl}
                className="absolute inset-0 h-full w-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                allow="clipboard-read; clipboard-write; fullscreen"
                title="Diagrama Eléctrico - HaynesPro Live View"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
