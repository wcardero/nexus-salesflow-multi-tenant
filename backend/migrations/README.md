# Sistema de Migraciones

## Convención de Nombres

Todas las migraciones deben seguir el formato:
```
XXX_descripcion_corta.sql
```

Donde:
- `XXX` = Número secuencial de 3 dígitos (001, 002, 003...)
- `descripcion_corta` = Descripción de los cambios

## Ejemplos

✅ **Correcto:**
- `001_initial_schema.sql`
- `002_add_users_table.sql`
- `003_add_transfer_payment.sql`

❌ **Incorrecto:**
- `add_users_table.sql` (sin número)
- `fix_bugs.sql` (sin número)
- `new_feature.sql` (sin número)

## Historial de Migraciones

### Migraciones Legado (Pre-2025-02)
Las siguientes migraciones fueron creadas antes de establecer la convención numérica. Se mantienen por compatibilidad histórica pero ya están integradas en `init-db.ts` y `db.sql`:

- `add_commissionRate_to_product.sql`
- `add_costMN_to_sale.sql`
- `add_createdBy_to_user.sql`
- `add_currency_to_product.sql`
- `add_directorId_to_store.sql`
- `add_inventory_approval_flow.sql`
- `add_price_to_assigned_inventory.sql`
- `add_product_additional_columns.sql`
- `add_productId_to_sale.sql`
- `fix_sale_inventory_fk.sql`
- `make_cost_columns_nullable.sql`
- `migrate_assigned_inventory_status.sql`
- `remove_sale_inventory_unique.sql`

### Migraciones con Convención (2025-02 en adelante)
- `004_add_transfer_payment.sql`

## Cómo Crear una Nueva Migración

1. Verificar el último número usado:
   ```bash
   ls backend/migrations/*.sql | sort | tail -1
   ```

2. Crear archivo con siguiente número:
   ```bash
   # Si el último es 004_*, el siguiente es 005
   touch backend/migrations/005_nueva_feature.sql
   ```

3. Escribir SQL idempotente (usar `IF NOT EXISTS`):
   ```sql
   ALTER TABLE "TableName" 
   ADD COLUMN IF NOT EXISTS "newColumn" TYPE DEFAULT value;
   ```

4. Al reiniciar el backend, se ejecutará automáticamente

## Orden de Ejecución

Las migraciones se ejecutan en **orden alfabético**:
```
001_ < 002_ < 003_ < 010_ < 100_
```

El sistema de migraciones:
1. Lee todos los archivos `.sql` del directorio
2. Los ordena alfabéticamente
3. Ejecuta solo los que no estén en la tabla `_Migrations`
4. Marca cada uno como ejecutado

## Solución de Problemas

### "Migration already executed"
Si ves este mensaje, la migración ya está en la tabla `_Migrations`. Esto es normal y no indica error.

### "column X already exists"
El sistema ahora detecta estos errores y marca la migración como ejecutada automáticamente.

### Necesito revertir una migración
Las migraciones no tienen "down" automático. Para revertir:
1. Crear nueva migración que deshaga los cambios
2. O restaurar backup de BD
