# Claude Summary

## objetivo
Lanzar el **MVP del Servicio Carretera Inteligente** cumpliendo con los requisitos del PRD, el contexto del proyecto y el plan de implementación.

## documentos de referencia
- **carretera_PRD.md** – descripción del producto, flujos de usuario y KPIs.
- **carretera_context.md** – contexto del proyecto, actores y reglas de oro.
- **carretera_plan.md** – roadmap técnico y fases de desarrollo.
- **implementation_plan.md** – detalle de los cambios propuestos en el código (rutas, componentes, hooks, API).

## alcance del MVP
1. **Cliente** – interfaz tipo chat para responder preguntas de diagnóstico (ruta `/carretera/c/:id`).
2. **Gruista** – dashboard móvil con lista de casos, semáforo de decisión y acciones **Reparado / Remolcar** (ruta `/carretera/g/dashboard`).
3. **Taller** – vista de solo lectura del caso con botón para iniciar el wizard de diagnóstico completo (ruta `/carretera/t/:id`).

## componentes clave (solo bajo `src/features/carretera`)
- `routes.tsx` – definición de rutas.
- `pages/ClienteLanding.tsx`, `pages/GruistaDashboard.tsx`, `pages/TallerPage.tsx` – vistas principales.
- `components/CaseCard.tsx` – tarjeta reutilizable con badge de semáforo.
- `hooks/useGruistaCases.ts` – hook para obtener los casos asignados.
- `api/routes.ts` – endpoint placeholder que proxy a los servicios existentes de Motormind.

## reglas de desarrollo
- **Ningún archivo fuera de `/carretera` será modificado.**
- Mantener el estilo visual mobile‑first, colores de semáforo (🟢 🟡 🔴) y tipografía legible.
- Utilizar `react-query` para la carga de datos y manejar estados de carga/error.

## plan de verificación
- **Tests unitarios** para `useGruistaCases` y `CaseCard`.
- **Pruebas manuales** navegando a cada ruta, verificando filtros, colores del semáforo y acciones de botón.
- Ejecutar `npm test` y `npm run dev` para asegurar que no haya regresiones fuera de `/carretera`.

---
*Este documento resume la información esencial para que Claude (el asistente) pueda guiar la implementación y revisión del MVP.*
