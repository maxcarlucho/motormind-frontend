# Flujo de Diagnóstico IA - Servicio Carretera

## Resumen del Flujo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  OPERADOR   │───>│   CLIENTE   │───>│    GRÚA     │───>│   TALLER    │
│  Crea caso  │    │  Responde   │    │   Decide    │    │  Diagnóstico│
│  + Prompt 1 │    │  preguntas  │    │  + Prompt 2 │    │  completo   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Prompts de IA del Sistema

| # | Prompt | Ubicación | Propósito |
|---|--------|-----------|-----------|
| 1 | **Generación de Preguntas** | `hooks/useCreateCase.ts:71-86` | Genera preguntas concisas para cliente varado |
| 2 | **Recomendación Gruista** | `services/gruistaRecommendation.service.ts` | Analiza pre-diagnóstico y genera recomendación contextualizada |

### Prompt 2: Detalles
- **Input**: Pre-diagnóstico de Motormind + respuestas del cliente + ubicación
- **Output JSON**:
  - `recommendation`: 'repair' | 'tow'
  - `confidence`: 0-100
  - `summary`: Resumen corto (máx 80 chars)
  - `reasoning`: Array de razones
  - `actionSteps`: Pasos a seguir
  - `risks`: Riesgos si falla
  - `estimatedTime`: '15-30 min' | '45-60 min' | '>1 hora'
  - `alternativeConsideration`: Qué hacer si cambia la situación
- **Contexto especial**: Toledo, España - detecta autovías (A-42, etc.), hora del día

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
   - Ve inmediatamente pantalla "¡Gracias! La grúa está en camino"
   - En segundo plano se llama a `/preliminary` (el cliente no lo ve)

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
| Completado | "¡Gracias! La grúa está en camino" |

**Nota**: Cuando el cliente termina de responder, ve inmediatamente la pantalla de "Completado". La generación del diagnóstico IA ocurre en segundo plano, sin mostrar estados de carga al cliente.

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
    ├── ClientLanding.tsx       # Chat del cliente + pantalla completado
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
                                             │ Al terminar última pregunta
                                             │ ve "¡Gracias! La grúa está en camino"
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │      BACKEND (en segundo     │
                              │      plano, cliente no ve)   │
                              │  POST /preliminary           │
                              │  → Genera diagnóstico IA     │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │     GRUISTA     │
                                    │  Ve estados:    │
                                    │  - waiting      │
                                    │  - answering    │
                                    │  - ready ✓      │
                                    └────────┬────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
                     ▼                                               ▼
            ┌──────────────┐                                ┌──────────────┐
            │ 🟢 REPARAR   │                                │ 🔴 REMOLCAR  │
            │   IN-SITU    │                                │  AL TALLER   │
            │ (IA Recom.)  │                                │              │
            └──────┬───────┘                                └──────┬───────┘
                   │                                               │
                   ▼                                               ▼
            ┌──────────────┐                                ┌──────────────┐
            │    CASO      │                                │   TALLER     │
            │  CERRADO ✓   │                                │ Añade OBD    │
            │              │                                │ Diagnóstico  │
            └──────────────┘                                │   completo   │
                                                            └──────────────┘
```

---

## Changelog

### v2.5 (2024-12-01)
- **UI de Diagnóstico IA completamente rediseñada** (`AIAssessmentSummary.tsx`):
  - Badge de recomendación más grande y prominente: "🔴 REMOLCAR AL TALLER" / "🟢 REPARABLE IN-SITU"
  - Confianza y tiempo estimado en badges compactos junto a la recomendación
  - Nuevo campo `summary` como título principal (más conciso que `diagnosis`)
  - **Nueva sección "📋 Qué hacer"**: Lista numerada de `actionSteps` con pasos concretos para el gruista
  - **Sección de riesgos mejorada**: Muestra hasta 2 riesgos con iconos de advertencia
  - **Nueva sección "💡 Si la situación cambia"**: Muestra `alternativeConsideration` como nota al pie
  - Layout responsive mejorado para móviles pequeños
- **Campos de `AIAssessment` ahora utilizados en UI**:
  - `summary` - Resumen corto (máx 80 chars)
  - `actionSteps` - Pasos a seguir
  - `risks` - Riesgos si falla
  - `estimatedTime` - Tiempo estimado
  - `alternativeConsideration` - Qué hacer si cambia la situación

### v2.4 (2024-11-30)
- **Rediseño completo UX para Gruista**:
  - Resumen de diagnóstico IA más conciso con datos clave visibles de un vistazo
  - Badge de recomendación prominente (🟢 REPARABLE / 🔴 REMOLCAR) + % confianza
  - Extracción automática de puntos clave del reasoning largo
  - Pantalla de carga mejorada con contexto sobre qué está pasando
- **Rediseño completo UX para Taller**:
  - Modal de bienvenida simplificado para técnicos que no conocen el sistema
  - Al aceptar modal, se auto-acepta el caso y va directo al formulario OBD
  - Formulario OBD rediseñado con TODO el contexto del caso:
    - Problema reportado
    - Pre-diagnóstico IA con recomendación y confianza
    - Respuestas del cliente (colapsables)
  - Eliminadas pantallas intermedias innecesarias
- **Mejoras generales**:
  - El técnico ve todo el historial en una sola pantalla
  - Referencia de códigos OBD colapsada por defecto
  - Optional chaining corregido para evitar crashes

### v2.3 (2024-11-30)
- **Bug documentado**: El campo `notes` enviado al backend NO se usa en el prompt de generación de preguntas
  - **Ubicación del problema**: Backend `scripts/update-questions-prompt-v3-6.ts` - El prompt template no incluye `{NOTES}`
  - **Impacto**: El contexto de carretera enviado desde el frontend es ignorado
  - **Workaround aplicado**: Se incluye el contexto directamente en el campo `fault` (síntoma)
  - **Solución permanente requerida**: Actualizar el prompt de QUESTIONS_GENERATION en el backend para incluir `{NOTES}`
- **Servicio de recomendación IA para Gruista**: Nuevo servicio `gruistaRecommendation.service.ts` que genera recomendaciones contextualizadas
- **Flujo de escalación**: Nuevo estado `repair-failed` para cuando el gruista intenta reparar pero falla

### v2.2 (2024-11-30)
- **Taller OBD funcional**: Flujo completo del taller con códigos OBD funcionando correctamente
- **Diagnóstico IA con OBD**: El taller puede añadir códigos OBD (ej: C1384, P171C) y regenerar diagnóstico completo
- **Posibles Averías y Soluciones**: La IA genera lista de posibles causas con:
  - Probabilidad (🔴 Alta 85%, 🟡 Media 65%, 🟢 Baja 45%)
  - Descripción detallada del problema
  - Pasos para solucionar
  - Herramientas requeridas
- **Mensaje de tiempo estimado**: Añadido mensaje "Este proceso puede tardar entre 1-2 minutos" mientras genera diagnóstico OBD
- **Fix crash taller**: Corregido error `failures.map is not a function` - ahora `failures` siempre es array

### v2.1 (2024-11-30)
- **UX mejorada para cliente**: Eliminada pantalla "Generando diagnóstico...". El cliente ve directamente "¡Gracias! La grúa está en camino" mientras la IA procesa en segundo plano

### v2.0 (2024-11-30)
- **Token en URL del cliente**: El operador genera URL con JWT token para que el cliente pueda interactuar con el backend
- **Auto-generación del preliminary**: Cuando el cliente termina, automáticamente se llama a `/preliminary`
- **TecDoc integration**: El vehículo se crea automáticamente con datos de TecDoc usando solo la matrícula
- **Endpoints corregidos**: `PUT /cars/:carId/diagnosis/:diagnosisId/answers` (no `/cars/diagnosis/:id`)
- **Semáforo simplificado**: Solo 2 opciones (repair/tow), eliminado "info"
- **Servicio de recomendación IA**: Nueva capa de servicio para generar recomendaciones contextualizadas
