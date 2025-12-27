# Change: Complete Inventory Approval and Closing Workflow

## Why
Actualmente, el flujo de inventario y cierres tiene varias limitaciones:
1. Los gestores no pueden verificar ni confirmar el inventario asignado
2. No existe manejo de conflictos cuando un gestor rechaza inventario
3. Las ventas se registran una por una en lugar de en lote
4. Los gestores no pueden corregir ventas antes del cierre
5. Los managers no pueden confirmar la recepción de dinero en los cierres

Esto causa discrepancias entre inventario digital y físico, ineficiencias en el registro de ventas, y falta de transparencia en el flujo de dinero.

## What Changes

### ADDED: Confirmación de Inventario por Gestor
- Estado de aprobación en `AssignedInventory`: `Pending`, `Confirmed`, `Rejected`
- Vista de "Inventario Pendiente de Confirmación" en GestorDashboard
- Funcionalidad para aceptar/rechazar asignaciones de inventario
- El inventario solo está disponible para venta cuando está confirmado

### ADDED: Conflictos de Inventario
- Nuevo tipo `InventoryConflict` para manejar rechazos
- Tabla `InventoryConflict` para registrar discrepancias
- Vista de "Conflictos de Inventario" en ManagerDashboard
- Capacidad para reasignar o cancelar inventario rechazado

### ADDED: Ventas en Lote
- Endpoint POST `/api/sales/batch` para registrar múltiples ventas de una vez
- Interaz para seleccionar producto y cantidad
- Validación de inventario suficiente
- Reducción automática de cantidad en `AssignedInventory`

### ADDED: Edición de Ventas
- Endpoint DELETE `/api/sales/:id` para eliminar ventas pendientes
- Validación: no se pueden editar ventas ya incluidas en un cierre
- Restauración de inventario al eliminar ventas

### ADDED: Confirmación de Pago de Cierres
- Endpoint PUT `/api/closings/:id/complete` para marcar cierres como completados
- Actualización de estado de `Pending` a `Completed`
- Registro de fecha de finalización `completedAt`

### MODIFIED: GestorDashboard
- Agregada sección de inventario pendiente de confirmación
- Agregada interfaz para ventas en lote
- Agregada sección de gestión de ventas pendientes
- Filtro de inventario: solo muestra items de `AssignedInventory` confirmados

### MODIFIED: ManagerDashboard
- Agregada pestaña "Conflicts" para gestión de conflictos de inventario
- Actualizada lógica de validación de cierres para confirmar recepción de dinero
- Notificaciones visuales de conflictos y cierres pendientes

### MODIFIED: Backend Endpoints
- Actualizado `/api/assigned-inventory` para crear con estado `Pending` por defecto
- Agregado `POST /api/assigned-inventory/:id/confirm`
- Agregado `POST /api/assigned-inventory/:id/reject`
- Agregado `GET /api/inventory-conflicts`
- Agregado `POST /api/inventory-conflicts/:id/resolve`
- Agregado `POST /api/sales/batch`
- Agregado `DELETE /api/sales/:id`
- Agregado `PUT /api/closings/:id/complete`

### MODIFIED: Database Schema
- Columnas agregadas a `AssignedInventory`: `status`, `confirmedAt`, `rejectionReason`
- Nueva tabla `InventoryConflict`
- Actualizado `Closing` con mejor manejo de `completedAt`

## Impact

### Affected Specs
- **inventory**: Nuevos requisitos para aprobación y conflictos
- **manager**: Nuevos requisitos para gestión de conflictos y confirmación de cierres
- **gestor**: Nuevo spec para gestión de inventario y ventas

### Affected Code
- `types.ts`: Tipos nuevos (`InventoryConflict`) y actualizados (`AssignedInventory`, `MockDB`)
- `views/GestorDashboard.tsx`: Secciones de confirmación, ventas en lote, gestión de ventas
- `views/ManagerDashboard.tsx`: Pestaña de conflictos, validación de cierres
- `backend/src/index.ts`: Múltiples endpoints nuevos
- `App.tsx`: Agregado `inventory-conflicts` a refreshDb

### Breaking Changes
**NONE** - Todos los cambios son aditivos o modificaciones compatibles hacia atrás.

### Migration Notes
- Ejecutar scripts SQL para modificar tabla `AssignedInventory` y crear tabla `InventoryConflict`
- Los inventarios existentes migrarán a estado `Confirmed` automáticamente
- Los cierres existentes mantienen su estado actual

## Testing Requirements
- Verificar flujo completo: Asignación → Confirmación → Venta → Cierre → Confirmación de pago
- Verificar manejo de conflictos: Rechazo → Notificación → Resolución
- Verificar validaciones: No vender sin inventario, no editar ventas en cierre
- Verificar permisos: Gestores solo pueden gestionar su propio inventario
