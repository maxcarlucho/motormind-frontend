# Flujo de Diagnóstico IA - Servicio Carretera

## Resumen del Flujo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  OPERADOR   │───>│   CLIENTE   │───>│    GRÚA     │───>│   TALLER    │
│  Crea caso  │    │  Responde   │    │   Decide    │    │  Diagnóstico│
│             │    │  preguntas  │    │  acción     │    │  completo   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 1. OPERADOR - Creación del Caso

### Acciones
1. El operador recibe llamada del cliente
2. Ingresa: **matrícula** + **síntoma reportado**
3. El sistema crea el caso

### Backend (MongoDB)
```
POST /cars (crear vehículo si no existe)
POST /cars/:carId/questions (crear diagnóstico con síntoma)
```

### Contexto para el Generador de Preguntas IA
El campo `notes` (oculto al cliente) incluye contexto crítico para la IA:
```
CONTEXTO CRÍTICO: SERVICIO DE ASISTENCIA EN CARRETERA
- El vehículo está VARADO y el cliente espera en el lugar
- Objetivo: Determinar rápidamente si es reparable in-situ o requiere remolque
- Las preguntas deben ser CONCISAS y orientadas a:
  * Identificar síntomas clave para diagnóstico rápido
  * Evaluar si el gruista puede resolver con herramientas básicas
  * Determinar urgencia y seguridad del cliente
- NO hacer preguntas extensas de taller, solo lo esencial: REPARAR IN-SITU o REMOLCAR
```

Este contexto ayuda a la IA a generar preguntas enfocadas en la decisión del gruista (🟢 reparar / 🔴 remolcar).

### Respuesta del Backend
- Crea registro en `Diagnosis` con:
  - `fault`: síntoma reportado
  - `notes`: contexto de carretera (interno, no visible al cliente)
  - `questions[]`: preguntas generadas por IA (optimizadas para carretera)
  - `processedFault`: categoría del síntoma
  - `status`: 'pending'

### Datos Guardados (localStorage)
- `carretera_operator_cases`: lista de casos creados
- `carretera_client_cases[id]`: datos del caso con `diagnosisId`

### Link Generado
- Se genera URL para el cliente: `/carretera/c/:caseId`

---

## 2. CLIENTE - Responde Preguntas

### Acciones
1. Cliente abre el link recibido (WhatsApp/SMS)
2. Ve interfaz tipo chat con preguntas
3. Responde cada pregunta secuencialmente
4. Al terminar todas, presiona "Finalizar"

### Backend (MongoDB)
```
GET /cars/diagnosis/:diagnosisId (cargar preguntas)
PUT /cars/diagnosis/:diagnosisId (guardar respuestas)
POST /cars/:carId/diagnosis/:diagnosisId/preliminary (generar pre-diagnóstico)
```

### Estados del Diagnóstico
| Estado | Descripción |
|--------|-------------|
| `waiting-client` | Cliente no ha comenzado |
| `client-answering` | Cliente respondiendo (ej: 2/4 preguntas) |
| `generating` | Cliente terminó, IA procesando |
| `ready` | Pre-diagnóstico listo |

### Datos Guardados
- `answers`: respuestas separadas por `|`
- `preliminary.possibleReasons[]`: diagnósticos posibles de IA
- `aiAssessment`: resumen para el Gruista

---

## 3. GRÚA - Ve Pre-diagnóstico y Decide

### Acciones
1. Gruista abre su dashboard `/carretera/g/dashboard`
2. Ve lista de casos asignados
3. Entra al detalle de un caso
4. Ve el estado del diagnóstico IA:
   - Si `waiting-client`: "Esperando al Cliente"
   - Si `client-answering`: "Cliente Respondiendo (2/4)"
   - Si `generating`: "Generando Diagnóstico IA..."
   - Si `ready`: Diagnóstico completo con semáforo

### Polling Automático
- Mientras el estado NO sea `ready`, el sistema consulta el backend cada 5 segundos
- Cuando llega a `ready`, el polling se detiene
- También hay botón de refresh manual

### Backend (MongoDB)
```
GET /cars/diagnosis/:diagnosisId (obtener estado actual)
```

### Semáforo de Decisión (solo cuando `status === 'ready'`)
| Color | Recomendación | Acción |
|-------|--------------|--------|
| 🟢 Verde | Reparar in-situ | Problema simple, herramientas básicas |
| 🟡 Amarillo | Evaluar en sitio | Necesita más información |
| 🔴 Rojo | Remolcar al taller | Reparación compleja |

### Decisiones Posibles
1. **Reparar In-Situ** → Caso cerrado como `completed`
2. **Necesito Más Info** → Caso queda en `needs-info`
3. **Remolcar al Taller** → Genera link para taller

---

## 4. TALLER - Diagnóstico Completo con OBD

### Cuándo Aplica
- Solo si el Gruista eligió "Remolcar al Taller"

### Acciones
1. Gruista genera link: `/carretera/t/:caseId`
2. Envía link al taller (WhatsApp)
3. Taller abre el link y ve:
   - Pre-diagnóstico IA
   - Historial de preguntas/respuestas del cliente
   - Decisión del Gruista
4. Taller puede añadir:
   - Códigos OBD (ej: P0171, P0300)
   - Comentarios de inspección
5. Presiona "Generar Diagnóstico Completo"

### Backend (MongoDB)
```
POST /cars/:carId/diagnosis/:diagnosisId/preliminary
Body: { obdCodes: ["P0171", "P0300"], technicianNotes: "..." }
```

### Resultado
- IA regenera diagnóstico CON los códigos OBD
- Diagnóstico más preciso y confiable
- Presupuesto estimado de reparación

---

## Diagrama de Datos

```
MongoDB (Diagnosis)
├── _id
├── carId → Car
├── fault: "Testigo Motor encendido"
├── questions: ["¿Hace ruido?", "¿Desde cuándo?", ...]
├── answers: "Sí, mucho|Desde ayer|..."
├── processedFault:
│   ├── symptomCleaned
│   ├── category
│   └── potentialObdCodes
├── preliminary:
│   └── possibleReasons: [
│       {
│           title: "Fallo de sensor O2",
│           probability: "Alta",
│           reasonDetails: "...",
│           requiredTools: ["Multímetro"],
│           diagnosticRecommendations: [...]
│       }
│   ]
├── status: "pending" | "in-progress" | "completed"
├── obdCodes: ["P0171"]  // Añadido por taller
└── diagnosis: { ... }   // Diagnóstico final
```

```
localStorage
├── carretera_operator_cases: [{ id, caseNumber, symptom, ... }]
├── carretera_client_cases: {
│   [caseId]: {
│       diagnosisId,
│       questions,
│       answers,
│       aiAssessment: { status, diagnosis, confidence, recommendation }
│   }
│}
└── carretera_workshop_cases: [{ id, aiAssessment, gruistaDecision, ... }]
```

---

## Estados del aiAssessment

```typescript
interface AIAssessment {
    status: 'waiting-client' | 'client-answering' | 'generating' | 'ready';
    diagnosis: string;           // Título del problema
    confidence: number;          // 0-100%
    recommendation: 'repair' | 'info' | 'tow';
    reasoning: string[];         // Razones del diagnóstico
    clientProgress?: {
        answered: number;        // Preguntas respondidas
        total: number;           // Total de preguntas
    };
}
```

---

## Endpoints del Backend Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/cars/vin-or-plate/:plate` | Buscar vehículo por matrícula |
| POST | `/cars` | Crear vehículo nuevo |
| POST | `/cars/:carId/questions` | Crear diagnóstico con síntoma |
| GET | `/cars/diagnosis/:diagnosisId` | Obtener diagnóstico |
| PUT | `/cars/diagnosis/:diagnosisId` | Actualizar respuestas |
| POST | `/cars/:carId/diagnosis/:diagnosisId/preliminary` | Generar pre-diagnóstico |

---

## Archivos Clave del Frontend

```
src/features/carretera/
├── hooks/
│   ├── useCreateCase.ts        # Operador: crear caso
│   ├── useClientAssessment.ts  # Cliente: responder preguntas
│   ├── useGruistaCase.ts       # Grúa: ver caso + polling
│   └── useWorkshopCase.ts      # Taller: diagnóstico OBD
├── components/
│   ├── AIAssessmentSummary.tsx # Estados del diagnóstico IA
│   ├── TrafficLightDecision.tsx # Semáforo de decisión
│   └── OBDDiagnosisForm.tsx    # Formulario códigos OBD
└── pages/
    ├── OperatorDashboard.tsx   # Panel del operador
    ├── ClientLanding.tsx       # Chat del cliente
    ├── GruistaDetail.tsx       # Detalle caso grúa
    └── WorkshopReception.tsx   # Recepción taller
```

---

## Flujo Visual Completo

```
                                    ┌──────────────────┐
                                    │    OPERADOR      │
                                    │  Crea caso con   │
                                    │ matrícula+síntoma│
                                    └────────┬─────────┘
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │         BACKEND              │
                              │  POST /cars/:id/questions    │
                              │  → Genera preguntas IA       │
                              │  → Guarda en MongoDB         │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │     CLIENTE      │
                                    │  Abre link chat  │
                                    │ Responde preguntas│
                                    └────────┬─────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │ waiting-client  │          │client-answering │          │   generating    │
    │                 │    ───>  │   (2/4)         │    ───>  │                 │
    │ "Esperando al   │          │ "Cliente        │          │ "Generando      │
    │  Cliente"       │          │  Respondiendo"  │          │  Diagnóstico"   │
    └─────────────────┘          └─────────────────┘          └────────┬────────┘
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │     ready       │
                                                              │                 │
                                                              │ "Diagnóstico IA │
                                                              │  Listo ✓"       │
                                                              └────────┬────────┘
                                                                       │
                                             ┌─────────────────────────┼─────────────────────────┐
                                             │                         │                         │
                                             ▼                         ▼                         ▼
                                    ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
                                    │ 🟢 REPARAR   │          │ 🟡 MÁS INFO  │          │ 🔴 REMOLCAR  │
                                    │   IN-SITU    │          │              │          │  AL TALLER   │
                                    └──────┬───────┘          └──────┬───────┘          └──────┬───────┘
                                           │                         │                         │
                                           ▼                         ▼                         ▼
                                    ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
                                    │    CASO      │          │    CASO      │          │   TALLER     │
                                    │  CERRADO ✓   │          │ PENDIENTE    │          │ Añade OBD    │
                                    │              │          │              │          │ Diagnóstico  │
                                    └──────────────┘          └──────────────┘          │   completo   │
                                                                                        └──────────────┘
```
