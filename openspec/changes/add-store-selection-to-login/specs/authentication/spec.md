## ADDED Requirements
### Requirement: Store Selection on Login
The login form SHALL have a store dropdown with default option "Seleccione su tienda". Non-admin users MUST select their associated store during authentication. Admin users can login with default option without selecting a specific store.

#### Scenario: Admin login with default store option
- **WHEN** an Admin user enters credentials and leaves store as "Seleccione su tienda"
- **THEN** login shall proceed with username and password only
- **AND** no store validation shall be performed

#### Scenario: Manager login with store selection
- **WHEN** a Manager user enters credentials and selects a specific store (not default)
- **THEN** backend shall validate user's storeId matches selected store
- **AND** login shall succeed if both credentials and store match
- **AND** login shall fail if store doesn't match user's association

#### Scenario: Director login with store selection
- **WHEN** a Director user enters credentials and selects a specific store (not default)
- **THEN** backend shall validate user's storeId matches selected store
- **AND** login shall succeed if both credentials and store match
- **AND** login shall fail if store doesn't match user's association

#### Scenario: Gestor login with store selection
- **WHEN** a Gestor user enters credentials and selects a specific store (not default)
- **THEN** backend shall validate user's storeId matches selected store
- **AND** login shall succeed if both credentials and store match
- **AND** login shall fail if store doesn't match user's association

#### Scenario: Non-admin user attempts login without selecting store
- **WHEN** a non-admin user enters credentials and leaves store as "Seleccione su tienda"
- **THEN** login shall fail with an error message indicating store is required
- **AND** user shall be prompted to select their store

#### Scenario: Non-admin user attempts login with wrong store
- **WHEN** a non-admin user enters valid credentials but selects wrong store
- **THEN** login shall fail with an error message indicating store mismatch
- **AND** user shall be prompted to select the correct store
