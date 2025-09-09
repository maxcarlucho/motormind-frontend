# Wizard V2 - Sistema de Navegación del Stepper

## Resumen

El sistema de navegación del Stepper del Wizard V2 permite navegar hacia atrás en pasos ya completados con reglas claras de **solo lectura**. Está diseñado para ser extensible y no romper la lógica de negocio existente.

## Reglas de Oro

1. **Volver hacia atrás = solo lectura**: Si el usuario salta a un paso anterior ya completado, NO puede editar nada (no inputs, no uploads, no PATCH/POST). Solo visualiza lo que se subió/cargó originalmente.

2. **CTA "Continuar" en modo solo lectura**: Si estoy en el **paso 4** y navego al **paso 1**, al presionar "Continuar" debo **avanzar al siguiente paso (2)** sin enviar nada al backend. Es navegación pura paso-a-paso.

3. **Deep links**: cualquier URL `/damage-assessments/:id/wizard-v2?step=X` debe cargar data y aplicar las reglas anteriores automáticamente.

4. **Sin side-effects** al visitar pasos en read-only: no regenerar operaciones ni valoración por navegar.

5. **Extensible**: dejar un flag para permitir edición hacia atrás en el futuro sin reescribir todo.

## Arquitectura

### Provider + Hook

```tsx
// Provider principal
<StepperNavigationProvider
  assessmentId={assessmentId}
  workflowStatus={workflowStatus}
  currentStep={currentStep}
  allowBackEdit={false} // flag futuro
>
  {children}
</StepperNavigationProvider>;

// Hook para usar en componentes
const { mode, continueFromHere, isReadOnly } = useWizardStepNav();
```

### Orden de Pasos

```ts
const STEP_ORDER = ['intake', 'damages', 'operations', 'valuation', 'finalize'];
```

### Mapeo Workflow Status → Máximo Paso Editable

| Workflow Status      | Máximo Paso Editable |
| -------------------- | -------------------- |
| `processing`         | `damages`            |
| `detected`           | `damages`            |
| `damages_confirmed`  | `operations`         |
| `operations_defined` | `operations`         |
| `valuated`           | `valuation`          |
| `completed`          | `finalize`           |

## API del Hook

```tsx
const {
  // Estado
  assessmentId: string;
  currentStep: WizardStepKey;
  mode: 'edit' | 'view';
  maxReachableStep: WizardStepKey;
  originStep?: WizardStepKey;

  // Navegación
  canGoTo: (step: WizardStepKey) => boolean;
  goTo: (step: WizardStepKey) => void;
  nextOf: (step: WizardStepKey) => WizardStepKey;
  prevOf: (step: WizardStepKey) => WizardStepKey;
  continueFromHere: () => void;

  // Utilidades
  isReadOnly: (step?: WizardStepKey) => boolean;
} = useWizardStepNav();
```

## Integración en Páginas

### Ejemplo: Página de Daños

```tsx
const Damages = () => {
  const { isReadOnly, continueFromHere } = useReadOnlyMode();

  const handleConfirm = async () => {
    if (isReadOnly) {
      continueFromHere(); // Navega al siguiente paso sin side-effects
      return;
    }

    // Lógica normal de confirmación
    await confirmDamages(selectedDamages);
    navigate('?step=operations');
  };

  return (
    <PageShell>
      {isReadOnly && <ReadOnlyBanner />}
      <div className="damages-grid">
        {damages.map((damage) => (
          <DamageCard
            key={damage.id}
            damage={damage}
            onStatusChange={(id, status) => {
              if (isReadOnly) return; // Bloquear cambios
              // Lógica normal
            }}
          />
        ))}
      </div>
      <footer>
        {!isReadOnly && (
          <>
            <Button onClick={addDamage}>+ Añadir daño</Button>
            <Button onClick={confirmAll}>Confirmar Todos</Button>
          </>
        )}
        <Button onClick={handleConfirm}>Continuar</Button>
      </footer>
    </PageShell>
  );
};
```

## Integración en el Stepper

```tsx
const WizardStepper = ({ currentStep, onStepClick, completedSteps = [] }) => {
  const { canGoTo, goTo } = useWizardStepNav();

  const handleStepClick = (stepKey: WizardStepKey) => {
    if (canGoTo(stepKey)) {
      if (onStepClick) {
        onStepClick(stepKey);
      } else {
        goTo(stepKey);
      }
    }
  };

  return (
    <div className="stepper">
      {STEPS.map((step, index) => {
        const status = getStepStatus(index);
        const isClickable = canGoTo(step.key) && (status === 'completed' || status === 'current');

        return (
          <div
            key={step.key}
            onClick={isClickable ? () => handleStepClick(step.key) : undefined}
            className={isClickable ? 'clickable' : 'disabled'}
          >
            {/* Contenido del step */}
          </div>
        );
      })}
    </div>
  );
};
```

## Flags Futuras

### `allowBackEdit`

```tsx
// En el futuro, permitir edición hacia atrás
<StepperNavigationProvider
  assessmentId={assessmentId}
  workflowStatus={workflowStatus}
  currentStep={currentStep}
  allowBackEdit={true} // Habilitar edición hacia atrás
>
  {children}
</StepperNavigationProvider>
```

Cuando `allowBackEdit=true`:

- `isReadOnly()` devuelve `false` para todos los pasos
- Las páginas vuelven a habilitar inputs y acciones
- Se mantiene la API existente sin cambios

## Tests

### Casos de Prueba Principales

1. **Navegación hacia atrás**: Entrar a `valuation` con status `valuated`, saltar a `intake`, verificar que inputs están `disabled` y `Continuar` te lleva a `damages`.

2. **Bloqueo de pasos futuros**: `canGoTo` bloquea pasos futuros según `workflowStatus`.

3. **Regresión**: Edición normal de `operations` sigue funcionando cuando corresponde.

4. **Deep links**: Cualquier URL `?step=X` respeta el modo (view/edit) según `workflowStatus`.

### Ejecutar Tests

```bash
npm test -- --testPathPattern=StepperNavigationProvider
```

## Archivos Principales

- `src/features/damage-wizard-v2/nav/StepperNavigationProvider.tsx` - Provider principal
- `src/features/damage-wizard-v2/nav/steps.ts` - Lógica de orden y mapeo
- `src/features/damage-wizard-v2/nav/path.ts` - Utilidades de rutas
- `src/features/damage-wizard-v2/nav/types.ts` - Tipos TypeScript
- `src/features/damage-wizard-v2/hooks/useReadOnlyMode.ts` - Hook simplificado
- `src/features/damage-wizard-v2/components/ReadOnlyBanner.tsx` - Banner informativo

## Migración

### Antes

```tsx
// Sin navegación hacia atrás
<WizardStepper currentStep="damages" />
```

### Después

```tsx
// Con navegación controlada
<StepperNavigationProvider
  assessmentId={assessmentId}
  workflowStatus={workflowStatus}
  currentStep={currentStep}
>
  <WizardStepper currentStep="damages" />
</StepperNavigationProvider>
```

## Consideraciones de Performance

- El provider usa `useMemo` y `useCallback` para evitar re-renders innecesarios
- La lógica de navegación es puramente client-side, sin llamadas al backend
- Los componentes en modo solo lectura no ejecutan efectos ni llamadas API
