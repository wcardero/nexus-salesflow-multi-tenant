# Change: Fix Exchange Rate Persistence

## Why
Exchange rate changes were only updating the local state (memory) and not persisting to the database. This caused all exchange rate changes to be lost when the page refreshed or the dashboard reloaded. Users need exchange rates to persist across sessions.

## What Changes
- Add backend API endpoint `POST /api/exchange-rates` to persist exchange rates to database
- Update ManagerDashboard to call backend API instead of only updating local state
- Maintain existing historical tracking: new rate gets saved, previous rate gets endDate set
- Add audit logging for exchange rate changes

## Impact
- Affected specs: pricing
- Affected code:
  - backend/src/index.ts - Add new endpoint (backend/src/index.ts:1341-1398)
  - views/ManagerDashboard.tsx - Update handleSetExchangeRate to use API (views/ManagerDashboard.tsx:34-57)
