import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb',
});

const dbSchema = `-- SQL for Nexus SalesFlow Database

-- 1. Limpieza agresiva de TODO el esquema público
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- 2. ENUMS
CREATE TYPE "Role" AS ENUM ('Admin', 'Director', 'Manager', 'Gestor');
CREATE TYPE "InventoryStatus" AS ENUM ('Available', 'Sold');
CREATE TYPE "ClosingStatus" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "SalePaymentStatus" AS ENUM ('PAID', 'PENDING');

-- 3. Tablas Base
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "defaultCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "directorId" TEXT
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "storeId" TEXT,
    "createdBy" TEXT,
    CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "Store" ADD CONSTRAINT "Store_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rate" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    CONSTRAINT "ExchangeRate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costUSD" DOUBLE PRECISION,
    "costMN" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "margin" DOUBLE PRECISION,
    "priceMN" DOUBLE PRECISION,
    "gestorCommissionMN" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "storeId" TEXT NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InventoryStatus" NOT NULL DEFAULT 'Available',
    "productId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AssignedInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceMN" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "confirmedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    CONSTRAINT "AssignedInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedInventory_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountingDate" DATE,
    "exchangeRateUsed" DOUBLE PRECISION NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "costMN" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margin" DOUBLE PRECISION NOT NULL,
    "saleUSD" DOUBLE PRECISION NOT NULL,
    "baseMN" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "finalMN" DOUBLE PRECISION NOT NULL,
    "productId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'PAID',
    "customerName" TEXT,
    CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "AssignedInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Closing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "accountingDate" DATE,
    "status" "ClosingStatus" NOT NULL DEFAULT 'PENDING',
    "totalBaseMN" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL,
    "totalFinalMN" DOUBLE PRECISION NOT NULL,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "Closing_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "_ClosingToSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClosingToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "Closing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClosingToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "_StoreToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StoreToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StoreToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InventoryConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignedInventoryId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Pending',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP,
    CONSTRAINT "fk_assigned_inventory" FOREIGN KEY ("assignedInventoryId") REFERENCES "AssignedInventory"("id"),
    CONSTRAINT "fk_conflict_gestor" FOREIGN KEY ("gestorId") REFERENCES "User"("id"),
    CONSTRAINT "fk_conflict_manager" FOREIGN KEY ("managerId") REFERENCES "User"("id")
);

-- 4. Índices
CREATE UNIQUE INDEX "_ClosingToSale_AB_unique" ON "_ClosingToSale"("A", "B");
CREATE INDEX "_ClosingToSale_B_index" ON "_ClosingToSale"("B");
CREATE UNIQUE INDEX "_StoreToUser_AB_unique" ON "_StoreToUser"("A", "B");
CREATE INDEX "_StoreToUser_B_index" ON "_StoreToUser"("B");
`;

async function initDB() {
  try {
    await pool.query('SELECT NOW()');
    
    await pool.query(dbSchema);
    
    await pool.end();
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
