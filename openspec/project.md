# Project Context

## Purpose
Multi-tenant sales management system with role-based hierarchy (Admin → Director → Manager → Gestor) for inventory tracking, sales recording, and cash reconciliation (cierre) with configurable pricing, exchange rates, and commissions.

## Tech Stack
- **Frontend**: React 19.2, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.1
- **Backend**: Express 5.2, TypeScript 5.9, PostgreSQL, bcrypt, jsonwebtoken
- **Authentication**: JWT tokens with RBAC (Role-Based Access Control)
- **Development**: ts-node-dev for backend, Vite HMR for frontend

## Project Conventions

### Code Style
Follows Google TypeScript Style Guide (`conductor/code_styleguides/typescript.md`):
- Use `const` by default, never `var`
- ES6 modules (`import`/`export`), named exports (no default exports)
- Single quotes for strings, template literals for interpolation
- `===` for equality checks, explicit semicolons
- UpperCamelCase for classes/interfaces/types, lowerCamelCase for variables/functions
- No `#private` fields, use `private` modifier
- Avoid `any` type, prefer `unknown`
- No `_` prefix/suffix for private properties

### Architecture Patterns
- **Multi-tenant hierarchy**: Admin (system-wide) → Director (per store) → Manager (per store, can be multiple) → Gestor (assigned stock)
- **Centralized API calls**: `hooks/useApi.ts` handles all API requests (GET, POST, PUT, DELETE)
- **Role-based dashboards**: Separate view components per role (AdminDashboard, DirectorDashboard, ManagerDashboard, GestorDashboard)
- **JWT authentication**: Protected endpoints with role-based authorization
- **REST API**: Express routes organized by resource with middleware for auth and validation

### Testing Strategy
Test-Driven Development (TDD) approach following Red-Green-Refactor cycle:
- **Red Phase**: Write failing tests before implementing functionality
- **Green Phase**: Write minimum code to make tests pass
- **Refactor Phase**: Improve code with test safety, rerun tests
- **Coverage Target**: >80% for all modules
- **Test Types**:
  - Unit tests for each module with appropriate setup/teardown
  - Integration tests for complete user flows, database transactions, auth/authz
  - Mock external dependencies
  - Test both success and failure cases
- **Mobile Testing**: Test on Safari developer tools, touch interactions, 3G/4G performance
- **Non-Interactive Mode**: Use `CI=true` flag for watch-mode tools to ensure single execution
- **Database Tests**: Connection tests in `backend/test-db.ts`

### Git Workflow
**Commit Convention**: Follow Conventional Commits format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```
**Types**: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (code change), `test` (tests), `chore` (maintenance)

**Examples**:
- `feat(auth): Add remember me functionality`
- `fix(posts): Correct excerpt generation for short posts`
- `docs: actualizar README con optimizaciones y permisos de usuarios`

**Process**:
1. Work tasks sequentially from `conductor/tracks/[track-name]/plan.md`
2. Mark task as `[~]` (in progress) before starting
3. Write tests, implement, verify coverage
4. Commit with conventional message
5. Attach git note with task summary: `git notes add -m "<note>" <commit_hash>`
6. Update plan with commit SHA `[<sha>]`
7. Create checkpoint commits at phase completion with verification reports in git notes

**Scope**: `<type>(<scope>)` - common scopes: auth, users, stores, products, sales, ui, mobile

## Domain Context

### Business Rules
- **Currency**: Single national currency (MN) with USD cost base
- **Exchange rate**: Global factor X (USD→MN) per store, historical with validity periods
- **Sales history**: Each sale freezes the exchange rate used (non-retroactive)
- **Pricing**: Fixed prices, Gestors cannot apply discounts
- **Commission**: Configurable by Manager (default 10%) on MN base price
- **Cash flow**: Gestors only deliver money through cierre (reconciliation) process
- **Returns**: Not permitted (phase 1)

### Pricing Formula
For a product with `compra_usd` and `margen_pct`:
- `venta_usd = compra_usd × (1 + margen_pct)`
- `mn_base = venta_usd × X` (X = current exchange rate)
- `comision = mn_base × (commission_percentage)`
- `mn_final = mn_base + comision`

### Role Permissions
| Role | Can Create | Can Edit | Can Delete | Special |
|------|-----------|----------|-----------|---------|
| Admin | Director, Manager | All users (except own role) | All users (except self) | Creates stores, audit log |
| Director | Manager (their store) | Name only | Managers (their store) | Products, exchange rate, stock assignment |
| Manager | Gestor (their store) | Name only | Gestors (their store) | Assign stock to gestors |
| Gestor | None | Name only | None | Register sales, execute cierre |

## Important Constraints
- **No returns** in phase 1
- **Fixed pricing** - Gestors cannot apply discounts
- **Manager stock ownership** - Managers can only manage assigned stock, not total store inventory
- **Single admin limitation** - Only one admin can exist after initial setup
- **Store assignment** - Directors and Managers must have a store assigned when created
- **Cierre workflow** - Money only moves through reconciliation process, not direct transfers

## External Dependencies
- **PostgreSQL**: Primary database for users, stores, products, inventory, sales, and audit logs
- **JWT**: Stateless authentication tokens
- **bcrypt**: Password hashing for security
