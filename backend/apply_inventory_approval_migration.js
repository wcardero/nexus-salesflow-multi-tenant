const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Ejecutando migración de flujo de aprobación de inventario...');

    await client.query('BEGIN');

    // 1. Modificar tabla AssignedInventory para agregar estado de aprobación
    await client.query(`
      ALTER TABLE "AssignedInventory"
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT
    `);
    console.log('✓ Columnas agregadas a AssignedInventory');

    // 2. Migrar inventarios existentes a estado 'Confirmed'
    await client.query(`
      UPDATE "AssignedInventory"
      SET "confirmedAt" = "assignedAt",
          status = 'Confirmed'
      WHERE status IS NULL
    `);
    console.log('✓ Inventario existente migrado a estado Confirmed');

    // 3. Crear tabla InventoryConflict para gestionar rechazos de inventario
    await client.query(`
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
      )
    `);
    console.log('✓ Tabla InventoryConflict creada');

    // 4. Crear índices para optimización
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assigned_inventory_status ON "AssignedInventory"(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assigned_inventory_gestor_status ON "AssignedInventory"("gestorId", status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_conflict_status ON "InventoryConflict"(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_conflict_manager ON "InventoryConflict"(managerId, status)
    `);
    console.log('✓ Índices creados');

    await client.query('COMMIT');
    console.log('\n✅ Migración completada exitosamente!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
