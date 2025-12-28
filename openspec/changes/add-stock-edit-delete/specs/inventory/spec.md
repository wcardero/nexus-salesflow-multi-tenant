## ADDED Requirements
### Requirement: Edit and Delete Product Stock
Managers need to edit and delete initial product stock records to correct errors (e.g., changing 100 items to 90 items) and adjust for new purchases, shrinkage, damage, or theft. Stock records can be edited or deleted even when product has active assignments to gestors, because ProductStock (warehouse inventory) and AssignedInventory (inventory delivered to gestors) are separate entities.

#### Scenario: Edit stock with active assignments
- **WHEN** Manager clicks "Editar" on a stock record for a product that has active assignments to gestors
- **THEN** Modal opens with current quantity
- **AND** Manager can change quantity
- **AND** System updates stock record with new quantity
- **AND** Audit log entry is created with action `UPDATE_STOCK`
- **AND** "Asignado a gestor" badge is displayed as visual warning

#### Scenario: Edit stock without active assignments
- **WHEN** Manager clicks "Editar" on a stock record for an unassigned product
- **THEN** Modal opens with current quantity
- **AND** Manager can change quantity
- **AND** System updates stock record with new quantity
- **AND** Audit log entry is created with action `UPDATE_STOCK`

#### Scenario: Delete stock with active assignments
- **WHEN** Manager clicks "Eliminar" on a stock record for a product that has active assignments to gestors
- **THEN** Confirmation dialog appears: "¿Estás seguro de que deseas eliminar este registro de stock?"
- **AND** If confirmed, stock record is removed from database
- **AND** Audit log entry is created with action `DELETE_STOCK`
- **AND** AssignedInventory records remain unchanged (gestors keep their assigned inventory)
- **AND** "Asignado a gestor" badge is displayed as visual warning

#### Scenario: Delete stock without active assignments
- **WHEN** Manager clicks "Eliminar" on a stock record for an unassigned product
- **THEN** Confirmation dialog appears: "¿Estás seguro de que deseas eliminar este registro de stock?"
- **AND** If confirmed, stock record is removed from database
- **AND** Audit log entry is created with action `DELETE_STOCK`

#### Scenario: Correct stock error with assignments (10→15)
- **WHEN** Manager has ProductStock: 10 units
- **AND** Product has 5 units assigned to gestor
- **THEN** Manager clicks "Editar" on stock record
- **AND** Modal opens showing current quantity (10)
- **AND** Manager changes quantity to 15
- **AND** Manager clicks "Guardar"
- **THEN** Stock is updated to 15 in database
- **AND** Product list shows updated quantity
- **AND** Audit log records change
- **AND** AssignedInventory remains unchanged (5 units)

#### Scenario: Cannot assign more than available stock
- **WHEN** Manager has ProductStock: 0 units (after edit or delete)
- **AND** Product has 5 units assigned to gestor
- **THEN** Manager attempts to assign 3 more units to gestor
- **THEN** System displays error: "Not enough stock available. Requested: 3, Available: 0"
- **AND** Assignment is not created

#### Scenario: Visual warning for assigned products
- **WHEN** Stock record exists for a product
- **AND** Product has assigned inventory (AssignedInventory) to a gestor
- **THEN** "Asignado a gestor" badge is shown in stock list
- **AND** Edit button is enabled (not disabled)
- **AND** Delete button is enabled (not disabled)
- **AND** Badge serves as visual warning only

#### Scenario: Product definition remains blocked with assignments
- **WHEN** Product has active assignments to gestors
- **THEN** Product edit button (for definition: name, cost, margin, commission) is disabled
- **AND** Product delete button is disabled
- **THEN** Stock edit/delete buttons remain enabled (separate concern)
