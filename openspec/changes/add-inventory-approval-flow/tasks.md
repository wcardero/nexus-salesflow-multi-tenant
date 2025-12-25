## 1. Implementación

- [ ] 1.1 Actualizar tipos: Agregar campo `status` a `AssignedInventory` con valores 'PendingApproval', 'Approved', 'Rejected'
- [ ] 1.2 Crear enum `InventoryAssignmentStatus` para estados de asignación
- [ ] 1.3 Actualizar endpoint POST `/api/assigned-inventory` para crear asignaciones con estado 'PendingApproval'
- [ ] 1.4 Crear endpoint PATCH `/api/assigned-inventory/:id/status` para cambiar estado de asignación
- [ ] 1.5 Agregar vista "Inventario Pendiente de Aprobación" en GestorDashboard
- [ ] 1.6 Agregar botones "Aceptar" y "Rechazar" para cada asignación pendiente
- [ ] 1.7 Al aceptar: crear `InventoryItem` correspondientes en inventario del gestor
- [ ] 1.8 Al rechazar: mantener asignación con estado 'Rejected' pero no crear ítems
- [ ] 1.9 Actualizar vista de inventario asignado en ManagerDashboard para mostrar estado
- [ ] 1.10 Agregar registro de auditoría para aprobaciones/rechazos de inventario
- [ ] 1.11 Actualizar README.md con nueva funcionalidad

## 2. Testing

- [ ] 2.1 Verificar que el manager puede asignar inventario con estado pendiente
- [ ] 2.2 Verificar que el gestor ve asignaciones pendientes en su dashboard
- [ ] 2.3 Verificar que al aceptar se crean ítems en inventario disponible
- [ ] 2.4 Verificar que al rechazar no se crean ítems pero se mantiene registro
- [ ] 2.5 Verificar que el manager puede ver el estado de cada asignación
