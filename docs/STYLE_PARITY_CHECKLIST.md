# Checklist de Paridad Visual - Wizard v2

## Uso de este Checklist

Usa este checklist en cada PR que implemente o modifique componentes del wizard v2. Marca cada ítem como verificado contra el prototipo del repo de diseño.

## Fundaciones

### ✅ Tipografía
- [ ] **Familia de fuente** coincide (sistema/custom)
- [ ] **Pesos** correctos (normal, medium, semibold, bold)
- [ ] **Tamaños** de escala idénticos (sm, base, lg, xl, 2xl, etc.)
- [ ] **Interlineado** (leading) apropiado por tamaño
- [ ] **Letter spacing** si aplica

### ✅ Espaciado
- [ ] **Padding interno** de componentes (≤ 2px diferencia)
- [ ] **Margin/gap** entre elementos (≤ 2px diferencia)
- [ ] **Grid/stack** spacing consistente
- [ ] **Max-width** de contenedores
- [ ] **Aspect ratios** de imágenes/cards

### ✅ Color
- [ ] **Fondos** principales (page, cards, sections)
- [ ] **Texto** (primario, secundario, deshabilitado)
- [ ] **Bordes** (sutil, prominente, interactivo)
- [ ] **Estados hover** (todos los interactivos)
- [ ] **Estados active/pressed** 
- [ ] **Estados disabled/loading**
- [ ] **Estados focus** (outline, ring)

### ✅ Bordes y Formas
- [ ] **Border radius** por tipo de componente
- [ ] **Border width** apropiado
- [ ] **Grosor de líneas** (separadores, iconos)

### ✅ Sombras
- [ ] **Cards básicos** (shadow-sm)
- [ ] **Modales/overlays** (shadow-lg)
- [ ] **Dropdowns/popovers** (shadow-md)
- [ ] **Estados elevados** (hover con shadow)

## Componentes Específicos

### ✅ WizardStepper
- [ ] **Círculos numerados**: tamaño, color, tipografía
- [ ] **Líneas conectoras**: grosor, color, estado
- [ ] **Labels**: tipografía, espaciado
- [ ] **Subtítulos**: color, tamaño
- [ ] **Estados**: inactivo/activo/completado
- [ ] **Responsivo**: comportamiento en mobile

### ✅ PageShell/Layout
- [ ] **Fondo general**: color exacto
- [ ] **Max-width**: contenedor principal
- [ ] **Padding lateral**: desktop/mobile
- [ ] **Gaps verticales**: entre secciones

### ✅ SectionPaper/Cards
- [ ] **Fondo**: blanco/color exacto
- [ ] **Bordes**: radio, color, grosor
- [ ] **Sombra**: nivel apropiado
- [ ] **Padding interno**: todos los lados
- [ ] **Separación**: entre papers

### ✅ DragZone
- [ ] **Estado normal**: borde punteado, color
- [ ] **Estado hover**: cambio de color/grosor
- [ ] **Estado drag-over**: feedback visual
- [ ] **Estado error**: color de error
- [ ] **Iconografía**: tamaño, posición, color
- [ ] **Texto**: tipografía, jerarquía

### ✅ DamageCard
- [ ] **Imagen**: aspect ratio, object-fit
- [ ] **Badge confianza**: posición, estilo, colores
- [ ] **Severidad**: indicador visual correcto
- [ ] **Selección**: borde verde, check overlay
- [ ] **Estados hover**: feedback apropiado
- [ ] **Grid responsive**: columns, gaps

### ✅ ProgressCard
- [ ] **Barra progreso**: altura, color, radio
- [ ] **Texto estado**: tipografía, color
- [ ] **Iconografía**: si tiene, tamaño/posición
- [ ] **Padding**: interno del card

### ✅ Forms y Inputs
- [ ] **Input fields**: altura, padding, bordes
- [ ] **Labels**: tipografía, espaciado superior
- [ ] **Placeholders**: color, estilo
- [ ] **Estados focus**: ring/outline
- [ ] **Estados error**: color, mensaje
- [ ] **Grupos**: spacing entre campos

### ✅ Buttons
- [ ] **Primary**: colores, padding, radio
- [ ] **Secondary**: estilo outline/ghost
- [ ] **Estados hover/active**: feedback
- [ ] **Estados disabled**: estilo apropiado
- [ ] **Iconos**: si los tiene, spacing

### ✅ Dropdowns/Selects
- [ ] **Trigger**: estilo, chevron, padding
- [ ] **Content**: sombra, bordes, radio
- [ ] **Items**: padding, hover states
- [ ] **Scrollbar**: si aplica, estilo

### ✅ Tables
- [ ] **Headers**: background, tipografía, padding
- [ ] **Rows**: altura, padding lateral
- [ ] **Zebra striping**: si aplica, color sutil
- [ ] **Bordes**: entre filas/columns
- [ ] **Estados hover**: color de fila

### ✅ Badges/Tags
- [ ] **Colores por tipo**: éxito, warning, error
- [ ] **Tamaño**: padding, tipografía
- [ ] **Bordes**: radio apropiado

## Responsive Design

### ✅ Breakpoints
- [ ] **Mobile** (< 640px): layout apilado
- [ ] **Tablet** (640px - 1024px): adaptación
- [ ] **Desktop** (> 1024px): layout completo

### ✅ Comportamientos
- [ ] **Navigation**: menú mobile vs desktop
- [ ] **Grid**: columnas responsive
- [ ] **Spacing**: ajustes por breakpoint
- [ ] **Typography**: escalas responsive

## Interacciones y Estados

### ✅ Loading States
- [ ] **Spinners**: tamaño, color, posición
- [ ] **Skeleton**: si aplica, forma y animación
- [ ] **Texto loading**: feedback apropiado

### ✅ Empty States
- [ ] **Iconografía**: tamaño, color
- [ ] **Mensajes**: tipografía, jerarquía
- [ ] **Call-to-action**: si aplica, estilo

### ✅ Error States
- [ ] **Colores**: red variants apropiados
- [ ] **Iconografía**: error icons
- [ ] **Mensajes**: legibilidad, contraste

## Accesibilidad

### ✅ Focus Management
- [ ] **Focus visible**: ring/outline claro
- [ ] **Orden de tab**: lógico y natural
- [ ] **Focus trap**: en modales si aplica

### ✅ Contraste
- [ ] **Texto sobre fondo**: ratio ≥ 4.5:1
- [ ] **Elementos interactivos**: suficiente contraste
- [ ] **Estados disabled**: identificables pero sutiles

### ✅ ARIA
- [ ] **Labels**: descriptivos para screen readers
- [ ] **States**: aria-expanded, aria-selected, etc.
- [ ] **Live regions**: para cambios dinámicos

## Verificación Final

### ✅ Consistencia
- [ ] **Patrones**: repetidos correctamente
- [ ] **Nomenclatura**: clases CSS consistentes
- [ ] **Tokens**: usados en lugar de valores hardcoded

### ✅ Performance
- [ ] **Sin CSS bloqueante**: styles críticos inline
- [ ] **Imágenes optimizadas**: tamaños apropiados
- [ ] **Animaciones suaves**: 60fps en interactions

### ✅ Cross-browser
- [ ] **Chrome**: renderizado correcto
- [ ] **Firefox**: sin diferencias significativas
- [ ] **Safari**: compatibilidad completa

---

## Template de PR Review

```markdown
## Paridad Visual Verificada

### Componentes modificados:
- [ ] ComponenteName: ✅ Paridad verificada contra repo de diseño

### Consulta al repo de diseño realizada:
- **Archivos consultados**: `../motormind-design/src/components/...`
- **Estilos extraídos**: [describir brevemente]
- **Tokens nuevos**: [si se agregaron al tema]

### Screenshots comparativos:
- [Adjuntar antes/después si es refactor]
- [Adjuntar prototipo vs implementación]

### Verificación de responsivo:
- [ ] Mobile (375px)
- [ ] Tablet (768px) 
- [ ] Desktop (1440px)
```
