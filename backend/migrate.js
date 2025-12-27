const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

const fs = require('fs');

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Ejecutando migración de AssignedInventory...');
    
    await client.query('ALTER TABLE "AssignedInventory" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'Pending\'');
    console.log('✅ Columna status agregada');
    
    await client.query('ALTER TABLE "AssignedInventory" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP');
    console.log('✅ Columna confirmedAt agregada');
    
    await client.query('ALTER TABLE "AssignedInventory" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT');
    console.log('✅ Columna rejectionReason agregada');
    
    await client.query('UPDATE "AssignedInventory" SET "confirmedAt" = "assignedAt", status = \'Confirmed\' WHERE status IS NULL OR status = \'Pending\'');
    console.log('✅ Inventarios existentes migrados a estado Confirmed');
    
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
    console.log('✅ Tabla InventoryConflict creada');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_assigned_inventory_status ON "AssignedInventory"(status)');
    console.log('✅ Índice idx_assigned_inventory_status creado');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_assigned_inventory_gestor_status ON "AssignedInventory"("gestorId", status)');
    console.log('✅ Índice idx_assigned_inventory_gestor_status creado');
    
    console.log('');
    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- Columnas agregadas a AssignedInventory: status, confirmedAt, rejectionReason');
    console.log('- Tabla InventoryConflict creada');
    console.log('- Índices creados para optimización');
    console.log('- Inventarios existentes migrados a estado Confirmed');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
