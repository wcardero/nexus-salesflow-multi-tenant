## ADDED Requirements
### Requirement: Edit and Delete Product Stock
Managers need to edit and delete initial product stock records to correct errors (e.g., changing 100 items to 90 items). Stock records can only be edited or deleted when the product is NOT assigned to any gestor to maintain data integrity.

#### Scenario: Edit unassigned stock
- **WHEN** Manager clicks "Editar" on a stock record for an unassigned product
- **THEN** Modal opens with current quantity
- **AND** Manager can change the quantity
- **AND** System updates stock record with new quantity
- **AND** Audit log entry is created with action `UPDATE_STOCK`

#### Scenario: Attempt to edit assigned stock
- **WHEN** Manager clicks "Editar" on a stock record for a product assigned to a gestor
- **THEN** Button is disabled (visually grayed out)
- **AND** If clicked, error message appears: "El producto no puede ser eliminado del stock porque se encuentra asignado a un gestor."

#### Scenario: Delete unassigned stock
- **WHEN** Manager clicks "Eliminar" on a stock record for an unassigned product
- **THEN** Confirmation dialog appears: "¿Estás seguro de que deseas eliminar este registro de stock?"
- **AND** If confirmed, stock record is removed from database
- **AND** Audit log entry is created with action `DELETE_STOCK`

#### Scenario: Attempt to delete assigned stock
- **WHEN** Manager clicks "Eliminar" on a stock record for a product assigned to a gestor
- **THEN** Button is disabled (visually grayed out)
- **AND** If clicked, error message appears: "El producto no puede ser eliminado del stock porque se encuentra asignado a un gestor."
- **AND** Confirmation dialog does NOT appear

#### Scenario: Correct stock error (100→90)
- **WHEN** Manager accidentally sets stock to 100 items
- **AND** Product is NOT assigned to any gestor
- **THEN** Manager clicks "Editar" on the stock record
- **AND** Modal opens showing current quantity (100)
- **AND** Manager changes quantity to 90
- **AND** Manager clicks "Guardar"
- **THEN** Stock is updated to 90 in database
- **AND** Product list shows updated quantity
- **AND** Audit log records the change

#### Scenario: Stock assigned to gestor cannot be edited
- **WHEN** Stock record exists for a product
- **AND** Product has assigned inventory (AssignedInventory) to a gestor
- **THEN** "Asignado a gestor" badge is shown
- **AND** Edit button is disabled
- **AND** Delete button is disabled
- **AND** Modal cannot be opened for this stock record
