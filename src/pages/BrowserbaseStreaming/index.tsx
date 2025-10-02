import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { Loader2, Play, Square, Download, RefreshCw, Eye } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  message: string;
  data?: unknown;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SummaryData {
  initialStatus?: string;
  login?: string;
  finalStatus?: string;
  screenshot?: string;
  message?: string;
}

const BrowserbaseStreamingPage: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);
  const [isLiveViewConnected, setIsLiveViewConnected] = useState<boolean>(true);
  const logIdRef = useRef(0);

  const addLog = (
    event: string,
    message: string,
    data?: unknown,
    type: LogEntry['type'] = 'info',
  ) => {
    const newLog: LogEntry = {
      id: `log-${++logIdRef.current}`,
      timestamp: new Date().toLocaleTimeString(),
      event,
      message,
      data,
      type,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const getEventTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getLiveViewUrl = async () => {
    try {
      console.log('🔍 [FRONTEND] Obteniendo Live View URL...');
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/v1/browserbase/live-view-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] Respuesta del endpoint:', data);

      if (data.success && data.liveViewUrl) {
        console.log('✅ [FRONTEND] Live View URL obtenida:', data.liveViewUrl);
        setLiveViewUrl(data.liveViewUrl);
        setIsLiveViewConnected(true);
        addLog('live-view', `Live View URL obtenida: ${data.liveViewUrl}`, data, 'success');
      } else {
        console.log('❌ [FRONTEND] Error obteniendo Live View URL:', data.error);
        addLog('live-view-error', `Error: ${data.error}`, data, 'error');
      }
    } catch (error: unknown) {
      console.error('❌ [FRONTEND] Error obteniendo Live View URL:', error);
      addLog(
        'live-view-error',
        `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error,
        'error',
      );
    }
  };

  const checkSessionStatus = async () => {
    try {
      console.log('🔍 [FRONTEND] Verificando estado de sesión de Browserbase...');
      addLog('check-session', 'Verificando estado de sesión...', null, 'info');

      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/v1/browserbase/session-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [FRONTEND] Estado de sesión:', result);

        if (result.success && result.liveViewUrl) {
          addLog(
            'session-active',
            `Sesión activa - Live View URL: ${result.liveViewUrl}`,
            result,
            'success',
          );
          setLiveViewUrl(result.liveViewUrl);
          setIsLiveViewConnected(true);
        } else {
          addLog('session-inactive', 'Sesión no activa o expirada', result, 'warning');
          setLiveViewUrl(null);
          setIsLiveViewConnected(false);
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('❌ [FRONTEND] Error verificando estado de sesión:', error);
      addLog(
        'check-session-error',
        `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error,
        'error',
      );
    }
  };

  const closeSession = async () => {
    try {
      console.log('🔍 [FRONTEND] Cerrando sesión de Browserbase...');
      addLog('close-session', 'Cerrando sesión de Browserbase...', null, 'info');

      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/v1/browserbase/close-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [FRONTEND] Sesión cerrada:', result);
        addLog(
          'close-session-success',
          'Sesión de Browserbase cerrada exitosamente',
          result,
          'success',
        );
        setLiveViewUrl(null);
        setIsLiveViewConnected(false);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('❌ [FRONTEND] Error cerrando sesión:', error);
      addLog(
        'close-session-error',
        `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error,
        'error',
      );
    }
  };

  const startStreaming = async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setLogs([]);
    setCurrentStep(null);
    setSummary(null);
    setScreenshot(null);
    setError(null);
    setLiveViewUrl(null);
    setIsLiveViewConnected(true);

    addLog('start', 'Iniciando conexión con el endpoint de streaming...', null, 'info');

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${backendUrl}/api/v1/browserbase/haynespro-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'max.carlucho@addiventures.com',
          password: 'Carlucho@2025#',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        addLog(
          'connection-error',
          `Error del servidor: ${errorData.message || response.statusText}`,
          { error: errorData },
          'error',
        );
        setIsStreaming(false);
        setError(`Error del servidor: ${errorData.message || response.statusText}`);
        return;
      }

      addLog('connection', 'Conexión establecida con el servidor', null, 'success');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        addLog('connection-error', 'No se pudo obtener el stream de datos', null, 'error');
        setIsStreaming(false);
        setError('No se pudo obtener el stream de datos');
        return;
      }

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const eventString of events) {
              if (eventString.startsWith('event: ')) {
                const eventType = eventString.substring(7, eventString.indexOf('\n'));
                const dataString = eventString.substring(eventString.indexOf('data: ') + 6);
                try {
                  const data = JSON.parse(dataString);
                  handleStreamingEvent(eventType, data);
                } catch (parseError) {
                  addLog(
                    'parse-error',
                    'Error parseando datos del servidor',
                    { error: parseError, data: dataString },
                    'error',
                  );
                }
              }
            }
          }
        } catch (streamError) {
          addLog('stream-error', 'Error procesando el stream', { error: streamError }, 'error');
          setIsStreaming(false);
          setError('Error procesando el stream');
        }
      };

      processStream();
    } catch (err) {
      addLog('init-error', 'Error inicializando streaming', { error: err }, 'error');
      setIsStreaming(false);
      setError('Error inicializando streaming');
    }
  };

  const handleStreamingEvent = (eventType: string, data: unknown) => {
    console.log(`📡 [FRONTEND] ===== EVENTO RECIBIDO =====`);
    console.log(`📡 [FRONTEND] Evento: ${eventType}`);
    console.log(`📡 [FRONTEND] Data:`, data);
    console.log(`📡 [FRONTEND] =========================`);

    let logType: LogEntry['type'] = 'info';
    const message = (data as { message?: string })?.message || 'Evento recibido';

    switch (eventType) {
      case 'start':
        logType = 'info';
        break;
      case 'config':
        logType = 'success';
        break;
      case 'service':
        logType = 'success';
        break;
      case 'live-view': {
        console.log('🎯 [FRONTEND] ===== PROCESANDO EVENTO LIVE-VIEW =====');
        logType = 'success';
        const liveViewData = data as { liveViewUrl?: string };
        console.log(`🎯 [FRONTEND] liveViewData:`, liveViewData);
        console.log(`🎯 [FRONTEND] liveViewUrl: ${liveViewData.liveViewUrl}`);
        if (liveViewData.liveViewUrl) {
          console.log(
            `🎯 [FRONTEND] Estableciendo liveViewUrl en estado: ${liveViewData.liveViewUrl}`,
          );
          setLiveViewUrl(liveViewData.liveViewUrl);
          console.log(`🎯 [FRONTEND] liveViewUrl establecida exitosamente`);
        } else {
          console.log(`❌ [FRONTEND] No hay liveViewUrl en los datos`);
        }
        console.log('🎯 [FRONTEND] ======================================');
        break;
      }
      case 'live-view-error': {
        console.log('❌ [FRONTEND] ===== ERROR EN LIVE-VIEW =====');
        console.log(`❌ [FRONTEND] Error: ${message}`);
        logType = 'error';
        console.log('❌ [FRONTEND] ==============================');
        break;
      }
      case 'step':
        logType = 'info';
        setCurrentStep((data as { step?: number })?.step || null);
        break;
      case 'initial-status':
      case 'final-status':
        logType = (data as { result?: { success?: boolean } })?.result?.success
          ? 'success'
          : 'warning';
        break;
      case 'credentials':
        logType = 'info';
        break;
      case 'login-result':
        logType = (data as { result?: { success?: boolean } })?.result?.success
          ? 'success'
          : 'error';
        break;
      case 'screenshot': {
        logType = (data as { result?: string })?.result === 'Exitoso' ? 'success' : 'warning';
        const screenshotData = data as { screenshotSize?: number; screenshotData?: string };
        if (screenshotData.screenshotSize && screenshotData.screenshotSize > 0) {
          setScreenshot(
            `data:image/png;base64,${screenshotData.screenshotData || 'screenshot-available'}`,
          );
        }
        break;
      }
      case 'streaming-complete': {
        console.log('🎉 [FRONTEND] ===== STREAMING COMPLETADO =====');
        console.log(`🎉 [FRONTEND] Mensaje: ${message}`);
        logType = 'success';
        setCurrentStep(null); // Limpiar paso actual
        console.log('🎉 [FRONTEND] ================================');
        break;
      }
      case 'navigation':
        logType = (data as { result?: { success?: boolean } })?.result?.success
          ? 'success'
          : 'warning';
        break;
      case 'summary':
        logType = 'info';
        setSummary(data as SummaryData);
        break;
      case 'complete':
        logType = (data as { success?: boolean })?.success ? 'success' : 'error';
        setIsStreaming(false);
        break;
      case 'error':
        logType = 'error';
        setError((data as { error?: string })?.error || 'Error desconocido');
        setIsStreaming(false);
        break;
      case 'teardown':
        logType = 'info';
        break;
      case 'teardown-complete':
        logType = 'success';
        break;
    }

    addLog(eventType, message, data, logType);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    addLog('stop', 'Streaming detenido manualmente', null, 'warning');
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep(null);
    setSummary(null);
    setScreenshot(null);
    setError(null);
    setLiveViewUrl(null);
    setIsLiveViewConnected(true);
  };

  const downloadLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      logs: logs,
      summary: summary,
      screenshot: screenshot ? 'Available' : 'Not available',
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `browserbase-streaming-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Detectar desconexión de Browserbase Live View
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'browserbase-disconnected') {
        console.log('La sesión de Browserbase se ha desconectado');
        setIsLiveViewConnected(false);
        addLog(
          'disconnection',
          'Live View desconectado - sesión de Browserbase terminada',
          null,
          'warning',
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browserbase Streaming Test</h1>
          <p className="text-gray-600">
            Prueba el streaming en tiempo real del crawler de Haynes Pro
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startStreaming}
            disabled={isStreaming}
            className="flex items-center gap-2"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isStreaming ? 'Streaming...' : 'Iniciar Streaming'}
          </Button>
          <Button
            onClick={stopStreaming}
            disabled={!isStreaming}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Detener
          </Button>
          <Button onClick={clearLogs} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Limpiar
          </Button>
          <Button onClick={getLiveViewUrl} variant="secondary" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Obtener Live View
          </Button>
          <Button
            onClick={checkSessionStatus}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Verificar Sesión
          </Button>
          <Button
            onClick={closeSession}
            variant="destructive"
            className="flex items-center gap-2"
            disabled={!liveViewUrl}
          >
            <Square className="h-4 w-4" />
            Cerrar Sesión
          </Button>
          <Button
            onClick={downloadLogs}
            disabled={logs.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Logs
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-medium">Estado</h3>
          <Badge variant={isStreaming ? 'default' : 'secondary'}>
            {isStreaming ? 'Streaming Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-medium">Paso Actual</h3>
          {currentStep ? (
            <Badge variant="outline">Paso {currentStep}</Badge>
          ) : (
            <span className="text-gray-500">Esperando...</span>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-medium">Logs</h3>
          <Badge variant="outline">{logs.length} eventos</Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Live View */}
      {(() => {
        console.log(`🔍 [FRONTEND] Renderizando Live View - liveViewUrl: ${liveViewUrl}`);
        return liveViewUrl;
      })() && (
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Live View del Browser</h2>
              <p className="text-gray-600">
                Vista en tiempo real del browser de Browserbase ejecutando el scraping
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${isLiveViewConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm text-gray-600">
                {isLiveViewConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                URL: <code className="rounded bg-gray-200 px-2 py-1 text-xs">{liveViewUrl}</code>
              </p>
              <div className="flex gap-2">
                <a
                  href={liveViewUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Abrir en Nueva Pestaña
                </a>
                <button
                  onClick={() => setIsLiveViewConnected(!isLiveViewConnected)}
                  className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                >
                  {isLiveViewConnected ? 'Solo Vista' : 'Interactivo'}
                </button>
              </div>
            </div>

            <div className="h-96 overflow-hidden rounded-lg border">
              <iframe
                src={liveViewUrl || undefined}
                className="h-full w-full"
                title="Browserbase Live View"
                sandbox="allow-same-origin allow-scripts"
                allow="clipboard-read; clipboard-write"
                onLoad={() => {
                  console.log('✅ [FRONTEND] Iframe cargado exitosamente');
                  console.log('✅ [FRONTEND] URL del iframe:', liveViewUrl);
                }}
                onError={(e) => {
                  console.error('❌ [FRONTEND] Error cargando iframe:', e);
                  console.error('❌ [FRONTEND] URL del iframe:', liveViewUrl);
                }}
                style={{
                  border: 'none',
                }}
              />
            </div>

            {!isLiveViewConnected && (
              <div className="mt-2 rounded bg-yellow-50 p-2">
                <p className="text-sm text-yellow-800">
                  ⚠️ Live View desconectado. La sesión de Browserbase ha terminado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug: Mostrar estado de liveViewUrl */}
      {!liveViewUrl && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="text-lg font-semibold text-yellow-800">Debug: Live View</h3>
          <p className="text-yellow-700">liveViewUrl: {liveViewUrl || 'null/undefined'}</p>
          <p className="text-yellow-700">isStreaming: {isStreaming ? 'true' : 'false'}</p>
          <p className="text-yellow-700">logs count: {logs.length}</p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-2 text-xl font-semibold">Resumen del Proceso</h2>
          <p className="mb-4 text-gray-600">Resultado final del login de Haynes Pro</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Estado Inicial</p>
              <Badge variant={summary.initialStatus === 'Verificado' ? 'default' : 'destructive'}>
                {summary.initialStatus || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Login</p>
              <Badge variant={summary.login === 'Exitoso' ? 'default' : 'destructive'}>
                {summary.login || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado Final</p>
              <Badge variant={summary.finalStatus === 'Verificado' ? 'default' : 'destructive'}>
                {summary.finalStatus || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Screenshot</p>
              <Badge variant={summary.screenshot === 'Tomado' ? 'default' : 'destructive'}>
                {summary.screenshot || 'N/A'}
              </Badge>
            </div>
          </div>
          <hr className="my-4" />
          <p className="text-sm">{summary.message || 'Sin mensaje'}</p>
        </div>
      )}

      {/* Screenshot */}
      {screenshot && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-2 text-xl font-semibold">Screenshot Final</h2>
          <p className="mb-4 text-gray-600">Captura de pantalla del estado final del crawler</p>
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="mb-2 text-sm text-gray-600">
              Screenshot disponible ({screenshot.length} caracteres)
            </p>
            <p className="text-xs text-gray-500">
              Nota: El screenshot real se mostraría aquí si estuviera disponible en el formato
              correcto
            </p>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-2 text-xl font-semibold">Logs en Tiempo Real</h2>
        <p className="mb-4 text-gray-600">Eventos del streaming del crawler de Browserbase</p>
        <div className="h-96 overflow-y-auto rounded-lg border p-4">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className={`rounded-lg border p-3 ${getEventTypeColor(log.type)}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-xs">{log.timestamp}</span>
                  <Badge variant="outline" className="text-xs">
                    {log.event}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{log.message}</p>
                {log.data !== undefined && log.data !== null && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">Ver datos</summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-white/50 p-2 text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No hay logs aún. Haz clic en "Iniciar Streaming" para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserbaseStreamingPage;
