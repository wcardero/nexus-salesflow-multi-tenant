## ADDED Requirements

### Requirement: Inventory Assignment Approval Status
El sistema SHALL mantener un estado de aprobación para cada asignación de inventario a gestores, que indique si el gestor ha revisado y aceptado el inventario asignado.

#### Scenario: Manager assigns inventory with pending status
- **WHEN** un manager asigna inventario a un gestor
- **THEN** la asignación se crea con estado `PendingApproval`
- **AND** el inventario NO está disponible para venta aún

#### Scenario: Gestor views pending assignments
- **WHEN** un gestor accede a su dashboard
- **THEN** puede ver todas las asignaciones de inventario con estado `PendingApproval`
- **AND** cada asignación muestra producto, cantidad y fecha de asignación

### Requirement: Inventory Approval by Gestor
El sistema SHALL permitir que los gestores aprueben o rechacen las asignaciones de inventario que reciben.

#### Scenario: Gestor approves pending assignment
- **WHEN** un gestor aprueba una asignación de inventario pendiente
- **THEN** el estado de la asignación cambia a `Approved`
- **AND** se crean ítems de inventario (`InventoryItem`) correspondientes
- **AND** el inventario está disponible para venta
- **AND** se registra un evento de auditoría

#### Scenario: Gestor rejects pending assignment
- **WHEN** un gestor rechaza una asignación de inventario pendiente
- **THEN** el estado de la asignación cambia a `Rejected`
- **AND** NO se crean ítems de inventario
- **AND** se registra un evento de auditoría

#### Scenario: Gestor cannot modify approved assignment
- **WHEN** un gestor intenta modificar una asignación ya aprobada
- **THEN** el sistema muestra un mensaje de error
- **AND** la asignación no cambia

### Requirement: Manager Views Assignment Status
El sistema SHALL permitir que los managers vean el estado de las asignaciones de inventario a sus gestores.

#### Scenario: Manager views all assignments with status
- **WHEN** un manager accede a la vista de inventario asignado
- **THEN** puede ver el estado de cada asignación (PendingApproval, Approved, Rejected)
- **AND** puede ver qué asignaciones han sido aceptadas por los gestores

#### Scenario: Manager identifies rejected assignments
- **WHEN** un gestor rechaza una asignación
- **THEN** el manager puede identificar la asignación rechazada
- **AND** puede tomar acción para reasignar o corregir el inventario

### Requirement: Inventory Assignment Audit
El sistema SHALL registrar eventos de auditoría para todas las acciones relacionadas con asignaciones de inventario.

#### Scenario: Audit log records assignment creation
- **WHEN** un manager asigna inventario a un gestor
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y detalles de la asignación

#### Scenario: Audit log records approval
- **WHEN** un gestor aprueba una asignación
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y estado final

#### Scenario: Audit log records rejection
- **WHEN** un gestor rechaza una asignación
- **THEN** se crea un registro de auditoría con usuario, acción, tipo de entidad y motivo del rechazo
