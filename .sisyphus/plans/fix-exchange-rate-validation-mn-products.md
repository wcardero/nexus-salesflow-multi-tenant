# Plan: Fix Bug - Validación de Tipo de Cambio para Productos en MN

## TL;DR

**Problema**: El sistema no permite crear productos en MN (Moneda Nacional) cuando no hay un tipo de cambio configurado, aunque los productos en MN no dependen del tipo de cambio.

**Causa**: El botón "Agregar Producto" tiene `disabled={!currentExchangeRate}` que bloquea el formulario independientemente de la moneda seleccionada.

**Solución**: Condicionar la validación del tipo de cambio únicamente para productos en USD.

## Contexto

### Archivos Involucrados
- `views/ManagerDashboard.tsx` (frontend)
- Líneas específicas: 968-974 (mensaje de advertencia), 1072 (botón deshabilitado)

### Comportamiento Actual (Bug)
1. Usuario selecciona moneda "MN" en el formulario de producto
2. No existe tipo de cambio configurado para la tienda
3. El botón "Agregar Producto" está deshabilitado (`disabled={!currentExchangeRate}`)
4. Aparece mensaje de advertencia general sobre tipo de cambio
5. **Usuario no puede crear producto en MN** ❌

### Comportamiento Esperado
1. Usuario selecciona moneda "MN" en el formulario de producto
2. No existe tipo de cambio configurado para la tienda
3. El botón "Agregar Producto" debería estar **habilitado** para productos MN
4. Solo productos USD requieren tipo de cambio
5. **Usuario puede crear producto en MN** ✅

## Cambios Requeridos

### Cambio 1: Mensaje de Advertencia (Línea 968-974)
**Ubicación**: `views/ManagerDashboard.tsx` ~ línea 968

**Antes**:
```tsx
{!currentExchangeRate && (
  <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
    <p className="text-warning-800 dark:text-warning-200 text-sm font-medium">
      ⚠️ No hay un tipo de cambio vigente. Configure uno en la pestaña "Tipo de Cambio".
    </p>
  </div>
)}
```

**Después**:
```tsx
{currency === 'USD' && !currentExchangeRate && (
  <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
    <p className="text-warning-800 dark:text-warning-200 text-sm font-medium">
      ⚠️ No hay un tipo de cambio vigente. Configure uno en la pestaña "Tipo de Cambio" para agregar productos en USD.
    </p>
  </div>
)}
```

### Cambio 2: Botón Deshabilitado (Línea 1072)
**Ubicación**: `views/ManagerDashboard.tsx` ~ línea 1072

**Antes**:
```tsx
<button type="submit" disabled={!currentExchangeRate} className="bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md shadow-md transition-all disabled:shadow-none">Agregar Producto</button>
```

**Después**:
```tsx
<button type="submit" disabled={currency === 'USD' && !currentExchangeRate} className="bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md shadow-md transition-all disabled:shadow-none">Agregar Producto</button>
```

## Validación de Lógica Existente

### Validación en handleAdd (líneas 804-807)
El código ya tiene validación correcta en el backend:
```typescript
if (currency === 'USD' && !currentExchangeRate) {
  alert('No hay un tipo de cambio vigente. Por favor, configure un tipo de cambio antes de agregar productos con costo en USD.');
  return;
}
```

**Esta validación está correcta** y debe mantenerse.

## Criterios de Aceptación

- [ ] Manager puede crear productos en MN sin tener tipo de cambio configurado
- [ ] Manager NO puede crear productos en USD sin tipo de cambio configurado
- [ ] El mensaje de advertencia solo aparece cuando:
  - La moneda seleccionada es USD
  - No existe tipo de cambio vigente
- [ ] El botón "Agregar Producto" solo se deshabilita cuando:
  - La moneda seleccionada es USD
  - No existe tipo de cambio vigente
- [ ] Productos en USD siguen requiriendo tipo de cambio (comportamiento existente preservado)

## Impacto en Producción

**Ninguno** - Este es un fix de bug de frontend que solo afecta la UI de creación de productos. No hay cambios en:
- API/backend
- Base de datos
- Flujo de negocio existente
- Configuración de deploy

## Archivos a Modificar

1. `views/ManagerDashboard.tsx` (2 cambios pequeños)

## Estimación

**Tiempo**: 5-10 minutos
**Complejidad**: Baja
**Riesgo**: Mínimo (cambio condicional simple)
