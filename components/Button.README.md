# Componente Button

Componente reutilizable de botón con estilos consistentes en toda la aplicación.

## Características

- ✅ **5 variantes**: primary, success, danger, warning, neutral
- ✅ **5 tamaños**: xs, sm, md, lg, xl
- ✅ **Modo oscuro**: Estados hover correctos (aclaran en modo oscuro, no oscurecen)
- ✅ **Estado disabled**: Estilo deshabilitado consistente
- ✅ **Loading state**: Spinner animado incluido
- ✅ **Iconos**: Soporte para iconos antes del texto
- ✅ **Full width**: Opción para botones de ancho completo

## Uso

### Básico
```tsx
import Button from '../components/Button';

<Button onClick={handleClick}>
  Guardar
</Button>
```

### Con variante
```tsx
<Button variant="success" onClick={handleClick}>
  Confirmar
</Button>

<Button variant="danger" onClick={handleDelete}>
  Eliminar
</Button>

<Button variant="warning" onClick={handleCancel}>
  Cancelar
</Button>
```

### Con tamaño
```tsx
<Button size="lg" onClick={handleClick}>
  Botón Grande
</Button>

<Button size="xs" onClick={handleClick}>
  Mini
</Button>
```

### Loading state
```tsx
<Button variant="primary" isLoading={loading} onClick={handleClick}>
  {loading ? 'Procesando...' : 'Guardar'}
</Button>
```

### Full width
```tsx
<Button variant="primary" fullWidth onClick={handleClick}>
  Botón de Ancho Completo
</Button>
```

### Con icono
```tsx
<Button variant="primary" icon={<span>📄</span>} onClick={handleClick}>
  Exportar
</Button>
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|-------|---------|-------------|
| `variant` | `ButtonVariant` | `'primary'` | Estilo visual del botón |
| `size` | `ButtonSize` | `'md'` | Tamaño del botón |
| `fullWidth` | `boolean` | `false` | Botón de ancho completo |
| `isLoading` | `boolean` | `false` | Mostrar estado de carga |
| `icon` | `ReactNode` | `undefined` | Icono antes del texto |
| `disabled` | `boolean` | `undefined` | Deshabilitar botón |
| `className` | `string` | `''` | Clases CSS adicionales |
| `...props` | `ButtonHTMLAttributes` | - | Props nativas de `<button>` |

## Variantes

| Variante | Claro | Oscuro | Uso |
|----------|--------|---------|-----|
| `primary` | Azul (#2563eb) | Azul (#2563eb) | Acción principal |
| `success` | Verde (#10b981) | Verde (#10b981) | Confirmar/Éxito |
| `danger` | Rojo (#ef4444) | Rojo (#ef4444) | Eliminar/Danger |
| `warning` | Amarillo (#f59e0b) | Amarillo (#f59e0b) | Cancelar/Advertencia |
| `neutral` | Gris (#e2e8f0) | Gris (#334155) | Secundario/Neutral |

## Tamaños

| Tamaño | Padding | Font Size | Border Radius |
|---------|----------|------------|---------------|
| `xs` | py-1 px-2 | text-xs | rounded-md |
| `sm` | py-1.5 px-3 | text-xs | rounded-md |
| `md` | py-2 px-4 | text-sm | rounded-md |
| `lg` | py-2.5 px-6 | text-lg | rounded-lg |
| `xl` | py-3 px-8 | text-xl | rounded-xl |

## Estados Hover

### Modo Claro
- `primary`: `#2563eb` → `#1d4ed8` (oscurece)
- `success`: `#10b981` → `#059669` (oscurece)
- `danger`: `#ef4444` → `#dc2626` (oscurece)
- `warning`: `#f59e0b` → `#d97706` (oscurece)
- `neutral`: `#e2e8f0` → `#cbd5e1` (oscurece)

### Modo Oscuro
- `primary`: `#2563eb` → `#3b82f6` (aclara)
- `success`: `#059669` → `#10b981` (aclara)
- `danger`: `##dc2626` → `#ef4444` (aclara)
- `warning`: `#d97706` → `#f59e0b` (aclara)
- `neutral`: `#334155` → `#475569` (aclara)

## Estado Disabled

**Ambos modos:**
- `bg-slate-400` (gris claro)
- `cursor-not-allowed` (cursor prohibido)
- `opacity-50` (50% opacidad)
- `shadow-none` (sin sombra)

## Migración desde botones antiguos

### ❌ Antes
```tsx
<button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-all shadow-md">
  Guardar
</button>
```

### ✅ Después
```tsx
<Button variant="primary" onClick={handleClick}>
  Guardar
</Button>
```

## Notas

- El componente maneja automáticamente los estados hover para ambos modos
- El estado `disabled` deshabilita el botón y aplica el estilo correcto
- El estado `isLoading` muestra un spinner y deshabilita el botón
- Los iconos se renderizan antes del texto con un gap de 8px
- El componente es completamente type-safe con TypeScript
