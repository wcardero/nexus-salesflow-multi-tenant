# Change: Update User Creation Label to "Nombre de usuario"

## Why
The current UI labels show "Nombre" (Name) when creating a new user, which is ambiguous. Users should see "Nombre de usuario" (Username) to be more precise about what field they're filling in, consistent with Spanish UI conventions for authentication systems.

## What Changes
- Update label from "Nombre" to "Nombre de usuario" in user creation form (UserManagement.tsx)
- Update placeholder from "Nombre de usuario" (already correct) to remain consistent
- Change alert message from referencing "Usuario "name"" to "Usuario "username""
- Apply same change to ManagerDashboard.tsx (creating gestors) and DirectorDashboard.tsx (creating managers) for consistency across all user creation flows

## Impact
- Affected specs: user-management
- Affected code: views/UserManagement.tsx (line 223), views/ManagerDashboard.tsx (line 379), views/DirectorDashboard.tsx (line 214, 254, 287)
