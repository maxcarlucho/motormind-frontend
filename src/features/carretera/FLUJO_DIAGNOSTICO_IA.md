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
GET /cars/vin-or-plate?plate=XXX  → Busca/crea vehículo via TecDoc
POST /cars/:carId/questions       → Crea diagnóstico con síntoma + genera preguntas IA
```

### TecDoc Integration
El endpoint `GET /cars/vin-or-plate` automáticamente:
1. Busca el vehículo en la BD por matrícula
2. Si no existe, consulta la API de TecDoc
3. Crea el vehículo con datos completos (marca, modelo, año, motor, etc.)
4. Retorna el vehículo con `_id` para crear el diagnóstico

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

### Link Generado para Cliente
El operador genera un link **CON TOKEN** para que el cliente pueda interactuar con el backend:
```
/carretera/c/:caseId?t={JWT_TOKEN}&car={carId}
```

**Importante**: El token permite al cliente:
- Guardar respuestas en el backend
- Generar el pre-diagnóstico automáticamente al terminar

### Datos Guardados (localStorage)
- `carretera_operator_cases`: lista de casos creados
- `carretera_client_cases[id]`: datos del caso con `diagnosisId`, `carId`

---

## 2. CLIENTE - Responde Preguntas

### Acciones
1. Cliente abre el link recibido (WhatsApp/SMS)
2. El token en la URL permite acceso al backend
3. Ve interfaz tipo chat con preguntas
4. Responde cada pregunta secuencialmente
5. **Al responder la última pregunta:**
   - Se muestra pantalla "Generando diagnóstico..."
   - Se llama automáticamente a `/preliminary`
   - Se muestra pantalla de "Completado"

### Backend (MongoDB)
```
GET /cars/diagnosis/:diagnosisId                    → Cargar preguntas
PUT /cars/:carId/diagnosis/:diagnosisId/answers     → Guardar respuestas (con cada respuesta)
POST /cars/:carId/diagnosis/:diagnosisId/preliminary → Generar pre-diagnóstico (automático al terminar)
```

### Estados del Cliente
| Estado | Pantalla |
|--------|----------|
| Cargando | Spinner "Cargando información..." |
| Respondiendo | Chat con preguntas |
| Generando | "Generando diagnóstico..." con animación IA |
| Completado | "¡Gracias! La grúa está en camino" |

### Datos Guardados
- `answers`: respuestas separadas por `|` (backend)
- `preliminary.possibleReasons[]`: diagnósticos posibles de IA
- `aiAssessment`: resumen con `status: 'ready'`

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
   - Si `ready`: **Diagnóstico completo con semáforo de decisión**

### Polling Automático
- Mientras el estado NO sea `ready`, el sistema consulta cada 5 segundos
- Cuando llega a `ready`, el polling se detiene
- También hay botón de refresh manual

### Semáforo de Decisión (solo cuando `status === 'ready'`)
| Color | Recomendación | Descripción |
|-------|--------------|-------------|
| 🟢 Verde | Reparar in-situ | Problema simple, herramientas básicas |
| 🔴 Rojo | Remolcar al taller | Reparación compleja |

**Nota**: La opción recomendada por la IA aparece destacada con badge "IA Recomienda"

### Decisiones Posibles
1. **Reparar In-Situ** → Caso cerrado como `completed`
2. **Remolcar al Taller** → Genera link para taller automáticamente

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
   - Decisión del Gruista con notas
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
├── carId → Car (con datos de TecDoc)
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
├── carretera_operator_cases: [{ id, caseNumber, symptom, clientLink, ... }]
├── carretera_client_cases: {
│   [caseId]: {
│       diagnosisId,
│       carId,
│       questions,
│       answers,
│       aiAssessment: { status, diagnosis, confidence, recommendation, reasoning }
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
    recommendation: 'repair' | 'tow';  // Decisión recomendada
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
| GET | `/cars/vin-or-plate?plate=XXX` | Buscar/crear vehículo via TecDoc |
| POST | `/cars/:carId/questions` | Crear diagnóstico con síntoma |
| GET | `/cars/diagnosis/:diagnosisId` | Obtener diagnóstico |
| PUT | `/cars/:carId/diagnosis/:diagnosisId/answers` | Actualizar respuestas |
| POST | `/cars/:carId/diagnosis/:diagnosisId/preliminary` | Generar pre-diagnóstico |

---

## Archivos Clave del Frontend

```
src/features/carretera/
├── hooks/
│   ├── useCreateCase.ts        # Operador: crear caso + generar URL con token
│   ├── useClientAssessment.ts  # Cliente: responder + auto-generar preliminary
│   ├── useGruistaCase.ts       # Grúa: ver caso + polling + recomendación IA
│   └── useWorkshopCase.ts      # Taller: diagnóstico OBD
├── components/
│   ├── AIAssessmentSummary.tsx # Estados del diagnóstico IA
│   ├── TrafficLightDecision.tsx # Botones de decisión (repair/tow)
│   └── OBDDiagnosisForm.tsx    # Formulario códigos OBD
├── services/
│   └── gruistaRecommendation.service.ts # Servicio de recomendación IA
└── pages/
    ├── OperatorDashboard.tsx   # Panel del operador
    ├── ClientLanding.tsx       # Chat del cliente + pantalla generando
    ├── GruistaDetail.tsx       # Detalle caso grúa + decisión
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
                              │  GET /cars/vin-or-plate      │
                              │  → Obtiene datos de TecDoc   │
                              │  POST /cars/:id/questions    │
                              │  → Genera preguntas IA       │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │   URL CON TOKEN GENERADA     │
                              │ /carretera/c/:id?t=JWT&car=X │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │     CLIENTE      │
                                    │  Abre link chat  │
                                    │ Responde preguntas│
                                    │  (usa token URL) │
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
                                                        AUTO: POST /preliminary
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │     ready       │
                                                              │                 │
                                                              │ "Diagnóstico IA │
                                                              │  Listo ✓"       │
                                                              └────────┬────────┘
                                                                       │
                                             ┌─────────────────────────┴─────────────────────────┐
                                             │                                                   │
                                             ▼                                                   ▼
                                    ┌──────────────┐                                    ┌──────────────┐
                                    │ 🟢 REPARAR   │                                    │ 🔴 REMOLCAR  │
                                    │   IN-SITU    │                                    │  AL TALLER   │
                                    │ (IA Recom.)  │                                    │              │
                                    └──────┬───────┘                                    └──────┬───────┘
                                           │                                                   │
                                           ▼                                                   ▼
                                    ┌──────────────┐                                    ┌──────────────┐
                                    │    CASO      │                                    │   TALLER     │
                                    │  CERRADO ✓   │                                    │ Añade OBD    │
                                    │              │                                    │ Diagnóstico  │
                                    └──────────────┘                                    │   completo   │
                                                                                        └──────────────┘
```

---

## Changelog

### v2.0 (2024-11-30)
- **Token en URL del cliente**: El operador genera URL con JWT token para que el cliente pueda interactuar con el backend
- **Auto-generación del preliminary**: Cuando el cliente termina, automáticamente se llama a `/preliminary`
- **Pantalla "Generando diagnóstico"**: Nueva UI mientras la IA procesa
- **TecDoc integration**: El vehículo se crea automáticamente con datos de TecDoc usando solo la matrícula
- **Endpoints corregidos**: `PUT /cars/:carId/diagnosis/:diagnosisId/answers` (no `/cars/diagnosis/:id`)
- **Semáforo simplificado**: Solo 2 opciones (repair/tow), eliminado "info"
- **Servicio de recomendación IA**: Nueva capa de servicio para generar recomendaciones contextualizadas
