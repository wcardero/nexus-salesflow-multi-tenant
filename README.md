# DISEÑO DE APLICACIÓN WEB MULTI-TENANT: GESTIÓN DE VENTAS

## CONTEXTO
Sistema multi-tenant para gestión de ventas con jerarquía Admin → Manager → Gestor,
inventario asignado y proceso de cierres (consolidación de ventas).

## REGLAS DE NEGOCIO (SIMPLIFICADAS)
- **Moneda**: Única moneda nacional (MN)
- **Tipo de cambio**: Factor X (USD→MN) GLOBAL por tienda, variable en el tiempo, **PERSISTENTE**
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

### 7. Gestión de tipo de cambio persistente
- **Persistencia en base de datos**: Los cambios de tipo de cambio se guardan en la base de datos
- **Endpoint API**: `POST /api/exchange-rates` permite a Managers y Directores configurar tipos de cambio
- **Historial**: Se mantiene un historial completo de tipos de cambio por tienda (con fechas de vigencia)
- **Auditoría**: Todos los cambios de tipo de cambio se registran en el log de auditoría
- **Validación**: Solo Managers y Directores pueden cambiar tipos de cambio para sus tiendas

### 8. Restricciones de edición/eliminación de productos
- **Validación por asignación**: Los productos solo pueden editarse o eliminarse si NO están asignados a ningún gestor
- **Stock inicial NO cuenta**: Productos en `ProductStock` pueden editarse/eliminarse (no están asignados)
- **Asignación a gestor**: Solo `AssignedInventory` bloquea edición/eliminación
- **Validación en frontend**: Botones de editar/eliminar deshabilitados para productos asignados
- **Validación en backend**: Endpoints `PUT /api/products/:id` y `DELETE /api/products/:id` validan asignación
- **Mensaje de error**: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- **Indicador visual**: Badge "Asignado a gestor" en productos que tienen asignación activa

### 9. Edición y eliminación de stock inicial
- **Corrección de errores**: Permite editar el stock inicial si se cometió un error (ej: 100 jabones en vez de 90 jamones)
- **Validación por asignación**: El stock de un producto solo puede editarse/eliminarse si el producto NO está asignado a ningún gestor
- **Endpoint DELETE**: `DELETE /api/product-stock/:stockId` permite eliminar registros de stock
- **Indicador visual**: Badge "Asignado a gestor" en registros de stock que tienen asignación activa
- **Validación en frontend**: Botones de Editar/Eliminar deshabilitados para stock de productos asignados
- **Validación en backend**: Endpoint DELETE verifica `AssignedInventory` antes de permitir eliminación
- **Modal de edición**: Permite cambiar la cantidad de stock directamente desde la tabla

### 10. Edición y eliminación de gestores
- **Corrección de errores**: Permite editar el nombre de un gestor o cambiar su contraseña
- **Validación por asignación**: Los gestores solo pueden editarse/eliminarse si NO tienen inventario asignado
- **Eliminación**: Permite eliminar gestores que ya no trabajan en la tienda
- **Indicador visual**: Badge "Tiene inventario asignado" en gestores que tienen asignación activa
- **Validación en frontend**: Botones de Editar/Eliminar deshabilitados para gestores con inventario
- **Modal de edición**: Permite cambiar el nombre y opcionalmente la contraseña
- **Mensaje de error**: "El gestor no puede ser editado ni eliminado porque tiene inventario asignado."

### 11. Validación de asignación de inventario
- **Validación completa**: Todos los campos deben estar llenos antes de asignar inventario
- **Producto requerido**: Mensaje de error si no se selecciona un producto
- **Gestor requerido**: Mensaje de error si no se selecciona un gestor
- **Cantidad válida**: Mensaje de error si la cantidad es menor a 1
- **Mensajes detallados**: Cada campo con error se muestra en una línea separada

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

## PERMISOS DE USUARIOS

### Creación de Usuarios
| Rol que crea | Admin | Director | Manager | Gestor | Requisitos |
|---------------|--------|-----------|----------|---------|-------------|
| **Admin** | ❌ (solo primero) | ✅ | ✅ | ❌ | Manager/Director deben tener tienda asignada |
| **Director** | ❌ | ❌ | ✅ (su tienda) | ❌ | Manager se asigna automáticamente a tienda del Director |
| **Manager** | ❌ | ❌ | ❌ | ✅ (su tienda) | Gestor se asigna automáticamente a tienda del Manager |
| **Gestor** | ❌ | ❌ | ❌ | ❌ | No puede crear usuarios |

### Edición de Usuarios
| Rol | Puede editar | Restricciones |
|------|--------------|----------------|
| **Admin** | Nombre, Rol (otros), Tienda (otros) | No puede cambiar su propio rol |
| **Admin** | | No puede asignarse tienda |
| **Director** | Nombre | No puede cambiar rol ni tienda |
| **Manager** | Nombre | No puede cambiar rol ni tienda |
| **Gestor** | Nombre | No puede cambiar rol ni tienda |

### Gestión de Contraseñas
- **Admin**: Puede cambiar contraseña de cualquier usuario
- **Director**: Puede cambiar contraseña de Managers de su tienda
- **Manager**: Asigna contraseña al crear Gestores
- **Usuarios**: Pueden cambiar su propia contraseña requiriendo la actual

### Eliminación de Usuarios
- **Admin**: Puede eliminar cualquier usuario excepto a sí mismo
- **Director**: Puede eliminar Managers de su tienda
- **Manager**: Puede eliminar Gestores de su tienda
- **Gestor**: No puede eliminar usuarios
- El botón de "Eliminar" está oculto para el admin que se edita a sí mismo

## INFRAESTRURA DEL PROYECTO

### Tecnologías
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Base de datos**: PostgreSQL

### Componentes Principales
- `hooks/useApi.ts`: Hook centralizado para llamadas a la API
- `views/UserManagement.tsx`: Gestión de usuarios (Admin)
- `views/ManagerDashboard.tsx`: Panel del Manager
- `views/DirectorDashboard.tsx`: Panel del Director
- `views/GestorDashboard.tsx`: Panel del Gestor

### Variables de Entorno
- `API_URL`: URL de la API backend (por defecto: `http://localhost:3001`)
- Configurado en `vite.config.ts` y `.env`

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

---

## OPTIMIZACIONES RECIENTES (Commit: dc1a185)

### Limpieza de Proyecto
- Eliminado directorio `coverage/` (~150MB de reportes de tests)
- Eliminado directorio `Prototype de disenno/` (~5-10MB de prototipos)
- Actualizado `.gitignore` para prevenir inclusión futura de estos archivos

### Backend - Seguridad y Permisos
- **Endpoint `PUT /api/users/:id`**: Crear y editar usuarios con validaciones:
  - Solo admins pueden actualizar usuarios
  - El admin no puede cambiar su propio rol ni asignarse tienda
  - Protección contra creación múltiple de admins
- **Endpoint `PUT /api/users/:id/password`**: Corregido para permitir cambio sin `oldPassword`:
  - Admins pueden cambiar contraseña de cualquier usuario
  - Usuarios deben proporcionar su contraseña actual para cambiarla
  - Acepta tanto `password` como `newPassword` en el body
- **Permisos de creación**:
  - Admin: Puede crear Directores y Managers (requieren tienda)
  - Director: Puede crear Managers (asignados a su tienda)
  - Manager: Puede crear Gestores (asignados a su tienda)
  - Gestor: No puede crear usuarios
- **Validaciones**:
  - Manager debe tener tienda asignada para crear Gestores
  - Director debe tener tienda asignada para crear Managers
  - Mensajes de error claros en español

### Frontend - Mejoras de UX
- **Ocultar campos sensibles**:
  - Campo "Rol" oculto cuando admin se edita a sí mismo
  - Campo "Tienda" oculto cuando admin se edita a sí mismo
  - Botón "Eliminar" oculto para el admin que se edita a sí mismo
- **Clarificación de etiquetas**: "Nombre" → "Nombre de usuario"
- **Actualización de caché**: El usuario actual se actualiza con datos frescos del servidor en cada `refreshDb()`
- **ManagerDashboard**: Gestores se crean vía API con contraseña asignada

### Infraestructura
- **Hook `useApi.ts`**: Centraliza todas las llamadas a la API (GET, POST, PUT, DELETE)
- **Variables de entorno**: URL de API configurada en `vite.config.ts` con valor de `.env`

### Estado del Proyecto
- **Tamaño reducido**: De ~205MB a ~150MB después de limpiar archivos innecesarios
- **TypeScript**: Sin errores en frontend ni backend
- **Build**: Exitoso en ambos proyectos
