#!/bin/bash
# Script para ejecutar migraciones de base de datos en producción

set -e

echo "🚀 Iniciando migraciones de base de datos..."

# Función para esperar a que PostgreSQL esté disponible
wait_for_postgres() {
    echo "⏳ Esperando a que PostgreSQL esté disponible..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-user}" 2>/dev/null; then
            echo "✅ PostgreSQL está disponible!"
            return 0
        fi
        echo "⏳ Intento $attempt/$max_attempts - esperando..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ PostgreSQL no respondió después de $max_attempts intentos"
    exit 1
}

# Función para ejecutar un archivo SQL
execute_sql_file() {
    local file=$1
    local filename=$(basename "$file")

    if [ -f "$file" ]; then
        echo "📄 Ejecutando: $filename"
        PGPASSWORD="${POSTGRES_PASSWORD:-password}" psql \
            -h "${POSTGRES_HOST:-postgres}" \
            -p "${POSTGRES_PORT:-5432}" \
            -U "${POSTGRES_USER:-user}" \
            -d "${POSTGRES_DB:-nexusdb}" \
            -f "$file" 2>&1 || {
                echo "❌ Error ejecutando $filename"
                exit 1
            }
        echo "✅ $filename completado"
    fi
}

# Esperar a PostgreSQL
wait_for_postgres

# Ejecutar script de inicialización de base de datos (crea tablas iniciales)
echo "📋 Ejecutando db.sql para crear esquema base..."
if [ -f "./db.sql" ]; then
    PGPASSWORD="${POSTGRES_PASSWORD:-password}" psql \
        -h "${POSTGRES_HOST:-postgres}" \
        -p "${POSTGRES_PORT:-5432}" \
        -U "${POSTGRES_USER:-user}" \
        -d "${POSTGRES_DB:-nexusdb}" \
        -f ./db.sql 2>&1 || {
            echo "❌ Error ejecutando db.sql"
            exit 1
        }
    echo "✅ Esquema base creado"
else
    echo "⚠️ No se encontró db.sql, omitiendo..."
fi

# Orden de migraciones (deben ejecutarse en este orden)
MIGRATION_ORDER=(
    "migrations/add_inventory_approval_flow.sql"
    "migrations/add_product_additional_columns.sql"
    "migrations/add_createdBy_to_user.sql"
    "migrations/add_currency_to_product.sql"
    "migrations/add_commissionRate_to_product.sql"
    "migrations/make_cost_columns_nullable.sql"
    "migrations/add_costMN_to_sale.sql"
    "migrations/add_directorId_to_store.sql"
    "migrations/add_productId_to_sale.sql"
    "migrations/fix_sale_inventory_fk.sql"
    "migrations/fix-usd-sales-exchange-rate.ts"
    "migrations/migrate_assigned_inventory_status.sql"
    "migrations/remove_sale_inventory_unique.sql"
    "migrations/add_createdBy_to_user.sql"
)

# Ejecutar migraciones en orden
for migration in "${MIGRATION_ORDER[@]}"; do
    if [ -f "$migration" ]; then
        execute_sql_file "$migration"
    fi
done

echo ""
echo "🎉 Todas las migraciones completadas exitosamente!"
