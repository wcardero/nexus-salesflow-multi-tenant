## ADDED Requirements

### Requirement: Inventory Assignment Status
El sistema SHALL mantener un estado de aprobación para cada asignación de inventario a gestores, que indique si el gestor ha revisado y aceptado el inventario asignado.

#### Scenario: Manager assigns inventory with pending status
- **WHEN** un manager asigna inventario a un gestor
- **THEN** la asignación se crea con estado `Pending`
- **AND** el inventario NO está disponible para venta aún
- **AND** se registra un evento de auditoría con la acción `ASSIGN_INVENTORY`

#### Scenario: Gestor views pending assignments
- **WHEN** un gestor accede a su dashboard
- **THEN** puede ver todas las asignaciones de inventario con estado `Pending`
- **AND** cada asignación muestra producto, cantidad y fecha de asignación

### Requirement: Inventory Confirmation by Gestor
El sistema SHALL permitir que los gestores aprueben o rechacen las asignaciones de inventario que reciben.

#### Scenario: Gestor approves pending assignment
- **WHEN** un gestor aprueba una asignación de inventario pendiente
- **THEN** el estado de la asignación cambia a `Confirmed`
- **AND** se registra la fecha de confirmación en `confirmedAt`
- **AND** el inventario está disponible para venta
- **AND** se crea un evento de auditoría con la acción `CONFIRM_INVENTORY`

#### Scenario: Gestor rejects pending assignment
- **WHEN** un gestor rechaza una asignación de inventario pendiente
- **AND** proporciona una razón para el rechazo
- **THEN** el estado de la asignación cambia a `Rejected`
- **AND** se registra la razón del rechazo en `rejectionReason`
- **AND** NO se crean ítems de inventario disponibles para venta
- **AND** se crea un registro en `InventoryConflict`
- **AND** se crea un evento de auditoría con la acción `REJECT_INVENTORY`

#### Scenario: Gestor cannot modify confirmed assignment
- **WHEN** un gestor intenta modificar una asignación ya confirmada
- **THEN** el sistema muestra un mensaje de error
- **AND** la asignación no cambia

### Requirement: Inventory Conflict Management
El sistema SHALL permitir que los managers resuelvan conflictos de inventario cuando un gestor rechaza una asignación.

#### Scenario: Manager views inventory conflicts
- **WHEN** un manager accede a la vista de conflictos
- **THEN** puede ver todos los conflictos con estado `Pending`
- **AND** cada conflicto muestra gestor, producto, cantidad y razón del rechazo

#### Scenario: Manager reassigns rejected inventory
- **WHEN** un manager reasigna un conflicto con una nueva cantidad
- **THEN** se actualiza la cantidad del `AssignedInventory`
- **AND** el estado de la asignación vuelve a `Pending`
- **AND** el estado del conflicto cambia a `Resolved`
- **AND** se registra la fecha de resolución en `resolvedAt`
- **AND** se crea un evento de auditoría

#### Scenario: Manager cancels rejected inventory
- **WHEN** un manager cancela un conflicto
- **THEN** se elimina el registro de `AssignedInventory`
- **AND** el estado del conflicto cambia a `Resolved`
- **AND** se registra la fecha de resolución en `resolvedAt`
- **AND** se crea un evento de auditoría

### Requirement: Batch Sales Registration
El sistema SHALL permitir que los gestores registren ventas en lote para mejorar la eficiencia.

#### Scenario: Gestor registers batch sales
- **WHEN** un gestor selecciona un producto y una cantidad
- **AND** hay inventario suficiente en `AssignedInventory` con estado `Confirmed`
- **THEN** el sistema crea múltiples registros de venta
- **AND** reduce la cantidad en `AssignedInventory`
- **AND** cada venta tiene un ID único
- **AND** se crea un evento de auditoría

#### Scenario: Batch sales validation
- **WHEN** un gestor intenta vender más cantidad que inventario disponible
- **THEN** el sistema muestra un error de inventario insuficiente
- **AND** NO se crea ninguna venta

### Requirement: Sales Editing Before Closing
El sistema SHALL permitir que los gestores eliminen ventas que no han sido incluidas en un cierre.

#### Scenario: Gestor deletes pending sale
- **WHEN** un gestor elimina una venta
- **AND** la venta NO está incluida en ningún cierre
- **THEN** la venta se elimina del sistema
- **AND** la cantidad se restaura en `AssignedInventory`
- **AND** se crea un evento de auditoría

#### Scenario: Cannot delete sale in closing
- **WHEN** un gestor intenta eliminar una venta ya incluida en un cierre
- **THEN** el sistema muestra un error
- **AND** la venta NO se elimina

### Requirement: Inventory Assignment Audit
El sistema SHALL registrar eventos de auditoría para todas las acciones relacionadas con asignaciones de inventario.

#### Scenario: Audit log records assignment creation
- **WHEN** un manager asigna inventario a un gestor
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y detalles de la asignación

#### Scenario: Audit log records confirmation
- **WHEN** un gestor aprueba una asignación
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y estado final

#### Scenario: Audit log records rejection
- **WHEN** un gestor rechaza una asignación
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y motivo del rechazo

#### Scenario: Audit log records conflict resolution
- **WHEN** un manager resuelve un conflicto de inventario
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y detalles de la resolución
