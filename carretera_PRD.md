# PRD: Proyecto Carretera (PoC Mapfre)

## 1. Resumen Ejecutivo
**Objetivo:** Desarrollar un MVP (Producto Mínimo Viable) para validar la reducción de costes de movilidad y repatriación en la asistencia en carretera de Mapfre.
**Meta Principal:** Filtrar asistencias mediante IA para aumentar resoluciones "in-situ" y optimizar la derivación a talleres.
**Usuarios:**
1.  **Cliente Final:** Conductor averiado.
2.  **Gruista (Paco/Luis):** Operador de asistencia (Bonilla Motor).
3.  **Taller Destino:** Mecánico que recibe el vehículo.

---

## 2. Problema y Solución

### El Problema
*   **Repatriaciones Innecesarias:** Vehículos trasladados que podrían haberse reparado localmente.
*   **Falsos Traslados Urbanos:** Averías simples (batería) tratadas como complejas.
*   **Fricción Operativa:** Gruistas llegando "a ciegas" y perdiendo tiempo en llamadas al Call Center.
*   **Talleres Saturados:** Recepción de vehículos sin contexto técnico ("no arranca").

### La Solución: Filtro Inteligente en 3 Pasos
1.  **Pre-Diagnóstico Remoto (WhatsApp + Web):** IA evalúa el síntoma antes de que llegue la grúa.
2.  **Semáforo de Decisión (App Gruista):** Interfaz simple para que el gruista decida (In-situ vs Taller).
3.  **Derivación Enriquecida (Web Taller):** Link digital con el historial técnico para el taller.

---

## 3. Flujos de Usuario (User Journeys)

### Flujo A: El Cliente (Pre-Cita/Pre-Diagnóstico)
1.  Recibe un **WhatsApp** automático de Mapfre/Bonilla al solicitar asistencia.
2.  Abre un link web (`/carretera/cliente/...`).
3.  Responde 4-6 preguntas dinámicas generadas por IA sobre el síntoma.
4.  **Output:** Se genera una probabilidad de reparación in-situ (invisible para él, visible para gruista).

### Flujo B: El Gruista (La Herramienta de Trabajo)
1.  Accede a su dashboard móvil (`/carretera/gruista`).
2.  Ve la lista de servicios activos o busca por matrícula.
3.  **Visualiza el "Semáforo":**
    *   🟢 **Verde:** Alta prob. reparación in-situ (ej. Batería). Acción: Intentar reparar.
    *   🟡 **Amarillo:** Dudoso. Acción: Revisar visualmente.
    *   🔴 **Rojo:** Grave (ej. Motor). Acción: Remolcar directo.
4.  **Acción:** Marca el resultado (Reparado / Remolcado).
5.  Si remolca -> Genera/Comparte link para el taller.

### Flujo C: El Taller (Recepción)
1.  Recibe el link del gruista (`/carretera/taller/...`).
2.  Visualiza:
    *   Síntomas reportados por cliente.
    *   Diagnóstico preliminar de la IA.
    *   Notas del gruista.
3.  (Opcional) Conecta OBD para diagnóstico profundo (usando flujo existente de Motormind).

---

## 4. Requerimientos Funcionales (MVP)

### Frontend (Nuevas Vistas)
1.  **Landing Cliente:** Interfaz chat-like para responder preguntas de diagnóstico (Mobile first).
2.  **Dashboard Gruista:**
    *   Login simplificado (o acceso por token persistente).
    *   Lista de casos asignados.
    *   Vista de Detalle de Caso con "Semáforo" y recomendaciones (ej. "Llevar pinzas").
3.  **Vista Taller (Solo lectura + Acción):**
    *   Resumen del caso.
    *   Botón "Iniciar Diagnóstico Completo" (lleva al wizard de Motormind existente).

### Backend (Integración Motormind)
*   Reutilizar `POST /damage-assessments/intakes` para iniciar el caso desde WhatsApp.
*   Reutilizar motor de IA para generar preguntas y probabilidades.
*   Nuevo endpoint o lógica para calcular el "Score In-situ" (Semáforo) basado en las `possibleReasons` de la IA.

---

## 5. Plan de Implementación (Roadmap Técnico)

### Fase 1: Setup y Rutas (Día 1)
*   Crear estructura de carpetas `/src/features/carretera`.
*   Configurar rutas en `react-router`:
    *   `/carretera/c/:id` (Cliente)
    *   `/carretera/g/dashboard` (Gruista)
    *   `/carretera/t/:id` (Taller)

### Fase 2: Vista Cliente (Día 1-2)
*   Adaptar componente de preguntas de Motormind (`DiagnosisQuestions`) para una experiencia ultra-ligera móvil.

### Fase 3: Vista Gruista (Día 2-3)
*   Implementar lógica de "Semáforo" (Parsing de respuesta de IA).
*   UI de tarjetas grandes y botones claros para uso en exterior/movimiento.

### Fase 4: Vista Taller y Conexión (Día 4)
*   Vista de resumen.
*   Integración con el flujo de OBD existente.
*   Integración con el informe final adaptado a caso de uso Carretera.

---

## 6. KPIs de Éxito (Validación)
*   **% In-situ:** Aumentar del 32% al 37%.
*   **Tiempo Diagnóstico:** Reducir de 45 min a 20 min.
*   **Detección Baterías:** >80% de precisión.
