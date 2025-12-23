# Change: Add Store Selection to Login

## Why
Currently, users (Director, Manager, Gestor) can login without selecting their store, which could cause confusion when a user is associated with multiple stores. Store selection at login provides clearer authentication context and allows multi-store user support.

## What Changes
- Add store dropdown to login form with default option "Seleccione su tienda"
- Store dropdown is populated with available stores
- Admin users can select "Seleccione su tienda" and login without selecting a specific store
- Non-admin users (Director, Manager, Gestor) must select their specific store
- Login validates username, password AND store association for non-admin users
- Admin login only validates username and password (no store validation)
- Backend `/api/login` endpoint accepts optional `storeId` parameter
- When `storeId` is provided and not the default option, validate user's `storeId` matches

## Impact
- Affected specs: authentication, user-management
- Affected code: views/Login.tsx, backend/src/index.ts (login endpoint)
