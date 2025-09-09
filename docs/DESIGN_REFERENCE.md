# Referencia de Diseño - MotorMind

## Información del Repositorio de Diseño

- **URL**: motormind-design (repositorio local en workspace)
- **Rama**: main  
- **Ruta local**: `../motormind-design`
- **Propósito**: **SOLO REFERENCIA VISUAL** para garantizar paridad 1:1 del CSS

## ⚠️ REGLAS CRÍTICAS

### ❌ PROHIBIDO
- **NO** importar componentes desde `../motormind-design/**`
- **NO** copiar código tal cual
- **NO** incluir el repo de diseño en el bundle/build
- **NO** usar como dependencia de runtime

### ✅ PERMITIDO
- Consultar estilos y patrones visuales
- Extraer detalles de CSS (espaciados, colores, tipografía)
- Usar como referencia para medidas y breakpoints
- Inspirarse en la estructura de componentes

## Metodología de Trabajo

### 1. Antes de implementar cualquier pantalla:
1. **Buscar** en `../motormind-design/src/components/` el componente análogo
2. **Extraer** detalles de estilo: espaciados, fuentes, tamaños, radios, sombras, estados
3. **Replicar** usando NUESTRO design system y componentes

### 2. Script de búsqueda:
```bash
npm run design:grep "<término_búsqueda>" ../motormind-design/
```

## Mapeo de Tokens (Diseño → Nuestro Sistema)

### Colores Base
| Diseño Token | Nuestro Token | Valor HSL | Uso |
|-------------|---------------|-----------|-----|
| `bg-card` | `bg-card` | `hsl(0 0% 100%)` | Fondos de cards/papers |
| `border-border` | `border-border` | `hsl(215 12% 88%)` | Bordes sutiles |
| `bg-background` | `bg-background` | `hsl(210 20% 98%)` | Fondo general de página |

### Estados de WizardStepper
| Estado | Diseño Token | Nuestro Token | Valor HSL |
|--------|-------------|---------------|-----------|
| **Current** | `bg-primary` | `bg-primary` | `hsl(219 70% 58%)` |
| | `text-primary` | `text-primary` | `hsl(219 70% 58%)` |
| | `bg-primary-muted/20` | `bg-primary-muted/20` | `hsl(219 25% 85%)` @ 20% |
| **Completed** | `bg-success` | `bg-success` | `hsl(158 64% 52%)` |
| | `text-success` | `text-success` | `hsl(158 64% 52%)` |
| | `bg-success-muted/20` | `bg-success-muted/20` | `hsl(158 30% 85%)` @ 20% |
| **Upcoming** | `bg-muted` | `bg-muted` | `hsl(215 16% 95%)` |
| | `text-muted-foreground` | `text-muted-foreground` | `hsl(215 15% 45%)` |

### Tipografía
| Diseño | Nuestro Token | Uso WizardStepper |
|--------|--------------|-------------------|
| `text-sm font-medium` | `text-sm font-medium` | Labels de pasos |
| `text-xs` | `text-xs` | Descripciones de pasos |
| `text-sm font-semibold` | `text-sm font-semibold` | Números en círculos |

### Espaciado WizardStepper
| Elemento | Diseño | Nuestro Token | Valor |
|----------|--------|--------------|-------|
| Container | `p-4` | `p-4` | 16px |
| Step content | `gap-3 p-3` | `gap-3 p-3` | 12px gap, 12px padding |
| Icon size | `w-8 h-8` | `w-8 h-8` | 32px × 32px |
| Max width | `max-w-7xl` | `max-w-7xl` | 80rem |
| Arrow spacing | `mx-2` | `mx-2` | 8px horizontal |

### Bordes y Formas
| Elemento | Diseño | Nuestro Token | Valor |
|----------|--------|--------------|-------|
| Step container | `rounded-lg` | `rounded-lg` | `var(--radius)` (0.5rem) |
| Step icon | `rounded-full` | `rounded-full` | 50% |
| Card border | `border-b` | `border-b` | 1px bottom |

### Transiciones
| Propiedad | Valor | Uso |
|-----------|-------|-----|
| `transition-colors` | default | Cambios de color en hover/focus |
| `hover:bg-muted/50` | 50% opacity | Estado hover clickeable |

## Componentes Clave del Wizard v2

### 1. WizardStepper
- **Referencia**: `../motormind-design/src/components/wizard/WizardStepper.tsx`
- **Estados**: inactivo/activo/completado
- **Estilos clave**: círculos numerados, líneas conectoras, subtítulos

### 2. PageShell + SectionPaper  
- **Referencia**: Layout en `../motormind-design/src/components/wizard/DamageAssessmentWizard.tsx`
- **Características**: fondo gris, papers blancos, max-width, paddings consistentes

### 3. DamageCard
- **Referencia**: `../motormind-design/src/components/DamageCard.tsx`
- **Elementos**: imagen cover, badge confianza, severidad, selección con borde verde

### 4. DragZone
- **Referencia**: Implementación en IntakeStep
- **Estados**: hover/drag/error, borde punteado, iconografía centrada

## Checklist de Paridad Visual

Ver `STYLE_PARITY_CHECKLIST.md` para la lista completa de verificación por componente.

## Automatizaciones

### ESLint
- Regla `no-restricted-imports` configurada para bloquear imports de `../motormind-design/**`
- Error message: "Imports from design reference repo are prohibited. Use it only as visual reference."

### Build/Bundle
- Vite excluye `../motormind-design/**` del bundle
- TypeScript excluye el directorio de compilación

### Scripts
- `npm run design:grep "<término>"` para buscar en el repo de diseño

## Responsabilidades del Desarrollador

1. **SIEMPRE consultar** el repo de diseño antes de implementar
2. **Documentar** cualquier diferencia encontrada
3. **Mapear** nuevos tokens si es necesario (extender tema, no hardcodear)
4. **Mantener** paridad visual ≤ 2px de diferencia
5. **Verificar** que no hay imports accidentales del repo de diseño

---

**Recuerda**: Este repositorio es SOLO para referencia visual. Usa nuestros componentes y sistema de diseño para implementar.
