## ADDED Requirements

### Requirement: Pending Inventory Review
El sistema SHALL permitir que los gestores visualicen las asignaciones de inventario pendientes de confirmación antes de aceptarlas.

#### Scenario: Gestor views pending inventory assignments
- **WHEN** un gestor accede a su dashboard
- **THEN** ve una sección destacada de "Inventario Pendiente de Confirmación"
- **AND** cada asignación pendiente muestra: producto, cantidad asignada, fecha de asignación
- **AND** hay botones de acción para cada asignación

#### Scenario: Gestor approves inventory assignment
- **WHEN** un gestor hace clic en "Aceptar" para una asignación pendiente
- **THEN** se llama al endpoint `POST /api/assigned-inventory/:id/confirm`
- **AND** la asignación cambia a estado `Confirmed`
- **AND** se registra la fecha de confirmación
- **AND** el inventario se convierte en disponible para venta
- **AND** se muestra un mensaje de éxito al usuario

#### Scenario: Gestor rejects inventory assignment
- **WHEN** un gestor hace clic en "Rechazar" para una asignación pendiente
- **AND** proporciona una razón válida para el rechazo
- **THEN** se abre un modal para confirmar el rechazo
- **AND** se llama al endpoint `POST /api/assigned-inventory/:id/reject`
- **AND** la asignación cambia a estado `Rejected`
- **AND** se crea un registro de conflicto
- **AND** se muestra un mensaje de confirmación

#### Scenario: Rejection reason is required
- **WHEN** un gestor intenta rechazar sin proporcionar una razón
- **THEN** el sistema muestra un error de validación
- **AND** el modal permanece abierto hasta que se proporcione una razón

### Requirement: Batch Sales Registration
El sistema SHALL permitir que los gestores registren ventas en lote para mejorar la eficiencia del registro.

#### Scenario: Gestor views batch sales interface
- **WHEN** un gestor accede a su dashboard
- **THEN** ve una sección de "Registrar Venta" con selector de producto
- **AND** el selector muestra solo productos de inventario confirmado con cantidad disponible
- **AND** muestra la cantidad disponible de cada producto
- **AND** hay un input para la cantidad a vender

#### Scenario: Gestor registers batch sales successfully
- **WHEN** un gestor selecciona un producto y una cantidad válida
- **AND** la cantidad no excede el inventario disponible
- **AND** hace clic en "Registrar Venta"
- **THEN** se llama al endpoint `POST /api/sales/batch`
- **AND** se crean múltiples registros de venta (uno por unidad)
- **AND** la cantidad en `AssignedInventory` se reduce
- **AND** se muestra un mensaje de éxito con el número de ventas registradas
- **AND** los campos se reinician para la siguiente venta

#### Scenario: Batch sales insufficient inventory
- **WHEN** un gestor intenta registrar una cantidad mayor que el inventario disponible
- **THEN** el sistema muestra un error de validación
- **AND** NO se crea ninguna venta
- **AND** el mensaje indica la cantidad disponible vs cantidad solicitada

#### Scenario: Batch sales empty validation
- **WHEN** un gestor intenta registrar una venta sin seleccionar producto
- **THEN** el botón "Registrar Venta" está deshabilitado
- **AND** se muestra un indicador visual de que el campo es requerido

### Requirement: Pending Sales Management
El sistema SHALL permitir que los gestores eliminen ventas que no han sido incluidas en un cierre, para corregir errores antes de consolidar.

#### Scenario: Gestor views pending sales
- **WHEN** un gestor accede a su dashboard
- **THEN** ve una sección de "Ventas Recientes (Pendientes de Cierre)"
- **AND** solo muestra ventas NO incluidas en ningún cierre
- **AND** cada venta muestra: producto, fecha, cantidad

#### Scenario: Gestor deletes pending sale
- **WHEN** un gestor hace clic en "Eliminar" para una venta pendiente
- **THEN** se muestra una confirmación
- **AND** se llama al endpoint `DELETE /api/sales/:id`
- **AND** la venta se elimina del sistema
- **AND** la cantidad se restaura en `AssignedInventory`
- **AND** se muestra un mensaje de éxito

#### Scenario: Cannot delete sale in closing
- **WHEN** un gestor intenta eliminar una venta ya incluida en un cierre
- **THEN** el botón "Eliminar" está oculto o deshabilitado
- **AND** si se intenta via API, el sistema muestra un error
- **AND** el mensaje indica que no se pueden modificar ventas en cierres

#### Scenario: Delete confirmation required
- **WHEN** un gestor hace clic en "Eliminar" una venta pendiente
- **THEN** el sistema muestra una ventana de confirmación
- **AND** la confirmación indica la acción no se puede deshacer
- **AND** la venta solo se elimina después de confirmar

### Requirement: Confirmed Inventory Display
El sistema SHALL mostrar solo inventario confirmado y disponible para venta en el panel del gestor.

#### Scenario: Gestor views available inventory
- **WHEN** un gestor accede a la sección de inventario disponible
- **THEN** solo muestra productos de `AssignedInventory` con estado `Confirmed`
- **AND** muestra la cantidad disponible de cada producto
- **AND** convierte las asignaciones a items individuales para mostrar en la interfaz

#### Scenario: Inventory unavailable until confirmed
- **WHEN** un gestor tiene asignaciones pendientes de confirmación
- **THEN** esas asignaciones NO aparecen en el inventario disponible
- **AND** NO se pueden vender productos de asignaciones pendientes
- **AND** se muestra un mensaje de "Inventario Pendiente de Confirmación" con acciones disponibles

### Requirement: Sales and Closures Dashboard
El sistema SHALL permitir que los gestores visualicen su historial de ventas y cierres completados.

#### Scenario: Gestor views sales history
- **WHEN** un gestor accede a la pestaña "Mis Reportes"
- **THEN** ve todas sus ventas históricas
- **AND** ve el total de comisión ganada en cierres completados
- **AND** ve el historial de cierres con estado `Completed`

#### Scenario: Gestor views closing details
- **WHEN** un gestor ve un cierre completado
- **THEN** muestra: fecha de cierre, fecha de finalización, ventas totales, comisión recibida, monto entregado
