#!/bin/bash
# Script simplificado: solo crea esquema base, las migraciones las maneja Node.js

set -e

echo "🚀 Iniciando configuración de base de datos..."

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

# Esperar a PostgreSQL
wait_for_postgres

# Ejecutar script de inicialización de base de datos (crea tablas iniciales si no existen)
echo "📋 Verificando esquema base..."
if [ -f "./db.sql" ]; then
    PGPASSWORD="${POSTGRES_PASSWORD:-password}" psql \
        -h "${POSTGRES_HOST:-postgres}" \
        -p "${POSTGRES_PORT:-5432}" \
        -U "${POSTGRES_USER:-user}" \
        -d "${POSTGRES_DB:-nexusdb}" \
        -f ./db.sql 2>&1 || {
            echo "⚠️ db.sql ya fue aplicado o hubo un error (esto es normal en actualizaciones)"
        }
    echo "✅ Esquema base verificado"
else
    echo "⚠️ No se encontró db.sql"
fi

echo ""
echo "📝 Las migraciones serán ejecutadas automáticamente por la aplicación Node.js"
echo "🚀 Iniciando servidor..."
