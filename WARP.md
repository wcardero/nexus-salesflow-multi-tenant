# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
NexusFlow is a multi-tenant sales flow management system built with React, TypeScript, and Vite. The application simulates a retail management platform with three distinct user roles (Admin, Manager, Gestor) and handles currency exchange rate calculations (USD to MXN) with commission tracking.

## Development Commands

### Setup
```bash
npm install
```

### Running the Application
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
Set `GEMINI_API_KEY` in `.env.local` before running (required for AI Studio integration).

## Architecture

### Core Type System
The application uses a strict role-based type system defined in `types.ts`:
- **Roles**: `ADMIN`, `MANAGER`, `GESTOR` - each role has distinct permissions and UI
- **Multi-tenancy**: Each `Store` represents a tenant with its own exchange rate and commission percentage
- **Sales Flow**: Products → Inventory Batches → Sales → Closures (with frozen exchange rates at sale time)

### State Management
`store.ts` contains the mock database (`mockDB`) with in-memory state for:
- Stores (tenants)
- Users (with role-based access)
- Products (with USD costs and margin percentages)
- Batches, Sales, and Closures (tracked by gestor and store)

The app currently uses local component state. No external state management library is used.

### Key Business Logic
**Pricing calculations** in `utils.ts`:
```
ventaUsd = costUsd * (1 + marginPct)
mnBase = ventaUsd * exchangeRate
comision = mnBase * commissionPct
mnFinal = mnBase + comision
```

Exchange rates and pricing parameters are **frozen at the time of sale** to maintain financial accuracy.

### Component Structure
```
App.tsx                          # Root component with role-based routing
├── components/Layout.tsx        # Shared layout with sidebar navigation
└── views/
    ├── AdminDashboard.tsx       # System-wide tenant management
    ├── ManagerDashboard.tsx     # Store inventory and pricing management
    └── GestorDashboard.tsx      # Sales agent interface with daily closure
```

### Routing & Role Switching
The app uses a role-simulation header (not production auth) to switch between user contexts. `App.tsx` conditionally renders dashboards based on `currentUser.role`.

### Styling
- TailwindCSS loaded via CDN in `index.html`
- Custom color palette: primary blue (#137fec), surface colors for multi-level UI
- Material Symbols Outlined icons for all iconography
- Manrope font family

### Path Aliases
The project uses `@/*` alias pointing to the root directory:
```typescript
// Both work:
import { mockDB } from '@/store';
import { mockDB } from '../store';
```

## Important Conventions
- **Currency**: Always use `formatCurrency()` from `utils.ts` for MXN display
- **Frozen Parameters**: When creating `Sale` objects, capture `exchangeRate`, `costUsd`, and `marginPct` from their current values (they may change later)
- **Role Guards**: Each dashboard expects specific user roles - always check `user.role` before rendering
- **Store Context**: Manager and Gestor dashboards require a valid `store` prop

## Known Limitations
- No actual backend - all data is in-memory via `mockDB`
- No TypeScript compilation checks in development (Vite handles transpilation, `noEmit: true`)
- Some dashboard sections show "Phase 2 development" placeholders
- No linting or formatting scripts configured
