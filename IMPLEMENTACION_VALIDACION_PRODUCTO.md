# Resumen: Validación de Nombre Único de Producto por Manager

## Cambio Implementado
Se ha implementado una validación que garantiza que cada manager (y director) solo pueda tener un producto con un nombre dado. Diferentes managers pueden crear productos con el mismo nombre, ya que trabajan de forma independiente.

## Cambios Realizados

### Base de Datos
1. **Nueva columna `createdBy` en tabla `Product`**
   - Tipo: TEXT (opcional/nullable)
   - Propósito: Guardar el ID del usuario (manager/director) que creó el producto
   - Script: `backend/add-createdby-column.js`

2. **Nuevo índice para búsqueda eficiente**
   - Índice compuesto en (name, createdBy)
   - Propósito: Optimizar validaciones de nombres duplicados
   - Script: `backend/add-product-name-creator-index.js`

### Backend (`backend/src/index.ts`)
1. **POST /api/products** - Validación al crear
   ```typescript
   // Verifica si el manager ya tiene un producto con ese nombre
   const existingProduct = await db.query(
     'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2',
     [name, requestingUser.id]
   );

   if (existingProduct.rows.length > 0) {
     return res.status(409).json({
       message: 'Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre.'
     });
   }

   // Guarda el ID del creador
   const result = await db.query(
     'INSERT INTO "Product" (..., "createdBy") VALUES (..., $7) RETURNING *',
     [..., requestingUser.id]
   );
   ```

2. **PUT /api/products/:id** - Validación al editar
   ```typescript
   // Solo valida si se está cambiando el nombre
   if (name !== undefined && name !== product.name) {
     const duplicateCheck = await db.query(
       'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2 AND id != $3',
       [name, requestingUser.id, id]
     );

     if (duplicateCheck.rows.length > 0) {
       return res.status(409).json({
         message: 'Ya tienes un producto con ese nombre.'
       });
     }
   }
   ```

### Tipos TypeScript (`types.ts`)
```typescript
export interface Product {
  id: string;
  storeId: string;
  name: string;
  costUSD: number;
  margin: number;
  commissionRate?: number;
  createdBy?: string; // Nuevo campo: ID del usuario que creó el producto
}
```

### Documentación
- **OpenSpec**: `openspec/changes/add-product-name-unique-by-manager/`
  - `proposal.md`: Propuesta del cambio
  - `tasks.md`: Lista de tareas implementadas
  - `specs/manager/spec.md`: Especificación detallada
- **Guía del Producto**: `conductor/product.md`
  - Sección 6: Business Rules
  - 6.1 Product Management: Unique Product Name per Manager

## Mensajes de Error
- **Crear duplicado**: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."
- **Editar a duplicado**: "Ya tienes un producto con ese nombre."

## Reglas de Negocio

### Permitido
✅ Manager A crea "Camisa Azul"
✅ Manager B crea "Camisa Azul" (mismo nombre, diferente manager)
✅ Manager A edita "Pantalón Rojo" a "Pantalón Azul" (nombre único para ese manager)

### No Permitido
❌ Manager A crea "Camisa Azul" y luego intenta crear otro "Camisa Azul"
❌ Manager A edita "Pantalón Rojo" a "Camisa Azul" (ya existe para ese manager)

## Consideraciones Técnicas
- Validación en el servidor (no en el frontend) por seguridad
- Uso de código HTTP 409 (Conflict) para nombres duplicados
- Compatibilidad con versiones anteriores (productos existentes con `createdBy` = null)
- Índice compuesto para optimizar el rendimiento de las consultas de validación
