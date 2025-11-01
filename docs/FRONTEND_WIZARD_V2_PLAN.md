### FRONTEND Wizard V2 – Plan de implementación (walking skeleton)

## Objetivo
Implementar un wizard v2 aislado para el flujo de peritaje por etapas, usando data mock al inicio y conectando backend progresivamente, sin romper el wizard v1. No mostrar horas en Operaciones; horas solo en Valoración.

## Arquitectura y aislamiento
- Carpeta: `src/features/damage-wizard-v2/`
  - `index.ts`
  - `routes.tsx` (monta `/damage-assessments/:id/wizard-v2`)
  - `WizardEntry.tsx` (redirige v1/v2 por flag)
  - `context/WizardV2Context.tsx`
  - `api/adapter.ts` (adaptadores a `damageAssessmentApi`)
  - `types/` (tipos locales del wizard v2)
  - `mocks/` (fixtures JSON)
  - `components/` (composiciones reutilizando átomos)
  - `pages/Intake.tsx`, `pages/Damages.tsx`, `pages/Operations.tsx`, `pages/Valuation.tsx`, `pages/Finalize.tsx`

- Feature flag: `VITE_WIZARD_V2_ENABLED=true`. Ruta de entrada: `/damage-assessments/:id/wizard` → decide v1 o v2.

## Estado global (WizardV2Context)
```ts
export type WizardV2Status = 'processing'|'detected'|'damages_confirmed'|'operations_defined'|'valuated'|'completed'|'error';

export type WizardV2State = {
  assessmentId?: string;
  status: WizardV2Status;
  plate?: string;
  claimDescription?: string;
  images: string[];
  detectedDamages?: Array<{ id: string; area: string; subarea?: string; type: 'scratch'|'dent'|'crack'|string; severity: 'SEV1'|'SEV2'|'SEV3'|string; notes?: string }>;
  confirmedDamageIds?: string[];
  operations?: Array<{ mappingId: string; partName: string; mainOperation?: { operation: 'REPAIR'|'REPLACE'|'PAINT'|'POLISH'|string; description?: string; code?: string; complexity?: 'SIMPLE'|'MODERATE'|'COMPLEX' }; subOperations?: Array<{ operation: string; description?: string; code?: string; complexity?: 'SIMPLE'|'MODERATE'|'COMPLEX' }>; paint?: { apply?: boolean; paintType?: 'MONOCOAT'|'BICOAT'|'TRICOAT'; finishType?: 'NEW_PART'|'REPAIRED_PART' } }>;
  valuation?: {
    labor: Array<{ mappingId: string; partName: string; operation: string; hours: number; rate: number; total: number; source: 'autodata'|'segment_lookup'|'calc'|'user_override'|'no_data' }>;
    paint: Array<{ mappingId: string; partName: string; job: string; paintHours: number; paintLaborTotal: number; units?: number; unitPrice?: number; materialsTotal: number; total: number }>;
    parts?: Array<{ ref: string; partName: string; unitPrice: number; qty: number; total: number }>;
    totals: { labor: number; paintLabor: number; paintMaterials: number; parts: number; grandTotal: number; currency: string };
  };
  flags?: { usedMockTchek?: boolean; hasNoDataLabor?: boolean };
};
```

Acciones: `createIntake`, `pollUntilDetected`, `confirmDamages`, `generateOperations`, `saveOperations`, `generateValuation`, `finalize`, `reset`. Mantener `?step=` en URL.

## Rutas
- `/damage-assessments/:id/wizard` → `WizardEntry` (redirige a v1 o `/wizard-v2` por flag)
- `/damage-assessments/:id/wizard-v2` (usa `?step=intake|damages|operations|valuation|finalize`)

## Walking skeleton (PR 1)
- Páginas con mocks y navegación completa.
- UI: reutilizar átomos existentes (Button, Select, Input, Badge, Card, Table, Alert).
- Operaciones no muestra horas; Valoración tiene 3 tablas: MO (sin pintura), Pintura (MO+Materiales con Unidades/€/unidad), Recambios.

## Conexión backend (PRs siguientes)
Endpoints esperados (ajustar a nombres reales):
- POST `/damage-assessments/intakes`
- GET `/damage-assessments/:id/damages`
- PATCH `/damage-assessments/:id/damages/confirm`
- POST `/damage-assessments/:id/operations/generate`
- PATCH `/damage-assessments/:id/operations`
- POST `/damage-assessments/:id/valuation/generate`
- PATCH `/damage-assessments/:id/finalize`

## Política de re-generación / overrides
- `keep_user_overrides`. Mostrar badge “cálculo actualizado” si hay diffs (cuando backend exponga `diffHints`).

## Unidades y moneda
- Interno dm²; display m² opcional.
- `currency` desde settings de taller; fallback `EUR`.

## Backlog y checklists

- Bootstrapping
  - [ ] Crear carpeta `src/features/damage-wizard-v2/`
  - [ ] Añadir feature flag y `WizardEntry`
  - [ ] Montar ruta `/damage-assessments/:id/wizard-v2`
  - [ ] Context y tipos
  - [ ] Mocks `intake.json`, `damages.json`, `operations.json`, `valuation.json`

- Pantallas
  - [ ] Intake (form placa, siniestro, upload) → CTA crear assessment (mock)
  - [ ] Daños (ver + confirmar) con contador y filtros básicos
  - [ ] Operaciones (sin horas) + “Guardar”
  - [ ] Valoración (3 tablas) + totales
  - [ ] Finalizar + lock

- Integración backend
  - [ ] Wire Intake real con polling/backoff (si `processing`)
  - [ ] GET Damages real y confirm PATCH
  - [ ] Generate/Save Operations
  - [ ] Generate Valuation
  - [ ] Finalize

- Infra UX
  - [ ] Flags y banners (mock vs real)
  - [ ] Telemetría básica por CTA
  - [ ] Accesibilidad (aria-live en `processing→detected`)

## Definición de Done por paso
- Intake: crea estado local y navega a Daños; si real, muestra progreso y polling.
- Daños: permite confirmar subset y navegar.
- Operaciones: permite editar tipo/metadata sin horas; persiste en contexto.
- Valoración: render de 3 tablas con totales desde mock; recalcula totales en UI.
- Finalizar: marca `completed` en contexto y bloquea edición.

## Referencias visuales
- Replicar jerarquía de las capturas: cards de daños con badges de severidad y confianza, chips “Pendiente de valoración” en Operaciones, tabla de Pintura con Unidades y €/unidad.


