# DISEÑO DE APLICACIÓN WEB MULTI-TENANT: GESTIÓN DE VENTAS

## CONTEXTO
Sistema multi-tenant para gestión de ventas con jerarquía Admin → Manager → Gestor,
inventario asignado y proceso de cierres (consolidación de ventas).

## REGLAS DE NEGOCIO (SIMPLIFICADAS)
- **Moneda**: Única moneda nacional (MN)
- **Tipo de cambio**: Factor X (USD→MN) GLOBAL por tienda, variable en el tiempo
- **Historial de ventas**: Cada venta congela el tipo de cambio X utilizado (no retroactivo)
- **Precios**: Gestores no pueden aplicar descuentos (precio fijo)
- **Comisión**: Configurable por Manager (10% por defecto) sobre precio MN base
- **Flujo de dinero**: Gestores solo entregan dinero mediante proceso de cierre
- **Devoluciones**: No permitidas (fase 1)

## CÁLCULOS POR PRODUCTO
### Configuración por Manager:
- compra_usd (costo en USD)
- margen_pct (porcentaje de ganancia)

### Cálculos automáticos (con X vigente):
- venta_usd = compra_usd × (1 + margen_pct)
- mn_base = venta_usd × X
- comision = mn_base × (porcentaje configurado por manager)
- mn_final = mn_base + comision

## ROLES Y RESPONSABILIDADES

### ADMINISTRADOR
- ✅ Crear tiendas
- ✅ Asignar directores a tiendas (uno o ninguno por tienda)
- ✅ Asignar managers a tiendas (múltiples por tienda)
- ✅ CRUD de tiendas, directores y managers (incluyendo gestión de contraseñas)
- ❌ No accede a datos de inventario, ventas o cierres.
- ✅ Auditoría de todas las operaciones del sistema

### DIRECTOR (por tienda)
- ✅ Rol opcional, uno por tienda.
- ✅ Asignado por el Administrador.
- ✅ Gestión de managers de su tienda (crear/eliminar, gestión de contraseñas).
- ✅ Visualización de reportes totales de su tienda (inventario, ventas, etc.).
- ✅ CRUD productos (compra_usd, margen_pct)
- ✅ Configuración de tipo de cambio X (histórico con vigencia)
- ✅ Gestión de stock inicial por producto
- ✅ Asignación de inventario cuantificado a gestores
- ✅ Visualización de cierres pendientes (ver cuánto dinero traerá cada gestor)
- ✅ Validación de cierres (marcar como "recibido" cuando gestor entrega dinero físico)
- ✅ Auditoría de operaciones en su tienda

### MANAGER (por tienda)
- ✅ Si no hay Director en la tienda, es gestionado por el Administrador.
- ✅ Si hay Director, es gestionado por el Director.
- ✅ Gestión de gestores (crear/eliminar)
- ✅ Solo puede gestionar su propio stock asignado, no el inventario total de la tienda.
- ✅ Visualización de cierres pendientes de sus gestores.
- ✅ Validación de cierres de sus gestores.
- ✅ Reportes de sus gestores.
- ✅ Auditoría de operaciones de sus gestores.

### GESTOR
- ✅ Visualizar inventario asignado y precios MN
- ✅ Registrar ventas (reducir inventario)
- ✅ Ejecutar cierre:
  - Sistema muestra resumen (artículos vendidos vs total recaudado, comisión calculada)
  - Gestor verifica y confirma ejecución
  - Sistema actualiza datos del manager (existencia de productos)
- ✅ Acceso limitado a auditoría de sus propias operaciones

## CARACTERÍSTICAS IMPLEMENTADAS

### 1. Soporte para múltiples managers por tienda
- Sistema de relación muchos a muchos entre managers y tiendas
- Los managers pueden tener acceso a múltiples tiendas
- Cada tienda puede tener uno o más managers asignados

### 2. Gestión de inventario cuantificado
- Sistema de stock inicial por producto y tienda
- Asignación de cantidades específicas de productos a gestores
- Control de disponibilidad y asignación de inventario

### 3. Sistema de auditoría completo
- Registro de todas las operaciones del sistema
- Seguimiento de quién hizo qué, cuándo y en qué contexto
- Visualización de auditoría por rol y nivel de acceso

### 4. Seguridad y autenticación
- Autenticación basada en JWT tokens
- Control de acceso por roles y permisos
- Protección contra acceso no autorizado a recursos

### 5. API REST segura
- Endpoints protegidos por autenticación
- Control de acceso basado en roles
- Validación de permisos por operación

### 6. Gestión completa de tiendas y usuarios
- **Administrador**: Puede crear, editar y eliminar tiendas y usuarios (directores, managers, gestores)
- **Administrador**: Puede gestionar contraseñas de todos los usuarios
- **Director**: Puede gestionar (crear, editar, eliminar) managers de su tienda
- **Director**: Puede gestionar contraseñas de los managers de su tienda
- **Menú lateral**: Navegación específica por rol (Tiendas, Usuarios para Admin; Managers para Director)

## FLUJO DE CIERRE DETALLADO
1. **Gestor ejecuta cierre** → sistema muestra resumen con:
   - Listado de artículos vendidos
   - Total recaudado (mn_final)
   - Comisión calculada (10% configurable)
   - Monto a entregar al manager (mn_base)
2. **Gestor verifica y confirma** → cierre se ejecuta y se actualizan:
   - Datos del manager (existencia de productos)
   - Estado del cierre (pendiente)
3. **Manager ve cierre pendiente** → conoce monto a recibir
4. **Gestor entrega dinero físico** → manager marca cierre como "recibido"

## ENTREGABLES REQUERIDOS

### 1. Requerimientos
- Funcionales por rol
- No funcionales (RBAC, auditoría, trazabilidad)

### 2. Modelo de Datos
- Tablas, campos mínimos, relaciones, índices

### 3. Reglas de Cierre
- Lógica exacta del proceso de cuadre

### 4. API REST
- Endpoints sugeridos + payloads de ejemplo

### 5. UI/UX
- Pantallas mínimas del flujo

## EJEMPLO NUMÉRICO
Producto: compra_usd = $10, margen = 30%, X = 300 MN/USD
- Venta USD: $10 × 1.30 = $13
- Precio MN base: $13 × 300 = 3,900 MN
- Comisión: 3,900 × 0.10 = 390 MN
- Precio final: 3,900 + 390 = 4,290 MN
