# Tasks: Complete Inventory Approval and Closing Workflow

## 1. Backend - Database Schema Updates

- [ ] 1.1 Crear migración para `AssignedInventory`
  - Agregar columna `status` (TEXT, default: 'Pending')
  - Agregar columna `confirmedAt` (TIMESTAMP, nullable)
  - Agregar columna `rejectionReason` (TEXT, nullable)
- [ ] 1.2 Crear tabla `InventoryConflict`
  - id (TEXT PRIMARY KEY)
  - assignedInventoryId (TEXT, FK)
  - gestorId (TEXT, FK)
  - managerId (TEXT, FK)
  - reason (TEXT)
  - status (TEXT, default: 'Pending')
  - createdAt (TIMESTAMP)
  - resolvedAt (TIMESTAMP, nullable)
- [ ] 1.3 Migrar datos existentes
  - Actualizar `AssignedInventory` existentes a `status = 'Confirmed'`
  - Establecer `confirmedAt` para inventarios históricos

## 2. Backend - Types and Interfaces

- [ ] 2.1 Actualizar `types.ts`
  - Modificar `AssignedInventory`: agregar `status`, `confirmedAt`, `rejectionReason`
  - Agregar tipo `InventoryConflict`
  - Actualizar `MockDB`: agregar `inventoryConflicts`

## 3. Backend - API Endpoints - Inventory Confirmation

- [ ] 3.1 Implementar `POST /api/assigned-inventory/:id/confirm`
  - Validar: Usuario es gestor y asignación le pertenece
  - Actualizar estado a 'Confirmed'
  - Registrar fecha de confirmación
  - Crear audit log
- [ ] 3.2 Implementar `POST /api/assigned-inventory/:id/reject`
  - Validar: Usuario es gestor y asignación le pertenece
  - Validar: `rejectionReason` está presente
  - Actualizar estado a 'Rejected'
  - Crear registro en `InventoryConflict`
  - Crear audit log

## 4. Backend - API Endpoints - Inventory Conflicts

- [ ] 4.1 Implementar `GET /api/inventory-conflicts`
  - Validar: Usuario es manager
  - Retornar conflictos pendientes del manager
  - Incluir información del producto y gestor
- [ ] 4.2 Implementar `POST /api/inventory-conflicts/:id/resolve`
  - Validar: Usuario es manager
  - Soportar acciones: 'reassign' (actualizar cantidad) o 'cancel' (eliminar)
  - Actualizar estado de conflicto a 'Resolved'
  - Si reassign: volver asignación a 'Pending'
  - Si cancel: eliminar asignación
  - Registrar fecha de resolución

## 5. Backend - API Endpoints - Sales Management

- [ ] 5.1 Implementar `POST /api/sales/batch`
  - Validar: Usuario es gestor o manager
  - Validar: Inventario suficiente en `AssignedInventory` (estado 'Confirmed')
  - Crear N registros de venta
  - Reducir cantidad en `AssignedInventory`
  - Crear audit logs
- [ ] 5.2 Implementar `DELETE /api/sales/:id`
  - Validar: Usuario es gestor
  - Validar: Venta pertenece al gestor
  - Validar: Venta NO está incluida en un cierre
  - Eliminar venta
  - Restaurar cantidad en `AssignedInventory` (simplificado)

## 6. Backend - API Endpoints - Closing Completion

- [ ] 6.1 Implementar `PUT /api/closings/:id/complete`
  - Validar: Usuario es manager
  - Validar: Cierre existe y está en estado 'Pending'
  - Actualizar estado a 'Completed'
  - Registrar fecha de finalización `completedAt`

## 7. Frontend - Types Update

- [ ] 7.1 Actualizar `types.ts` con nuevos tipos
  - Modificar `AssignedInventory`: agregar campos nuevos
  - Agregar tipo `InventoryConflict`
  - Actualizar `MockDB`: agregar `inventoryConflicts`

## 8. Frontend - App.tsx Updates

- [ ] 8.1 Actualizar `refreshDb()` en `App.tsx`
  - Agregar 'inventory-conflicts' a lista de recursos
  - Agregar a `MockDB`: `inventoryConflicts`

## 9. Frontend - GestorDashboard - Inventory Confirmation

- [ ] 9.1 Crear componente `PendingInventorySection`
  - Mostrar asignaciones con estado 'Pending'
  - Botón "Aceptar" para confirmar inventario
  - Botón "Rechazar" con modal para razón
  - Validación: Razón es requerida al rechazar
- [ ] 9.2 Crear componente `ConfirmedInventorySection`
  - Mostrar inventario disponible (estado 'Confirmed')
  - Convertir `AssignedInventory` a items individuales
- [ ] 9.3 Integrar en `GestorDashboard`
  - Agregar secciones antes de vista de ventas
  - Llamar endpoints de confirmación/rechazo
  - Refrescar DB después de acciones

## 10. Frontend - GestorDashboard - Batch Sales

- [ ] 10.1 Crear componente `BatchSalesSection`
  - Selector de producto (solo de inventario confirmado)
  - Input de cantidad
  - Validación de inventario suficiente
  - Botón "Registrar Venta"
- [ ] 10.2 Implementar `handleSellBatch`
  - Llamar endpoint `POST /api/sales/batch`
  - Calcular precios usando utilidades existentes
  - Refrescar DB después de venta
  - Mostrar confirmación al usuario

## 11. Frontend - GestorDashboard - Sales Management

- [ ] 11.1 Crear componente `SalesManagementSection`
  - Mostrar ventas pendientes (no incluidas en cierres)
  - Botón "Eliminar" para cada venta
  - Validar: ventas en cierre NO pueden eliminarse
  - Confirmación antes de eliminar
- [ ] 11.2 Implementar `handleDeleteSale`
  - Llamar endpoint `DELETE /api/sales/:id`
  - Refrescar DB después de eliminación
  - Restaurar inventario automáticamente

## 12. Frontend - ManagerDashboard - Inventory Conflicts

- [ ] 12.1 Crear pestaña "Conflicts" en `ManagerDashboard`
  - Agregar 'conflicts' a tipo `Tabs`
- [ ] 12.2 Crear componente `ConflictsView`
  - Mostrar tabla de conflictos pendientes
  - Columnas: Gestor, Producto, Cantidad, Razón
  - Botón "Reasignar": Modal para nueva cantidad
  - Botón "Cancelar": Confirmación de eliminación
- [ ] 12.3 Implementar `handleResolveConflict`
  - Llamar endpoint `POST /api/inventory-conflicts/:id/resolve`
  - Soportar acciones 'reassign' y 'cancel'
  - Refrescar DB después de resolución

## 13. Frontend - ManagerDashboard - Closing Completion

- [ ] 13.1 Actualizar `handleValidateClosing`
  - Cambiar validación de estado: de "recibir dinero" a "confirmar recepción"
  - Llamar endpoint `PUT /api/closings/:id/complete` (backend)
  - Mostrar confirmación antes de completar
- [ ] 13.2 Actualizar UI de Cierres Pendientes
  - Etiqueta clara: "Pendiente de confirmación de pago"
  - Botón: "Confirmar Recepción de Dinero"
  - Mostrar info: gestor, monto a recibir, comisión

## 14. Testing

- [ ] 14.1 Test de flujo de confirmación de inventario
  - Manager asigna inventario → estado 'Pending'
  - Gestor ve asignación pendiente
  - Gestor acepta → estado 'Confirmed', disponible para venta
  - Gestor rechaza → estado 'Rejected', crea conflicto
- [ ] 14.2 Test de gestión de conflictos
  - Manager ve conflicto en pestaña
  - Manager reasigna → vuelve a 'Pending'
  - Manager cancela → asignación eliminada
- [ ] 14.3 Test de ventas en lote
  - Gestor selecciona producto y cantidad
  - Sistema valida inventario suficiente
  - Ventas creadas correctamente
  - Cantidad reducida en `AssignedInventory`
- [ ] 14.4 Test de edición de ventas
  - Gestor elimina venta pendiente
  - Inventario restaurado
  - Ventas en cierre NO pueden eliminarse
- [ ] 14.5 Test de confirmación de pago
  - Gestor ejecuta cierre
  - Manager ve cierre pendiente
  - Manager confirma recepción de dinero
  - Estado cambia a 'Completed'

## 15. Documentation Updates

- [ ] 15.1 Actualizar `README.md`
  - Agregar sección "Confirmación de Inventario"
  - Agregar sección "Conflictos de Inventario"
  - Actualizar sección "Flujo de Cierre Detallado"
  - Actualizar sección "GESTOR" responsabilidades
- [ ] 15.2 Actualizar `openspec/changes/add-inventory-approval-flow/specs/inventory/spec.md`
  - Agregar requisitos de confirmación y conflictos
  - Agregar escenarios completos
- [ ] 15.3 Crear `openspec/changes/add-inventory-approval-flow/specs/manager/spec.md`
  - Agregar requisitos de gestión de conflictos
  - Agregar requisitos de confirmación de cierres
- [ ] 15.4 Crear `openspec/changes/add-inventory-approval-flow/specs/gestor/spec.md`
  - Agregar requisitos de ventas en lote
  - Agregar requisitos de edición de ventas
  - Agregar requisitos de confirmación de inventario

## 16. Migration and Deployment

- [ ] 16.1 Preparar scripts SQL para migración
  - Script para modificar `AssignedInventory`
  - Script para crear `InventoryConflict`
  - Script para migrar datos existentes
- [ ] 16.2 Verificar migración en desarrollo
  - Ejecutar scripts en DB de desarrollo
  - Verificar integridad de datos
  - Probar flujo completo con datos migrados
- [ ] 16.3 Planificar deployment a producción
  - Backup de DB antes de migración
  - Ejecutar migración durante ventana de mantenimiento
  - Verificar funcionalidad post-migración
