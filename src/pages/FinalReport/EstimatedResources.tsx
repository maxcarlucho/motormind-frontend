import { BarChartIcon, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const { addSession, updateSession, removeSession, minimizeSession, sessions } =
    useLiveViewSessions();

  const [diagramResults, setDiagramResults] = useState<DocumentLink[] | null>(
    estimatedResources.partsDiagrams || null,
  );

  const [electricalResults, setElectricalResults] = useState<DocumentLink[] | null>(
    electricalDiagrams || null,
  );

  // Estado local para el modal
  const [currentModalTitle, setCurrentModalTitle] = useState<string>('');

  // Ref para guardar el sessionId de la sesión en proceso
  const currentSessionIdRef = useRef<string | null>(null);

  // Obtener la sesión activa del contexto para determinar qué mostrar
  const activeSession = sessions.find((session) => session.isActive);

  // Debug: Log cuando cambia activeSession
  console.log('[EstimatedResources] Render:', {
    sessionsCount: sessions.length,
    activeSession: activeSession
      ? {
          id: activeSession.id,
          label: activeSession.label,
          liveViewUrl: activeSession.liveViewUrl,
          isActive: activeSession.isActive,
        }
      : null,
  });

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
      console.log('[initiateLiveViewMutation] onSuccess - URL recibida:', url);

      if (currentSessionIdRef.current) {
        console.log('[initiateLiveViewMutation] Actualizando sesión:', currentSessionIdRef.current);

        updateSession(currentSessionIdRef.current, {
          liveViewUrl: url,
        });

        console.log('[initiateLiveViewMutation] Sesión actualizada con liveViewUrl');

        // Limpiar la ref
        currentSessionIdRef.current = null;
      }

      // El modal ya está abierto, solo actualizamos la sesión en el contexto
      // El renderizado del modal se actualizará automáticamente
    },
    onError: (error) => {
      console.error('Error initiating live view:', error);
      enqueueSnackbar('Error al abrir el diagrama en Live View', { variant: 'error' });

      // Remover la sesión si hay error
      if (currentSessionIdRef.current) {
        removeSession(currentSessionIdRef.current);
        currentSessionIdRef.current = null;
      }
    },
  });

  // Escuchar cuando una sesión se activa desde el floater
  useEffect(() => {
    if (activeSession) {
      // Actualizar el título cuando se activa una sesión
      setCurrentModalTitle(activeSession.label);
    }
  }, [activeSession]);

  const handleElectricalDiagramClick = (linkUrl: string, linkLabel: string) => {
    console.log('[handleElectricalDiagramClick] Click en diagrama:', linkLabel);

    // Agregar sesión al context
    const sessionId = addSession({
      linkUrl,
      liveViewUrl: '', // Se actualizará cuando llegue la respuesta
      label: linkLabel,
      isActive: true,
      isConnected: true,
      diagnosisId,
    });

    // Guardar el sessionId en la ref para usarlo en el onSuccess/onError de la mutación
    currentSessionIdRef.current = sessionId;

    console.log('[handleElectricalDiagramClick] Sesión creada con ID:', sessionId);

    // La sesión se crea como activa, el modal se abrirá automáticamente
    setCurrentModalTitle(linkLabel);

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
        open={!!activeSession}
        onOpenChange={(open) => {
          if (!open && activeSession) {
            // Al cerrar el modal, minimizar la sesión activa
            minimizeSession(activeSession.id);
          }
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
            {(() => {
              const liveViewUrl = activeSession?.liveViewUrl;

              console.log('[Modal Render] liveViewUrl:', liveViewUrl);

              // Mostrar spinner si no hay URL todavía (basado solo en el estado de la sesión)
              if (!liveViewUrl || liveViewUrl === '') {
                console.log('[Modal Render] Mostrando SPINNER');

                return (
                  <div className="flex h-full items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Spinner label="Iniciando sesión remota..." />
                      <p className="mt-4 text-sm text-gray-600">
                        Conectando con HaynesPro WorkshopData...
                      </p>
                      <p className="mt-2 text-xs text-gray-500">Esto puede tomar unos segundos</p>
                    </div>
                  </div>
                );
              }

              // Mostrar iframe si hay URL válida
              console.log('[Modal Render] Mostrando IFRAME con URL:', liveViewUrl);

              return (
                <iframe
                  src={liveViewUrl}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                  allow="clipboard-read; clipboard-write; fullscreen"
                  title="Diagrama Eléctrico - HaynesPro Live View"
                />
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
