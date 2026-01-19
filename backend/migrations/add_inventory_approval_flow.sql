-- Migración para confirmación de inventario, conflictos y cierre de pagos
-- Cambio: add-inventory-approval-flow

-- 1. Modificar tabla AssignedInventory para agregar estado de aprobación
ALTER TABLE "AssignedInventory"
ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN "confirmedAt" TIMESTAMP,
ADD COLUMN "rejectionReason" TEXT;

-- 2. Migrar inventarios existentes a estado 'Confirmed'
UPDATE "AssignedInventory"
SET "confirmedAt" = "assignedAt",
    status = 'Confirmed'
WHERE status = 'Pending';

-- 3. Crear tabla InventoryConflict para gestionar rechazos de inventario
CREATE TABLE IF NOT EXISTS "InventoryConflict" (
  id TEXT PRIMARY KEY,
  "assignedInventoryId" TEXT NOT NULL,
  gestorId TEXT NOT NULL,
  managerId TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP,
  CONSTRAINT fk_assigned_inventory FOREIGN KEY ("assignedInventoryId") REFERENCES "AssignedInventory"(id),
  CONSTRAINT fk_conflict_gestor FOREIGN KEY (gestorId) REFERENCES "User"(id),
  CONSTRAINT fk_conflict_manager FOREIGN KEY (managerId) REFERENCES "User"(id)
);

-- 4. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_assigned_inventory_status ON "AssignedInventory"(status);
CREATE INDEX IF NOT EXISTS idx_assigned_inventory_gestor_status ON "AssignedInventory"("gestorId", status);
CREATE INDEX IF NOT EXISTS idx_inventory_conflict_status ON "InventoryConflict"(status);
CREATE INDEX IF NOT EXISTS idx_inventory_conflict_manager ON "InventoryConflict"(managerId, status);
