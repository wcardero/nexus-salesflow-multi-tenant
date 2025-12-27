#!/bin/bash
# Script para ejecutar la migración de AssignedInventory

echo "🔧 Ejecutando migración de AssignedInventory..."

# Extraer DATABASE_URL
if [ -f .env ]; then
    DB_URL=$(grep '^DATABASE_URL=' .env | cut -d'=' -f2)
else
    echo "❌ No se encontró archivo .env"
    exit 1
fi

if [ -z "$DB_URL" ]; then
    echo "❌ No se encontró DATABASE_URL en .env"
    exit 1
fi

echo "📋 Conectando a: $DB_URL"

# Leer el archivo SQL
SQL_FILE="backend/migrations/migrate_assigned_inventory_status.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ No se encontró archivo $SQL_FILE"
    exit 1
fi

# Ejecutar la migración con psql (usando cat para evitar problemas con redirección)
PGPASSWORD=password psql "$DB_URL" -c "SET client_min_messages TO ERROR; $(cat "$SQL_FILE"); SET client_min_messages TO NOTICE;"

if [ $? -eq 0 ]; then
    echo "✅ Migración ejecutada exitosamente"
    echo ""
    echo "📋 Resumen:"
    echo "- Columnas agregadas a AssignedInventory: status, confirmedAt, rejectionReason"
    echo "- Tabla InventoryConflict creada"
    echo "- Índices creados para optimización"
    echo "- Inventarios existentes migrados a estado 'Confirmed'"
else
    echo "❌ Error ejecutando la migración"
    exit 1
fi

# Usar psql directamente
PGPASSWORD=${PGPASSWORD:-password} psql -h ${POSTGRES_HOST:-localhost} -U ${POSTGRES_USER:-user} -d ${POSTGRES_DB:-nexusdb} -f backend/migrations/migrate_assigned_inventory_status.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración ejecutada exitosamente"
    echo ""
    echo "📋 Resumen:"
    echo "- Columnas agregadas a AssignedInventory: status, confirmedAt, rejectionReason"
    echo "- Tabla InventoryConflict creada"
    echo "- Índices creados para optimización"
    echo "- Inventarios existentes migrados a estado 'Confirmed'"
else
    echo "❌ Error ejecutando la migración"
    exit 1
fi
