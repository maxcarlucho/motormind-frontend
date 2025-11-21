# Fase 2: Timeline y Estados del Caso - Especificación Técnica

## 📋 Resumen Ejecutivo

Mejora del modal de detalle del operador agregando visualización de timeline de eventos y barra de progreso multi-fase, permitiendo seguimiento completo del ciclo de vida del caso desde creación hasta resolución.

**Estimación:** 4-5 horas de desarrollo
**Dependencias:** API backend con endpoints de timeline
**Archivos afectados:** Solo dentro de `/carretera`

---

## 🎯 Objetivos

1. **Timeline Visual**: Mostrar historial cronológico de eventos del caso
2. **Barra de Progreso**: Indicador visual de fase actual (Operador → Cliente → Gruista → Taller)
3. **Estado en Tiempo Real**: Información actualizada del progreso del caso
4. **UX Mejorada**: Operador puede ver y comunicar estado exacto al cliente

---

## 📡 Especificación de API

### Endpoint: GET `/api/carretera/cases/:caseId/details`

**Response:**
```typescript
{
  "case": {
    "id": "case-123",
    "caseNumber": "C-001",
    "vehiclePlate": "ABC1234",
    "clientName": "Juan Pérez",
    "clientPhone": "+34600123456",
    "symptom": "Motor no arranca",
    "location": "Calle Mayor 45, Madrid",
    "status": "in-progress",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:45:00Z",
    "clientLink": "https://app.com/carretera/c/case-123"
  },
  "progress": {
    "currentPhase": "gruista",
    "phases": {
      "operator": {
        "status": "completed",
        "completedAt": "2024-01-15T10:35:00Z"
      },
      "client": {
        "status": "completed",
        "completedAt": "2024-01-15T11:05:00Z",
        "questionsAnswered": 8,
        "totalQuestions": 8
      },
      "gruista": {
        "status": "in-progress",
        "assignedTo": "Carlos Ruiz",
        "assignedAt": "2024-01-15T11:10:00Z",
        "estimatedArrival": "2024-01-15T12:30:00Z",
        "currentStatus": "en-route"
      },
      "workshop": {
        "status": "pending"
      }
    },
    "percentComplete": 65
  },
  "timeline": [
    {
      "id": "evt-1",
      "type": "created",
      "timestamp": "2024-01-15T10:30:00Z",
      "description": "Caso creado",
      "actor": {
        "type": "operator",
        "name": "María García",
        "id": "op-456"
      },
      "metadata": {
        "initialSymptom": "Motor no arranca"
      }
    },
    {
      "id": "evt-2",
      "type": "client-link-sent",
      "timestamp": "2024-01-15T10:35:00Z",
      "description": "Link enviado al cliente por WhatsApp",
      "actor": {
        "type": "operator",
        "name": "María García",
        "id": "op-456"
      },
      "metadata": {
        "method": "whatsapp",
        "phone": "+34600123456"
      }
    },
    {
      "id": "evt-3",
      "type": "client-started",
      "timestamp": "2024-01-15T10:42:00Z",
      "description": "Cliente inició el cuestionario",
      "actor": {
        "type": "client",
        "name": "Juan Pérez",
        "id": "case-123"
      }
    },
    {
      "id": "evt-4",
      "type": "client-completed",
      "timestamp": "2024-01-15T11:05:00Z",
      "description": "Cliente completó todas las preguntas (8/8)",
      "actor": {
        "type": "client",
        "name": "Juan Pérez",
        "id": "case-123"
      },
      "metadata": {
        "questionsAnswered": 8,
        "totalQuestions": 8,
        "duration": "23 minutos"
      }
    },
    {
      "id": "evt-5",
      "type": "gruista-assigned",
      "timestamp": "2024-01-15T11:10:00Z",
      "description": "Gruista asignado al caso",
      "actor": {
        "type": "system",
        "name": "Sistema"
      },
      "metadata": {
        "gruistaName": "Carlos Ruiz",
        "gruistaId": "gru-789",
        "estimatedArrival": "2024-01-15T12:30:00Z"
      }
    },
    {
      "id": "evt-6",
      "type": "gruista-en-route",
      "timestamp": "2024-01-15T11:15:00Z",
      "description": "Gruista en camino al sitio",
      "actor": {
        "type": "gruista",
        "name": "Carlos Ruiz",
        "id": "gru-789"
      },
      "metadata": {
        "currentLocation": "Calle Serrano 120",
        "distance": "3.2 km",
        "eta": "15 minutos"
      }
    }
  ]
}
```

### Endpoint: GET `/api/carretera/cases/:caseId/timeline` (opcional)

Si el timeline está separado para optimizar carga:

**Response:**
```typescript
{
  "timeline": [...eventos como arriba...],
  "hasMore": false,
  "total": 6
}
```

---

## 🏗️ Tipos TypeScript

### Nuevos tipos en `carretera.types.ts`

```typescript
// ============================================================================
// Timeline & Progress Types (Phase 2)
// ============================================================================

export type TimelineEventType =
    | 'created'
    | 'client-link-sent'
    | 'client-started'
    | 'client-completed'
    | 'gruista-assigned'
    | 'gruista-en-route'
    | 'gruista-on-site'
    | 'gruista-decision'
    | 'workshop-received'
    | 'workshop-accepted'
    | 'workshop-inspecting'
    | 'workshop-diagnosing'
    | 'workshop-waiting-parts'
    | 'workshop-repairing'
    | 'workshop-testing'
    | 'workshop-completed'
    | 'case-cancelled';

export type ActorType = 'operator' | 'client' | 'gruista' | 'workshop' | 'system';

export interface TimelineActor {
    type: ActorType;
    name: string;
    id: string;
}

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    timestamp: Date;
    description: string;
    actor?: TimelineActor;
    metadata?: Record<string, any>;
}

export type CasePhase = 'operator' | 'client' | 'gruista' | 'workshop';
export type PhaseStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface PhaseProgress {
    status: PhaseStatus;
    completedAt?: Date;
    assignedTo?: string;
    assignedAt?: Date;
    estimatedArrival?: Date;
    currentStatus?: string;
    questionsAnswered?: number;
    totalQuestions?: number;
}

export interface CaseProgress {
    currentPhase: CasePhase;
    phases: {
        operator: PhaseProgress;
        client: PhaseProgress;
        gruista: PhaseProgress;
        workshop: PhaseProgress;
    };
    percentComplete: number; // 0-100
}

export interface CaseDetailData {
    case: OperatorCase;
    progress: CaseProgress;
    timeline: TimelineEvent[];
}

// Extend OperatorCase type to include optional enhanced data
export interface OperatorCaseEnhanced extends OperatorCase {
    diagnosisId?: string;
    gruistaId?: string;
    gruistaName?: string;
    workshopId?: string;
    workshopName?: string;
}
```

---

## 📦 Componentes a Crear

### 1. `CaseStatusFlow.tsx`

**Ubicación:** `src/features/carretera/components/CaseStatusFlow.tsx`

**Props:**
```typescript
interface CaseStatusFlowProps {
    progress: CaseProgress;
    compact?: boolean; // Para versión mobile más compacta
}
```

**Diseño Visual:**

Desktop:
```
┌────────────────────────────────────────────────────────────┐
│  [✓] Operador  ━━━━━  [✓] Cliente  ━━━━━  [⏳] Gruista  ━━━  [ ] Taller  │
│     Creado           Respondió         En camino        Pendiente     │
│   hace 2h            hace 1h          hace 30m                        │
└────────────────────────────────────────────────────────────┘
```

Mobile:
```
┌────────────────────┐
│ ✓ ━━ ✓ ━━ ⏳ ━━ ◯ │
│ Op  Cli  Gru  Tal  │
│      65% completo  │
└────────────────────┘
```

**Ejemplo de Implementación:**

```tsx
import { CheckCircle, Clock, Circle } from 'lucide-react';

export function CaseStatusFlow({ progress, compact = false }: CaseStatusFlowProps) {
    const phases = [
        {
            key: 'operator',
            label: 'Operador',
            shortLabel: 'Op',
            icon: '📞',
            data: progress.phases.operator
        },
        {
            key: 'client',
            label: 'Cliente',
            shortLabel: 'Cli',
            icon: '👤',
            data: progress.phases.client
        },
        {
            key: 'gruista',
            label: 'Gruista',
            shortLabel: 'Gru',
            icon: '🚛',
            data: progress.phases.gruista
        },
        {
            key: 'workshop',
            label: 'Taller',
            shortLabel: 'Tal',
            icon: '🔧',
            data: progress.phases.workshop
        },
    ];

    const getPhaseIcon = (status: PhaseStatus, isCurrent: boolean) => {
        if (status === 'completed') {
            return <CheckCircle className="h-6 w-6 text-green-600" />;
        }
        if (status === 'in-progress' || isCurrent) {
            return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
        }
        return <Circle className="h-6 w-6 text-gray-300" />;
    };

    const getConnectorClass = (prevStatus: PhaseStatus) => {
        if (prevStatus === 'completed') {
            return 'bg-green-600';
        }
        return 'bg-gray-300';
    };

    if (compact) {
        // Mobile compact version
        return (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    {phases.map((phase, index) => (
                        <div key={phase.key} className="flex items-center">
                            <div className="flex flex-col items-center">
                                {getPhaseIcon(
                                    phase.data.status,
                                    progress.currentPhase === phase.key
                                )}
                                <span className="text-xs text-gray-600 mt-1">
                                    {phase.shortLabel}
                                </span>
                            </div>
                            {index < phases.length - 1 && (
                                <div
                                    className={`w-8 h-1 mx-2 ${getConnectorClass(phase.data.status)}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span className="font-semibold">{progress.percentComplete}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentComplete}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Desktop full version
    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
                {phases.map((phase, index) => (
                    <div key={phase.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                            <div className={`mb-2 ${progress.currentPhase === phase.key ? 'scale-110' : ''} transition-transform`}>
                                {getPhaseIcon(phase.data.status, progress.currentPhase === phase.key)}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {phase.icon} {phase.label}
                            </span>
                            <span className="text-xs text-gray-600 mt-1">
                                {phase.data.status === 'completed'
                                    ? `Completado`
                                    : phase.data.status === 'in-progress'
                                    ? phase.data.currentStatus || 'En curso'
                                    : 'Pendiente'
                                }
                            </span>
                            {phase.data.completedAt && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                    {formatDistanceToNow(phase.data.completedAt, {
                                        addSuffix: true,
                                        locale: es
                                    })}
                                </span>
                            )}
                        </div>
                        {index < phases.length - 1 && (
                            <div className="flex-1 h-1 mx-4 relative">
                                <div className="absolute inset-0 bg-gray-300 rounded-full" />
                                <div
                                    className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                        phase.data.status === 'completed'
                                            ? 'bg-green-600 w-full'
                                            : 'w-0'
                                    }`}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

### 2. `CaseTimeline.tsx`

**Ubicación:** `src/features/carretera/components/CaseTimeline.tsx`

**Props:**
```typescript
interface CaseTimelineProps {
    events: TimelineEvent[];
    isLoading?: boolean;
}
```

**Ejemplo de Implementación:**

```tsx
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    FileText, Send, MessageSquare, CheckCircle,
    Truck, MapPin, AlertCircle, Wrench, Clock,
    User, Phone, Settings
} from 'lucide-react';

const EVENT_CONFIG: Record<TimelineEventType, {
    icon: any;
    color: string;
    bgColor: string;
    label: string;
}> = {
    'created': {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Caso creado'
    },
    'client-link-sent': {
        icon: Send,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Link enviado'
    },
    'client-started': {
        icon: MessageSquare,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Chat iniciado'
    },
    'client-completed': {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Preguntas completadas'
    },
    'gruista-assigned': {
        icon: Truck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Gruista asignado'
    },
    'gruista-en-route': {
        icon: MapPin,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'En camino'
    },
    'gruista-on-site': {
        icon: MapPin,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'En sitio'
    },
    'gruista-decision': {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Decisión tomada'
    },
    'workshop-received': {
        icon: Wrench,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Recibido en taller'
    },
    'workshop-accepted': {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Taller aceptó'
    },
    'workshop-inspecting': {
        icon: Settings,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Inspección'
    },
    'workshop-diagnosing': {
        icon: Settings,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Diagnóstico'
    },
    'workshop-waiting-parts': {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        label: 'Esperando repuestos'
    },
    'workshop-repairing': {
        icon: Wrench,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Reparando'
    },
    'workshop-testing': {
        icon: Settings,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Probando'
    },
    'workshop-completed': {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Completado'
    },
    'case-cancelled': {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Cancelado'
    },
};

export function CaseTimeline({ events, isLoading = false }: CaseTimelineProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Clock className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay eventos registrados aún</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event, index) => {
                const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.created;
                const Icon = config.icon;
                const isLast = index === events.length - 1;

                return (
                    <div key={event.id} className="flex gap-4">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-full ${config.bgColor}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            {!isLast && (
                                <div className="w-0.5 flex-1 bg-gray-300 my-1" />
                            )}
                        </div>

                        {/* Event content */}
                        <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {event.description}
                                    </h4>
                                    {event.actor && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            {event.actor.type === 'operator' && '👤 '}
                                            {event.actor.type === 'gruista' && '🚛 '}
                                            {event.actor.type === 'workshop' && '🔧 '}
                                            {event.actor.type === 'system' && '⚙️ '}
                                            {event.actor.name}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {formatDistanceToNow(event.timestamp, {
                                        addSuffix: true,
                                        locale: es
                                    })}
                                </span>
                            </div>

                            {/* Metadata */}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-700">
                                    {event.type === 'client-completed' && event.metadata.questionsAnswered && (
                                        <p>✓ {event.metadata.questionsAnswered}/{event.metadata.totalQuestions} preguntas respondidas</p>
                                    )}
                                    {event.type === 'gruista-assigned' && event.metadata.gruistaName && (
                                        <p>Gruista: {event.metadata.gruistaName}</p>
                                    )}
                                    {event.type === 'gruista-en-route' && event.metadata.eta && (
                                        <p>ETA: {event.metadata.eta}</p>
                                    )}
                                    {event.type === 'gruista-decision' && event.metadata.decision && (
                                        <div>
                                            <p className="font-semibold">
                                                {event.metadata.decision === 'repair' && '🟢 Reparar en sitio'}
                                                {event.metadata.decision === 'tow' && '🔴 Remolcar a taller'}
                                                {event.metadata.decision === 'info' && '🟡 Necesita más información'}
                                            </p>
                                            {event.metadata.notes && (
                                                <p className="mt-1 italic">&ldquo;{event.metadata.notes}&rdquo;</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Exact timestamp on hover/click */}
                            <p className="text-xs text-gray-400 mt-1">
                                {format(event.timestamp, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
```

---

### 3. Hook `useCaseDetails.ts`

**Ubicación:** `src/features/carretera/hooks/useCaseDetails.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CaseDetailData, TimelineEvent, CaseProgress } from '../types/carretera.types';
import carreteraApi from '../services/carreteraApi.service';

interface UseCaseDetailsReturn {
    data: CaseDetailData | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch detailed case information including timeline and progress
 * Connects to backend API: GET /api/carretera/cases/:caseId/details
 */
export function useCaseDetails(caseId: string): UseCaseDetailsReturn {
    const [data, setData] = useState<CaseDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        if (!caseId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Call backend API
            const response = await carreteraApi.getCaseDetails(caseId);

            // Parse dates from strings
            const parsedData: CaseDetailData = {
                case: {
                    ...response.data.case,
                    createdAt: new Date(response.data.case.createdAt),
                    updatedAt: new Date(response.data.case.updatedAt),
                },
                progress: {
                    ...response.data.progress,
                    phases: {
                        operator: {
                            ...response.data.progress.phases.operator,
                            completedAt: response.data.progress.phases.operator.completedAt
                                ? new Date(response.data.progress.phases.operator.completedAt)
                                : undefined,
                        },
                        client: {
                            ...response.data.progress.phases.client,
                            completedAt: response.data.progress.phases.client.completedAt
                                ? new Date(response.data.progress.phases.client.completedAt)
                                : undefined,
                        },
                        gruista: {
                            ...response.data.progress.phases.gruista,
                            assignedAt: response.data.progress.phases.gruista.assignedAt
                                ? new Date(response.data.progress.phases.gruista.assignedAt)
                                : undefined,
                            completedAt: response.data.progress.phases.gruista.completedAt
                                ? new Date(response.data.progress.phases.gruista.completedAt)
                                : undefined,
                            estimatedArrival: response.data.progress.phases.gruista.estimatedArrival
                                ? new Date(response.data.progress.phases.gruista.estimatedArrival)
                                : undefined,
                        },
                        workshop: {
                            ...response.data.progress.phases.workshop,
                            completedAt: response.data.progress.phases.workshop.completedAt
                                ? new Date(response.data.progress.phases.workshop.completedAt)
                                : undefined,
                        },
                    },
                },
                timeline: response.data.timeline.map((event: any) => ({
                    ...event,
                    timestamp: new Date(event.timestamp),
                })),
            };

            setData(parsedData);
        } catch (err) {
            console.error('Error fetching case details:', err);
            setError('Error al cargar los detalles del caso');
            enqueueSnackbar('Error al cargar los detalles', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const refresh = useCallback(async () => {
        await fetchDetails();
    }, [fetchDetails]);

    return {
        data,
        isLoading,
        error,
        refresh,
    };
}
```

---

### 4. Modificar `CaseDetailModal.tsx`

**Cambios principales:**

1. **Agregar tabs para organizar información**
2. **Incluir `CaseStatusFlow` en el header**
3. **Agregar tab de Timeline**
4. **Usar hook `useCaseDetails`**

```tsx
// Agregar imports
import { CaseStatusFlow } from './CaseStatusFlow';
import { CaseTimeline } from './CaseTimeline';
import { useCaseDetails } from '../hooks/useCaseDetails';

// En el componente, después de las props
const { data: detailData, isLoading: isLoadingDetails, refresh } = useCaseDetails(caseData.id);
const [activeTab, setActiveTab] = useState<'general' | 'timeline' | 'history'>('general');

// En el JSX, después del header, antes del contenido
{detailData && (
    <div className="px-6 pt-4">
        <CaseStatusFlow
            progress={detailData.progress}
            compact={false}
        />
    </div>
)}

// Tabs
<div className="border-b border-gray-200 px-6">
    <div className="flex gap-4">
        <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'general'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
            General
        </button>
        <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'timeline'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
            Timeline ({detailData?.timeline.length || 0})
        </button>
    </div>
</div>

// Contenido condicional por tab
<div className="p-6 max-h-[60vh] overflow-y-auto">
    {activeTab === 'general' && (
        // ... contenido actual (client info, case details, etc)
    )}

    {activeTab === 'timeline' && detailData && (
        <CaseTimeline
            events={detailData.timeline}
            isLoading={isLoadingDetails}
        />
    )}
</div>
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────┐
│  OperatorDashboard  │
│   (selecciona caso) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CaseDetailModal    │◄───────┐
│   (abre con caseId) │        │
└──────────┬──────────┘        │
           │                   │
           ▼                   │
┌─────────────────────┐        │
│  useCaseDetails     │        │
│  (fetch API)        │        │
└──────────┬──────────┘        │
           │                   │
           ▼                   │
┌─────────────────────┐        │
│ Backend API         │        │
│ GET /cases/:id      │        │
└──────────┬──────────┘        │
           │                   │
           ▼                   │
┌─────────────────────┐        │
│ CaseDetailData      │        │
│ - case              │        │
│ - progress          │        │
│ - timeline          │        │
└──────────┬──────────┘        │
           │                   │
           ├────────────────────┤
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ CaseStatusFlow   │  │  CaseTimeline    │
│ (muestra fases)  │  │ (muestra eventos)│
└──────────────────┘  └──────────────────┘
```

---

## 📱 Responsive Design

### Mobile (< 768px)
- Timeline vertical con iconos a la izquierda
- CaseStatusFlow en versión compacta
- Tabs apilados si es necesario
- Scroll vertical para timeline largo

### Desktop (≥ 768px)
- Timeline vertical con más detalles
- CaseStatusFlow horizontal expandido
- Tabs horizontales
- Modal más ancho (max-w-3xl o max-w-4xl)

---

## 🎨 Paleta de Colores por Evento

| Tipo de Evento | Color | Uso |
|----------------|-------|-----|
| Creación/Inicio | Azul (`blue-600`) | Eventos del sistema |
| Completado | Verde (`green-600`) | Acciones exitosas |
| En progreso | Naranja (`orange-600`) | Gruista trabajando |
| Taller | Púrpura (`purple-600`) | Operaciones de taller |
| Esperando | Amarillo (`yellow-600`) | Estados de espera |
| Error/Cancelación | Rojo (`red-600`) | Problemas o cancelaciones |

---

## 🧪 Testing

### Casos de Prueba

1. **Caso recién creado** (solo evento "created")
   - ✓ Barra de progreso muestra solo fase "operator" completada
   - ✓ Timeline muestra 1 evento

2. **Cliente respondiendo** (in-progress)
   - ✓ Barra muestra fase "client" en progreso
   - ✓ Timeline muestra: created → client-link-sent → client-started

3. **Gruista asignado**
   - ✓ Barra muestra fase "gruista" activa
   - ✓ Timeline incluye estimación de llegada
   - ✓ Se muestra nombre del gruista

4. **En taller**
   - ✓ Todas las fases anteriores completadas
   - ✓ Timeline muestra decisión del gruista
   - ✓ Estado de reparación visible

5. **Caso completado**
   - ✓ Todas las fases en verde (completed)
   - ✓ Progreso al 100%
   - ✓ Timeline completo con evento final

---

## 🚀 Plan de Implementación

### Paso 1: Tipos y Estructuras (30 min)
- [ ] Agregar tipos en `carretera.types.ts`
- [ ] Definir configuración de eventos
- [ ] Crear interfaces de API

### Paso 2: API Service (30 min)
- [ ] Agregar método `getCaseDetails()` en `carreteraApi.service.ts`
- [ ] Manejar errores y timeouts
- [ ] Mock de datos para testing

### Paso 3: Hook useCaseDetails (1 hora)
- [ ] Crear hook con fetch de API
- [ ] Parsing de fechas
- [ ] Estado de loading/error
- [ ] Función refresh

### Paso 4: CaseStatusFlow (1 hora)
- [ ] Componente desktop
- [ ] Componente mobile (compact)
- [ ] Animaciones de transición
- [ ] Testing visual

### Paso 5: CaseTimeline (1.5 horas)
- [ ] Configuración de iconos por tipo
- [ ] Renderizado de eventos
- [ ] Formateo de timestamps
- [ ] Metadata display
- [ ] Responsive design

### Paso 6: Integración en Modal (1 hora)
- [ ] Agregar tabs al modal
- [ ] Integrar CaseStatusFlow
- [ ] Integrar CaseTimeline
- [ ] Manejo de estados de loading
- [ ] Refresh automático (opcional)

### Paso 7: Testing y Ajustes (30 min)
- [ ] Probar todos los estados
- [ ] Ajustar estilos
- [ ] Performance check
- [ ] Cross-browser testing

**Total: 5-6 horas**

---

## 📊 Métricas de Éxito

1. **Visibilidad**: Operador puede ver estado del caso en < 2 segundos
2. **Claridad**: 100% de los operadores entienden en qué fase está el caso
3. **Eficiencia**: Reducción del 50% en llamadas de clientes preguntando "¿dónde está mi grúa?"
4. **Satisfacción**: NPS > 8 de operadores usando la nueva UI

---

## 🔮 Mejoras Futuras (Post-MVP)

1. **WebSocket Updates**: Timeline en tiempo real sin refresh
2. **Filtros de Timeline**: Mostrar solo ciertos tipos de eventos
3. **Exportar Timeline**: Generar PDF con historial del caso
4. **Notificaciones**: Alertas cuando hay nuevos eventos
5. **Chat Interno**: Mensajes entre operador-gruista-taller
6. **Mapa en Vivo**: Mostrar ubicación del gruista en tiempo real
7. **Estimaciones Inteligentes**: ML para predecir tiempos de resolución
8. **Analytics Dashboard**: Métricas agregadas de todos los casos

---

## 📝 Notas de Implementación

### Consideraciones de Performance
- Limitar timeline a últimos 50 eventos (pagination si hay más)
- Cache de `useCaseDetails` con react-query
- Debounce en refresh automático
- Lazy load de componentes pesados

### Accesibilidad
- Usar colores + iconos (no solo color)
- ARIA labels en todos los botones
- Navegación por teclado en tabs
- Screen reader friendly

### Internacionalización
- Todos los textos via i18n
- Formateo de fechas según locale
- Soporte para RTL (futuro)

---

**Documento creado:** 2024-01-15
**Versión:** 1.0
**Autor:** Equipo Carretera MVP
**Estado:** Especificación lista para implementación
