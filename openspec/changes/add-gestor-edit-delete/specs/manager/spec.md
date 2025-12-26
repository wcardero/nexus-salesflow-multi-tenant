## ADDED Requirements
### Requirement: Edit and Delete Gestors with Inventory Validation
Managers need to edit and delete gestores to correct mistakes or remove inactive staff. Gestores can only be edited or deleted when they don't have assigned inventory to prevent data integrity issues.

#### Scenario: Edit unassigned gestor
- **WHEN** Manager clicks "Editar" on a gestor without assigned inventory
- **THEN** Modal opens with current name
- **AND** Manager can change name
- **AND** Manager can optionally change password
- **AND** System updates user in database
- **AND** User list shows updated information

#### Scenario: Attempt to edit gestor with inventory
- **WHEN** Manager clicks "Editar" on a gestor with assigned inventory
- **THEN** Button is disabled (visually grayed out)
- **AND** If clicked, error message appears: "El gestor no puede ser editado ni eliminado porque tiene inventario asignado."

#### Scenario: Delete unassigned gestor
- **WHEN** Manager clicks "Eliminar" on a gestor without assigned inventory
- **THEN** Confirmation dialog appears: "¿Estás seguro de que deseas eliminar este gestor?"
- **AND** If confirmed, gestor is removed from database
- **AND** User list no longer shows the gestor

#### Scenario: Attempt to delete gestor with inventory
- **WHEN** Manager clicks "Eliminar" on a gestor with assigned inventory
- **THEN** Button is disabled (visually grayed out)
- **AND** If clicked, error message appears: "El gestor no puede ser editado ni eliminado porque tiene inventario asignado."
- **AND** Confirmation dialog does NOT appear

#### Scenario: Inventory assignment validates all fields
- **WHEN** Manager submits inventory assignment without selecting product
- **THEN** Error message appears: "Por favor, complete todos los campos correctamente: - Debe seleccionar un producto"
- **WHEN** Manager submits inventory assignment without selecting gestor
- **THEN** Error message appears: "Por favor, complete todos los campos correctamente: - Debe seleccionar un gestor"
- **WHEN** Manager submits inventory assignment with quantity less than 1
- **THEN** Error message appears: "Por favor, complete todos los campos correctamente: - La cantidad debe ser mayor a 0"
- **WHEN** Manager submits inventory assignment with all fields filled correctly
- **THEN** Inventory is assigned successfully
- **AND** Success message appears showing assigned quantity

#### Scenario: Gestor with inventory shows badge
- **WHEN** A gestor has assigned inventory (AssignedInventory records)
- **THEN** "Tiene inventario asignado" badge is shown next to gestor name
- **AND** Edit button is disabled
- **AND** Delete button is disabled

#### Scenario: Manager can see gestores after logging in
- **WHEN** Manager logs in with correct credentials and store selection
- **THEN** System validates store access via User table or _StoreToUser table
- **AND** GET /api/users returns gestores with correct storeId
- **AND** All gestores for that store are listed in GestoresView
- **AND** Manager can see both existing and newly created gestores
