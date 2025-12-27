## ADDED Requirements

### Requirement: Inventory Conflict Management
El sistema SHALL permitir que los managers visualicen y resuelvan conflictos de inventario generados cuando un gestor rechaza una asignación.

#### Scenario: Manager views inventory conflicts
- **WHEN** un manager accede a la pestaña de conflictos
- **THEN** puede ver todos los conflictos con estado `Pending` de su tienda
- **AND** cada conflicto muestra: gestor, producto, cantidad asignada, razón del rechazo, fecha de creación

#### Scenario: Manager reassigns rejected inventory
- **WHEN** un manager selecciona la acción de reasignar un conflicto
- **AND** proporciona una nueva cantidad válida
- **THEN** se actualiza la cantidad del `AssignedInventory` original
- **AND** el estado de la asignación cambia a `Pending`
- **AND** el estado del conflicto cambia a `Resolved`
- **AND** se registra la fecha de resolución en `resolvedAt`
- **AND** se crea un evento de auditoría con la acción `RESOLVE_CONFLICT_REASSIGN`

#### Scenario: Manager cancels rejected inventory
- **WHEN** un manager selecciona la acción de cancelar un conflicto
- **AND** confirma la cancelación
- **THEN** se elimina el registro de `AssignedInventory`
- **AND** el estado del conflicto cambia a `Resolved`
- **AND** se registra la fecha de resolución en `resolvedAt`
- **AND** se crea un evento de auditoría con la acción `RESOLVE_CONFLICT_CANCEL`

#### Scenario: Manager cannot modify resolved conflict
- **WHEN** un manager intenta modificar un conflicto ya resuelto
- **THEN** el sistema muestra un mensaje de error
- **AND** el conflicto no cambia

### Requirement: Closing Payment Confirmation
El sistema SHALL permitir que los managers confirmen la recepción de dinero físico de los cierres ejecutados por los gestores.

#### Scenario: Manager views pending closings
- **WHEN** un manager accede a la vista de cierres
- **THEN** puede ver los cierres con estado `Pending` de sus gestores
- **AND** cada cierre muestra: gestor, ventas totales, monto a recibir, comisión del gestor, fecha de inicio

#### Scenario: Manager confirms payment receipt
- **WHEN** un manager confirma que recibió el dinero físico de un cierre
- **THEN** el estado del cierre cambia a `Completed`
- **AND** se registra la fecha de finalización en `completedAt`
- **AND** se crea un evento de auditoría con la acción `CONFIRM_CLOSING_PAYMENT`
- **AND** el gestor ha recibido su comisión y el resto ha pasado a contabilidad

#### Scenario: Manager confirms payment with warning
- **WHEN** un manager intenta confirmar un cierre
- **AND** el sistema muestra una advertencia de que esta acción no se puede deshacer
- **THEN** el manager debe confirmar explícitamente antes de proceder
- **AND** la acción se ejecuta solo después de la confirmación

#### Scenario: Cannot confirm already completed closing
- **WHEN** un manager intenta confirmar un cierre ya completado
- **THEN** el sistema muestra un mensaje de error
- **AND** el cierre no cambia

## MODIFIED Requirements

### Requirement: Manager Views Assignment Status
El sistema SHALL permitir que los managers vean el estado de las asignaciones de inventario a sus gestores.

#### Scenario: Manager views all assignments with status
- **WHEN** un manager accede a la vista de inventario asignado
- **THEN** puede ver el estado de cada asignación (Pending, Confirmed, Rejected)
- **AND** puede ver qué asignaciones han sido aceptadas por los gestores
- **AND** puede ver qué asignaciones han sido rechazadas

#### Scenario: Manager identifies rejected assignments
- **WHEN** un gestor rechaza una asignación
- **THEN** el manager puede identificar la asignación rechazada por su estado
- **AND** puede ver la razón del rechazo
- **AND** puede tomar acción para reasignar o corregir el inventario

#### Scenario: Manager confirms received assignments
- **WHEN** un gestor confirma una asignación
- **THEN** el manager puede ver el estado cambiado a `Confirmed`
- **AND** puede ver la fecha de confirmación
- **AND** el inventario está disponible para que el gestor venda
