# Change: Inventory Approval Flow for Gestors

## Why
Actualmente, cuando un manager asigna inventario a un gestor, este se agrega automáticamente al stock del gestor sin permitir que el gestor verifique que coincide con lo que tiene físicamente. Esto puede causar discrepancias entre el inventario digital y el inventario físico.

## What Changes
- **ADDED**: Estado de aprobación (`PendingApproval`, `Approved`, `Rejected`) a las asignaciones de inventario (`AssignedInventory`)
- **ADDED**: Vista de "Inventario Pendiente de Aprobación" en el Dashboard del Gestor
- **ADDED**: Funcionalidad para que los gestores acepten o rechacen asignaciones de inventario
- **MODIFIED**: Al asignar inventario, cambia el estado predeterminado de directamente disponible a pendiente de aprobación
- **MODIFIED**: El inventario solo se convierte en disponible para venta cuando el gestor lo aprueba

## Impact
- Affected specs: inventory (new capability)
- Affected code:
  - `types.ts`: Agregar campo `status` a `AssignedInventory`
  - `ManagerDashboard.tsx`: Actualizar vista de asignación de inventario para mostrar estado
  - `GestorDashboard.tsx`: Agregar nueva pestaña para inventario pendiente de aprobación
  - Backend: Actualizar endpoints para manejar el flujo de aprobación
