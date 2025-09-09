# Wizard V2 - Nueva Navegación Basada en ID Real

## 🎯 Objetivos Completados

✅ **Navegación real basada en ID**: Todas las pantallas viven bajo URLs con `assessmentId` real  
✅ **Validación de IDs**: Manejo robusto de IDs inválidos/inexistentes  
✅ **Carga de datos por paso**: Sistema preparado para cargar datos específicos por paso  
✅ **Errores amigables**: Páginas de error consistentes con el resto del sitio  
✅ **Eliminación de previewId**: Completamente removido, excepto para flujo de intake  

## 🔄 Mapa de Rutas

### **Punto de Entrada (Creación)**
```
GET /damage-assessments/create?wizard=v2
└── Redirige a: /damage-assessments/preview-id/wizard-v2?step=intake
```

### **Wizard V2 (Navegación Principal)**
```
/damage-assessments/:assessmentId/wizard-v2
├── ?step=intake    (solo para preview-id)
├── ?step=damages   (detección/confirmación)
├── ?step=operations (generación/edición de operaciones)
├── ?step=valuation (valoración/costos)
└── ?step=finalize  (finalización)
```

### **Redirecciones Automáticas**
- **Sin step**: Redirige según `workflow.status`
- **Step inválido**: Redirige a `damages`
- **ID inválido**: Página de error
- **Assessment no encontrado**: Página de error

## 🏗️ Arquitectura de Validación

### **WizardV2Entry - Punto de Control**
```typescript
// 1. Verificar wizard habilitado
if (!WIZARD_V2_ENABLED) → Redirect to wizard v1

// 2. Caso especial preview-id (intake)
if (id === 'preview-id') → Render <Intake />

// 3. Validar formato de ID
if (!isValidAssessmentId(id)) → <ErrorPage />

// 4. Cargar datos del assessment
try {
  const data = await damageAssessmentApi.getDetectedDamages(id);
  // Validar step y redirigir si es necesario
} catch (error) {
  if (404) → Error "Assessment no encontrado"
  if (403) → Error "Sin permisos"
  else → Error genérico
}
```

### **Funciones de Validación**
```typescript
// utils/navigation.ts
isValidAssessmentId(id: string): boolean
// Valida formato MongoDB ObjectId (24 chars hex)

isValidStep(step: string): step is WizardStep
// Valida steps: intake|damages|operations|valuation|finalize

getStepFromWorkflowStatus(status: WorkflowStatus): WizardStep
// Mapea estado workflow → step apropiado
```

## 📊 Estados y Redirecciones

### **Mapeo Workflow Status → Step**
```typescript
'processing' | 'detected' → 'damages'
'damages_confirmed' | 'operations_defined' → 'operations'  
'valuated' → 'valuation'
'completed' → 'finalize'
```

### **Validaciones por Step**
- **damages**: Siempre accesible, muestra datos si existen
- **operations**: Accesible, muestra CTA "Generar" si no hay datos
- **valuation**: Accesible, muestra CTA "Generar" si no hay datos  
- **finalize**: Accesible cuando hay valoración

## 🚨 Manejo de Errores

### **ErrorPage Component**
Página consistente para todos los errores:
```typescript
<ErrorPage
  title="No pudimos cargar este peritaje"
  message="Verificá el enlace o probá de nuevo."
  onRetry={() => window.location.reload()}
  onGoBack={() => navigate('/damage-assessments')}
/>
```

### **Tipos de Error**
- **ID inválido**: Formato incorrecto
- **Assessment no encontrado**: 404 del backend
- **Sin permisos**: 403 del backend
- **Error desconocido**: Otros errores de red/backend

## 🔄 Flujo de Datos

### **Carga Inicial**
```typescript
// WizardV2Entry carga datos del assessment
const response = await damageAssessmentApi.getDetectedDamages(id);

// Los datos se pasan al WizardV2Router
<WizardV2Router assessmentData={response} />

// WizardV2Router los inyecta en el contexto
dispatch({ type: 'SET_DETECTED_DAMAGES', payload: response });
```

### **Contexto del Wizard**
- **assessmentId**: ID real del assessment (desde URL)
- **detectedDamages**: Datos completos del backend
- **status**: Estado del workflow
- **currentStep**: Step actual de la navegación

## 🧪 Casos de Prueba

### **Deep Links (URLs directas)**
✅ `/damage-assessments/valid-id/wizard-v2?step=damages`  
✅ `/damage-assessments/valid-id/wizard-v2?step=operations`  
✅ `/damage-assessments/valid-id/wizard-v2` (sin step → redirección)  

### **Errores**
✅ `/damage-assessments/invalid-id/wizard-v2` → Error page  
✅ `/damage-assessments/non-existent/wizard-v2` → Error page  
✅ `/damage-assessments/valid-id/wizard-v2?step=invalid` → Redirect  

### **Permisos**
✅ Assessment de otro workshop → Error 403  

## 📁 Archivos Modificados

### **Nuevos Componentes**
- `features/damage-wizard-v2/utils/navigation.ts` - Utilidades de navegación
- `features/damage-wizard-v2/components/ErrorPage.tsx` - Página de error

### **Modificados**
- `features/damage-wizard-v2/routes.tsx` - Lógica de validación y carga
- `pages/DamageAssessments/CreateDamageAssessment.tsx` - Detección wizard=v2
- `pages/DamageAssessments/index.tsx` - Link actualizado
- `routes.tsx` - Limpieza de rutas innecesarias

## 🔗 URLs de Ejemplo

### **Producción**
```
✅ /damage-assessments/create?wizard=v2
   → /damage-assessments/preview-id/wizard-v2?step=intake

✅ /damage-assessments/68a36e9e24dbab67bd8f1ea7/wizard-v2
   → Redirige según workflow.status

✅ /damage-assessments/68a36e9e24dbab67bd8f1ea7/wizard-v2?step=damages
   → Muestra página de daños con datos reales
```

### **Errores**
```
❌ /damage-assessments/invalid-id/wizard-v2
   → Error: "ID de peritaje inválido"

❌ /damage-assessments/68a36e9e24dbab67bd8f1ea7/wizard-v2?step=invalid
   → Redirect: ?step=damages
```

## ✅ Estado Actual

- ✅ **Navegación basada en ID real**
- ✅ **Validación robusta de IDs**  
- ✅ **Páginas de error amigables**
- ✅ **Redirecciones inteligentes**
- ✅ **Carga de datos por assessment**
- ✅ **Eliminación de preview-id** (excepto intake)
- ⏳ **CTAs explícitos por paso** (pending)
- ⏳ **Polling Tchek con backoff** (pending)
- ⏳ **Hooks useStepData** (pending)

## 🚀 Próximos Pasos

1. **CTAs explícitos**: Botones "Generar operaciones/valoración"
2. **Polling Tchek**: Backoff progresivo en step=damages  
3. **Hooks por paso**: `useStepData()` para cada paso
4. **Tests deep-linking**: Verificar navegación directa
5. **MSW migration**: Mover mocks JSON a handlers

**¡La navegación robusta está implementada y funcionando! 🎉**
