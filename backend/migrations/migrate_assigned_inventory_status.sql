-- Migración para agregar estado de aprobación a AssignedInventory
ALTER TABLE "AssignedInventory"
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Migrar inventarios existentes a estado 'Confirmed'
UPDATE "AssignedInventory"
SET "confirmedAt" = assignedAt,
    status = 'Confirmed'
WHERE status = 'Pending' OR status IS NULL;

-- Crear tabla InventoryConflict si no existe
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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_assigned_inventory_status ON "AssignedInventory"(status);
CREATE INDEX IF NOT EXISTS idx_assigned_inventory_gestor_status ON "AssignedInventory"("gestorId", status);
CREATE INDEX IF NOT EXISTS idx_inventory_conflict_status ON "InventoryConflict"(status);
CREATE INDEX IF NOT EXISTS idx_inventory_conflict_manager ON "InventoryConflict"(managerId, status);
