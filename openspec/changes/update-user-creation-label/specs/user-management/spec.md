## MODIFIED Requirements
### Requirement: User Creation Form Labels
The user creation form SHALL display clear and unambiguous labels that indicate the field is for a username.

#### Scenario: Admin creates new user
- **WHEN** Admin accesses user creation form
- **THEN** the label shall display "Nombre de usuario" instead of "Nombre"
- **AND** the placeholder shall display "Nombre de usuario"
- **AND** the success alert shall display "Usuario "{username}" creado exitosamente."

#### Scenario: Manager creates new gestor
- **WHEN** Manager accesses gestor creation form
- **THEN** the label shall display "Nombre de usuario" instead of "Nombre"
- **AND** the placeholder shall display "Nombre de usuario"

#### Scenario: Director creates new manager
- **WHEN** Director accesses manager creation form
- **THEN** the label shall display "Nombre de usuario" instead of "Nombre"
- **AND** the placeholder shall display "Nombre de usuario"

#### Scenario: User list table displays username
- **WHEN** viewing users list table
- **THEN** the table header shall display "Nombre de usuario" instead of "Nombre"
