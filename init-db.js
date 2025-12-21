// Simple script to initialize the database with required tables
import { Pool } from 'pg';
import 'dotenv/config';

// Use the same connection string as the backend
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb',
});

const dbSchema = `-- SQL for Nexus SalesFlow Database

-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS "Closing", "Sale", "InventoryItem", "Product", "ExchangeRate", "User", "Store", "_ClosingToSale", "_StoreToUser", "ProductStock", "AssignedInventory", "AuditLog" CASCADE;

-- ENUMS would be custom types in PostgreSQL
DROP TYPE IF EXISTS "Role";
CREATE TYPE "Role" AS ENUM ('Admin', 'Manager', 'Gestor');

DROP TYPE IF EXISTS "InventoryStatus";
CREATE TYPE "InventoryStatus" AS ENUM ('Available', 'Sold');

DROP TYPE IF EXISTS "ClosingStatus";
CREATE TYPE "ClosingStatus" AS ENUM ('PENDING', 'COMPLETED');


-- Create Tables
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "defaultCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL, -- Added password field
    "role" "Role" NOT NULL,
    "storeId" TEXT,
    CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "costUSD" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "storeId" TEXT NOT NULL,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- Table for tracking product quantities per store (for initial stock)
CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for tracking assigned quantities to gestors
CREATE TABLE "AssignedInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignedInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedInventory_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for audit trail
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
    "exchangeRateUsed" DOUBLE PRECISION NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "saleUSD" DOUBLE PRECISION NOT NULL,
    "baseMN" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "finalMN" DOUBLE PRECISION NOT NULL,
    "inventoryItemId" TEXT NOT NULL UNIQUE,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Closing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ClosingStatus" NOT NULL DEFAULT 'PENDING',
    "totalBaseMN" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL,
    "totalFinalMN" DOUBLE PRECISION NOT NULL,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "Closing_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Many-to-many relation for Sales in a Closing
CREATE TABLE "_ClosingToSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClosingToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "Closing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClosingToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Many-to-many relation for Stores and Managers
CREATE TABLE "_StoreToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StoreToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StoreToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "_ClosingToSale_AB_unique" ON "_ClosingToSale"("A", "B");
CREATE INDEX "_ClosingToSale_B_index" ON "_ClosingToSale"("B");

CREATE UNIQUE INDEX "_StoreToUser_AB_unique" ON "_StoreToUser"("A", "B");
CREATE INDEX "_StoreToUser_B_index" ON "_StoreToUser"("B");
`;

async function initDB() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()'); // Test connection
    console.log('Connected to database successfully!');
    
    console.log('Creating tables...');
    await pool.query(dbSchema);
    console.log('Tables created successfully!');
    
    await pool.end();
    console.log('Database initialization completed.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();