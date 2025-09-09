# Plan de Integración Backend - Wizard v2

## 🎯 Objetivo
Integrar progresivamente el wizard v2 con el backend real, manteniendo aislamiento del v1 y siguiendo el patrón "walking skeleton" con datos mock primero.

## 📋 Estado Actual

### ✅ Completado
- Componentes de UI con paridad 1:1 al diseño
- Servicio `damageAssessmentApi.service.ts` con endpoints definidos
- Páginas del wizard con datos mock funcionando
- Sistema de tokens y design system alineado

### 🔍 Endpoints Backend Disponibles
```
POST /damage-assessments/intakes                    ✅ Implementado
GET  /damage-assessments/:id/damages                ✅ Implementado  
PATCH /damage-assessments/:id/damages/confirm       ✅ Implementado
POST /damage-assessments/:id/operations/generate    ✅ Implementado
PATCH /damage-assessments/:id/operations            ✅ Implementado
POST /damage-assessments/:id/valuation/generate     ✅ Implementado
PATCH /damage-assessments/:id/finalize              ✅ Implementado
```

## 🚀 Plan de Integración (PRs Graduales)

### PR 1: Fundaciones de Integración
**Archivos a crear/modificar:**
```
src/features/damage-wizard-v2/
├── context/WizardV2Context.tsx      ← Estado global del wizard
├── api/adapter.ts                   ← Transformadores data backend↔frontend  
├── types/backend.types.ts           ← Tipos específicos del backend
├── hooks/useWizardV2.ts            ← Hook para usar el contexto
└── utils/constants.ts               ← Feature flags y constantes
```

**Tareas:**
- [ ] Configurar WizardV2Context con estado completo
- [ ] Crear adaptadores de datos backend→frontend
- [ ] Definir tipos TypeScript para respuestas del backend
- [ ] Implementar feature flag `VITE_WIZARD_V2_ENABLED`
- [ ] Crear hook `useWizardV2` para componentes

### PR 2: Integración Intake + Polling
**Objetivo:** Reemplazar mock del intake con llamada real al backend

**Cambios en:**
- `pages/Intake.tsx` - Llamada real a `damageAssessmentApi.intake()`
- Polling para detectar cuando `status` cambia de `processing` → `detected`
- Manejo de estados loading/error
- Navegación automática cuando detección completa

**Flujo:**
1. Usuario llena formulario → POST `/intakes`
2. Backend retorna `{ id, workflow: { status: 'processing' } }`
3. Frontend polling cada 3s a GET `/damages` hasta status ≠ 'processing'
4. Auto-navegación a step `damages`

### PR 3: Integración Damages (Ver + Confirmar)
**Objetivo:** Mostrar daños reales detectados por Tchek

**Cambios en:**
- `pages/Damages.tsx` - GET real de damages
- Mapeo de datos Tchek → componentes `DamageCard`
- PATCH confirm con IDs seleccionados
- Manejo de estados vacíos/errores

**Mapeo de datos:**
```typescript
// Backend response
detectedDamages: Array<{
  _id: string;
  area: string;
  subarea?: string;
  type: string;
  severity: 'SEV1'|'SEV2'|'SEV3';
  confidence: number;
  // ... otros campos Tchek
}>

// Frontend (nuestros tipos)
damages: Damage[] = [{
  id: string;
  zone: string;
  subzone?: string;
  type: string;
  severity: 'leve'|'medio'|'grave';  // SEV1→leve, SEV2→medio, SEV3→grave
  confidence: number;
  imageUrl: string;
  status: 'pending'|'confirmed'|'rejected';
}]
```

### PR 4: Integración Operations
**Objetivo:** Generar y editar operaciones reales

**Cambios en:**
- `pages/Operations.tsx` - POST generate operations + PATCH save
- Mapeo de operaciones backend → frontend
- Manejo de "no data" scenarios
- Guardar overrides del usuario

**Datos esperados:**
```typescript
// Backend operations response
operations: Array<{
  mappingId: string;
  partName: string;
  mainOperation: {
    operation: 'REPAIR'|'REPLACE'|'PAINT'|'POLISH';
    description: string;
    complexity?: 'SIMPLE'|'MODERATE'|'COMPLEX';
  };
  subOperations?: Array<{...}>;
  paint?: { apply: boolean; paintType: string; }
}>
```

### PR 5: Integración Valuation
**Objetivo:** Generar valoración con datos reales de Autodata/Cesvi

**Cambios en:**
- `pages/ValuationNew.tsx` - POST generate valuation
- 3 tablas con datos reales:
  - Labor (sin pintura) con horas de Autodata
  - Pintura (MO + materiales) con baremo Cesvi
  - Recambios con precios reales
- Inline edit que persiste cambios
- Recálculo de totales

**Estructura de datos:**
```typescript
valuation: {
  labor: Array<{
    mappingId: string;
    partName: string;
    operation: string;
    hours: number;
    rate: number;
    total: number;
    source: 'autodata'|'segment_lookup'|'calc'|'user_override'|'no_data';
  }>;
  paint: Array<{
    mappingId: string;
    partName: string;
    job: string;
    paintHours: number;
    paintLaborTotal: number;
    units?: number;
    unitPrice?: number;
    materialsTotal: number;
    total: number;
  }>;
  parts?: Array<{
    ref: string;
    partName: string;
    unitPrice: number;
    qty: number;
    total: number;
  }>;
  totals: {
    labor: number;
    paintLabor: number;
    paintMaterials: number;
    parts: number;
    grandTotal: number;
    currency: string;
  };
}
```

### PR 6: Integración Finalize + Entry Point
**Objetivo:** Completar el flujo + routing v1/v2

**Cambios en:**
- `pages/Finalize.tsx` - PATCH finalize
- `WizardEntry.tsx` - Router que decide v1 vs v2
- Feature flag integration
- URL management con `?step=`

**Routing:**
```typescript
// Nueva ruta de entrada
/damage-assessments/:id/wizard
  ↓
WizardEntry.tsx checks VITE_WIZARD_V2_ENABLED
  ↓
if (enabled) → /damage-assessments/:id/wizard-v2?step=intake
if (!enabled) → [wizard v1 actual]
```

## 🔧 Implementación Técnica

### 1. WizardV2Context State
```typescript
type WizardV2Status = 'processing'|'detected'|'damages_confirmed'|'operations_defined'|'valuated'|'completed'|'error';

interface WizardV2State {
  // Identificación
  assessmentId?: string;
  status: WizardV2Status;
  
  // Datos de entrada
  plate?: string;
  claimDescription?: string;
  images: string[];
  
  // Datos procesados
  detectedDamages?: DetectedDamage[];
  confirmedDamageIds?: string[];
  operations?: BackendOperation[];
  valuation?: BackendValuation;
  
  // Metadatos
  flags?: {
    usedMockTchek?: boolean;
    hasNoDataLabor?: boolean;
  };
  
  // UI state
  loading: boolean;
  error?: string;
}
```

### 2. Adaptadores (adapter.ts)
```typescript
export const adaptDetectedDamages = (backendDamages: BackendDamage[]): Damage[] => {
  return backendDamages.map(damage => ({
    id: damage._id,
    zone: damage.area,
    subzone: damage.subarea,
    type: damage.type,
    severity: adaptSeverity(damage.severity), // SEV1→leve, etc.
    confidence: damage.confidence,
    imageUrl: damage.imageUrl || '/placeholder-damage.jpg',
    status: 'pending' as const,
  }));
};

export const adaptSeverity = (backendSev: string): 'leve'|'medio'|'grave' => {
  switch (backendSev) {
    case 'SEV1': return 'leve';
    case 'SEV2': return 'medio';
    case 'SEV3': return 'grave';
    default: return 'medio';
  }
};

// Más adaptadores para operations, valuation, etc.
```

### 3. Polling Pattern
```typescript
const usePolling = (assessmentId: string, enabled: boolean) => {
  const [status, setStatus] = useState<WizardV2Status>('processing');
  
  useEffect(() => {
    if (!enabled || !assessmentId) return;
    
    const poll = async () => {
      try {
        const response = await damageAssessmentApi.getDetectedDamages(assessmentId);
        const newStatus = response.workflow?.status || 'processing';
        setStatus(newStatus);
        
        if (newStatus !== 'processing') {
          // Detección completa, parar polling
          return true;
        }
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('error');
        return true;
      }
      return false;
    };
    
    const interval = setInterval(async () => {
      const shouldStop = await poll();
      if (shouldStop) clearInterval(interval);
    }, 3000);
    
    // Poll inmediato
    poll();
    
    return () => clearInterval(interval);
  }, [assessmentId, enabled]);
  
  return status;
};
```

## 🔒 Principios de Seguridad

1. **Aislamiento**: Wizard v2 no debe romper v1
2. **Feature Flag**: Fácil rollback si hay problemas
3. **Backward Compatibility**: APIs existentes no se modifican
4. **Error Handling**: Fallback a mock si backend falla
5. **Loading States**: UX clara durante llamadas async

## 📊 Criterios de Éxito

- [ ] ✅ Feature flag funciona (enable/disable v2)
- [ ] ✅ Polling no hace spam al backend (max 1 req/3s)
- [ ] ✅ Datos reales se muestran correctamente en UI
- [ ] ✅ Error handling no rompe la experiencia
- [ ] ✅ V1 sigue funcionando normalmente
- [ ] ✅ URLs mantienen estado (?step=intake etc.)
- [ ] ✅ Mock/real data claramente diferenciados
- [ ] ✅ Performance: componentes no re-renderizan innecesariamente

## 🚨 Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Backend lento/caído | Timeout + fallback a mock data |
| Polling infinito | Max intentos + exponential backoff |
| Datos malformados | Validators + adapters con defaults |
| V1 se rompe | Feature flag + aislamiento completo |
| Memory leaks | Cleanup en useEffect returns |

---

**Próximo PR**: Empezar con PR 1 (Fundaciones) para establecer la base sólida.
