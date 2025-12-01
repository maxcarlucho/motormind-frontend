# Plan de Implementación: Carretera MVP

Este plan detalla los pasos técnicos para construir el MVP de Carretera dentro del repositorio `motormind-frontend`.

## Estrategia Técnica
Utilizaremos una arquitectura de "Feature Module" para mantener el código de Carretera aislado pero capaz de reutilizar los servicios de Motormind.
*   **Directorio:** `src/features/carretera`
*   **Rutas:** Prefijo `/carretera/*`

## Fase 1: Configuración Inicial (Setup)

- [ ] **Crear estructura de directorios**
    - `src/features/carretera/components` (UI específica)
    - `src/features/carretera/pages` (Vistas principales)
    - `src/features/carretera/hooks` (Lógica de negocio)
    - `src/features/carretera/routes.tsx` (Definición de rutas)
- [ ] **Configurar Router Principal**
    - Importar rutas de Carretera en `src/routes.tsx`.
    - Asegurar que el `Layout` sea el adecuado (quizás un Layout simplificado sin sidebar para móviles).

## Fase 2: Vista del Cliente (Pre-Diagnóstico)

- [ ] **Página de Landing (`/carretera/c/:id`)**
    - Recuperar datos del caso (creado vía WhatsApp) usando `damageAssessmentApi`.
    - Mostrar saludo inicial y síntoma reportado.
- [ ] **Interfaz de Chat/Preguntas**
    - Reutilizar lógica de `DiagnosisQuestions` pero con UI simplificada (estilo WhatsApp/Chat).
    - Componente `ChatInterface`: Muestra preguntas de la IA una a una.
    - Input de voz: Permitir al cliente grabar un mensaje de voz para describir el problema, con transcripción automática para facilitar la lectura por parte del gruista.
- [ ] **Finalización Cliente**
    - Pantalla de "Gracias, la grúa está en camino".
    - Trigger de actualización al backend (para que el gruista vea que ya hay info).

## Fase 3: Dashboard del Gruista (La Herramienta)

- [ ] **Dashboard Principal (`/carretera/g/dashboard`)**
    - Lista de asistencias activas (mock o endpoint filtrado).
    - Tarjetas de resumen con matrícula y estado.
- [ ] **Detalle de Asistencia (`/carretera/g/:id`)**
    - **Semáforo IA:** Componente visual que interpreta la respuesta de la IA.
        - Lógica: Si `possibleReasons` incluye "Batería" con prob > 80% -> VERDE.
    - **Resumen Técnico:** Mostrar "Posibles causas" de forma resumida.
    - **Acciones:** Botones grandes "Reparado In-situ" / "Requiere Grúa".
- [ ] **Generación de Link Taller**
    - Si se selecciona "Requiere Grúa", generar link `/carretera/t/:id` y botón para compartir (Web Share API).

## Fase 4: Vista del Taller (Recepción)

- [ ] **Página de Recepción (`/carretera/t/:id`)**
    - Vista de solo lectura con toda la info recopilada.
    - Botón "Iniciar Diagnóstico Motormind" -> Redirige a `/cars/:id/diagnosis/...` (flujo normal de Motormind).

## Fase 5: Estilos y UX (Mobile First)

- [x] **Adaptación CSS** ✅ (2024-12-01)
    - Todos los componentes de `src/features/carretera` son 100% responsive.
    - Botones grandes (48px+ altura) para dedos con guantes (caso de uso gruista).
    - Alto contraste para visibilidad en exterior (sol).
    - **Mejoras responsive aplicadas:**
      - `WorkshopDashboard`: Contenedores con `max-w-4xl mx-auto` para consistencia en desktop
      - Filtros con `flex-nowrap` para scroll horizontal sin wrap
      - `TrafficLightDecision`: Badge "IA Recomienda" con `flex-wrap` para pantallas < 375px
      - `ChatInterface`: Botón de envío con mejor área táctil (`min-w-[52px]`, `flex-shrink-0`)

## Dependencias Requeridas
*   `lucide-react` (Iconos ya instalados).
*   `framer-motion` (Opcional, para transiciones suaves en el chat).
*   Servicios existentes: `api.service.ts`, `damageAssessmentApi.service.ts`.
