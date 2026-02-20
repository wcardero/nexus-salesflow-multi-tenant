# Plan: Add Loading State to Action Buttons

## TL;DR

**Problema**: Varios botones de acción no tienen estado de loading, permitiendo múltiples clics y sin feedback visual durante operaciones asíncronas.

**Solución**: Agregar estado `isLoading` a los botones de acción principales para:
- Deshabilitar el botón durante la operación
- Mostrar indicador visual de carga
- Prevenir doble-clic accidental

## Contexto

### Botones Identificados sin Loading State

1. **"Actualizar Tipo de Cambio"** - `ManagerDashboard.tsx:517`
   - Componente: `ExchangeRateView`
   - Handler: `handleSetExchangeRate`
   - **PRIORIDAD: ALTA** (mencionado explícitamente por usuario)

2. **"Agregar Producto"** - `ManagerDashboard.tsx:1072`
   - Handler: `handleAdd`
   - Ya tiene validación condicional pero falta loading state

3. **"Guardar Cambios"** (Editar Producto) - `ManagerDashboard.tsx:1041`
   - Handler: `handleUpdate`

4. **"Actualizar Stock"** - `ManagerDashboard.tsx:1312`
   - Handler: handleAddStock

5. **Botones en `StoreManagement.tsx`**
   - "Crear Tienda" - línea 143
   - "Actualizar Tienda" - línea 165

6. **Botones en `DirectorDashboard.tsx`**
   - "Crear Manager" - línea 489
   - "Actualizar Manager" - línea 523

### Botones que YA tienen loading (referencia)
- `GestorDashboard.tsx:506` - handleExecuteClosing (isExecutingClosing)
- `ManagerDashboard.tsx:737` - isAddingGestor
- `ManagerDashboard.tsx:1472` - isAssigning
- `AdminDashboard.tsx` - isCreatingStore, isCreatingDirector, isCreatingManager
- `Login.tsx` - loading state

## Implementación

### Patrón a Seguir

```typescript
// 1. Agregar estado
const [isLoading, setIsLoading] = useState(false);

// 2. Modificar handler
const handleAction = async () => {
  setIsLoading(true);
  try {
    // ... lógica existente ...
  } catch (error) {
    // ... manejo de error ...
  } finally {
    setIsLoading(false);
  }
};

// 3. Aplicar al botón
<button 
  type="submit" 
  disabled={isLoading}
  className="..."
>
  {isLoading ? 'Cargando...' : 'Texto Original'}
</button>
```

### Cambio 1: Actualizar Tipo de Cambio (PRIORIDAD ALTA)

**Archivo**: `views/ManagerDashboard.tsx`
**Ubicación**: Componente ExchangeRateView (línea ~475)

```typescript
const ExchangeRateView: React.FC<...> = ({ store, onSetExchangeRate }) => {
  const [newRate, setNewRate] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(...);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false); // NUEVO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Por favor, introduce un tipo de cambio válido y positivo.');
      return;
    }
    
    setIsUpdatingRate(true); // NUEVO
    try {
      await onSetExchangeRate(rate, new Date(effectiveDate));
      setNewRate('');
    } finally {
      setIsUpdatingRate(false); // NUEVO
    }
  };

  // ...
  
  <button 
    type="submit" 
    disabled={isUpdatingRate} // MODIFICADO
    className="..."
  >
    {isUpdatingRate ? 'Actualizando...' : 'Actualizar Tipo de Cambio'} // MODIFICADO
  </button>
```

### Cambio 2: Agregar Producto

**Archivo**: `views/ManagerDashboard.tsx`
**Ubicación**: Línea ~1072, dentro de ProductsView

```typescript
const [isAddingProduct, setIsAddingProduct] = useState(false); // NUEVO

const handleAdd = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim() || !cost || !margin) return;
  if (currency === 'USD' && !currentExchangeRate) {
    alert('...');
    return;
  }
  
  setIsAddingProduct(true); // NUEVO
  try {
    // ... lógica existente ...
    await fetch(...);
    alert('Producto creado exitosamente.');
    setName(''); setCost(''); setMargin(''); setCommission('');
    await refreshDb();
  } catch (error: any) {
    console.error('Error creating product:', error);
    alert(`Error al crear el producto: ${error.message}`);
  } finally {
    setIsAddingProduct(false); // NUEVO
  }
};

// Botón:
<button 
  type="submit" 
  disabled={(currency === 'USD' && !currentExchangeRate) || isAddingProduct} // MODIFICADO
  className="..."
>
  {isAddingProduct ? 'Agregando...' : 'Agregar Producto'} // MODIFICADO
</button>
```

### Cambio 3: Guardar Cambios (Editar Producto)

**Archivo**: `views/ManagerDashboard.tsx`
**Ubicación**: Línea ~1041

Similar al patrón anterior con `isUpdatingProduct`.

### Cambio 4-6: Otros botones (opcional según prioridad)

- StoreManagement.tsx: handleCreateStore, handleUpdateStore
- DirectorDashboard.tsx: handleCreateManager, handleUpdateManager

## Criterios de Aceptación

- [ ] Botón "Actualizar Tipo de Cambio" muestra loading y se deshabilita durante operación
- [ ] Botón "Agregar Producto" muestra loading y se deshabilita durante operación
- [ ] Botón "Guardar Cambios" (editar) muestra loading y se deshabilita
- [ ] No se pueden hacer múltiples clics accidentales mientras carga
- [ ] Mensaje visual claro indica que está procesando
- [ ] En caso de error, el botón vuelve a estado normal (no queda bloqueado)

## Archivos a Modificar

1. `views/ManagerDashboard.tsx` (3-4 botones)
2. `views/StoreManagement.tsx` (2 botones) - OPCIONAL
3. `views/DirectorDashboard.tsx` (2 botones) - OPCIONAL

## Estimación

**Tiempo**: 15-20 minutos
**Complejidad**: Baja-Media
**Riesgo**: Bajo (patrón repetitivo, ya existe en otros botones)

## Impacto en Producción

**Ninguno** - Solo cambios de UX/UI en frontend, no afecta lógica de negocio ni API.
