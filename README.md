# Nexus SalesFlow

Sistema multi-tenant de gestión de ventas con jerarquía de roles, control de inventario, seguimiento de deudas y cierre de caja automatizado.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss)
![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Instalación con Docker (Opcional)](#instalación-con-docker-opcional)
- [Configuración](#configuración)
- [Uso](#uso)
- [Flujos de Negocio](#flujos-de-negocio)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Desarrollo](#desarrollo)
- [Despliegue en Producción](#despliegue-en-producción)
- [Estructura del Proyecto](#estructura-del-proyecto)

## 🎯 Descripción

Nexus SalesFlow es una plataforma completa para gestionar ventas en múltiples tiendas (multi-tenant) con:

- **Jerarquía de 4 roles**: Admin → Director → Manager → Gestor
- **Control de inventario**: Asignación, confirmación y seguimiento
- **Ventas al contado y crédito**: Con seguimiento de deudas
- **Cierre de caja**: Automatizado con cálculos de comisiones y fecha contable precisa
- **Tipo de cambio persistente**: Historial de cambios por tienda
- **Auditoría completa**: Registro de todas las operaciones
- **Integridad Contable**: Sistema blindado contra desfases de zona horaria (UTC)
- **Exportación de reportes**: CSV, PDF y Excel

## ✨ Características

### Gestión Multi-Tenant
- Múltiples tiendas independientes
- Múltiples managers por tienda
- Aislamiento completo de datos por tienda

### Roles y Permisos

#### 🛡️ Administrador
- ✅ Crear y gestionar tiendas
- ✅ Crear Directores y Managers
- ✅ Asignar roles y permisos
- ✅ Auditoría global del sistema
- ❌ No accede a inventario, ventas o cierres

#### 👔 Director (Rol Opcional)
- ✅ Gestión de managers de su tienda
- ✅ CRUD de productos (costo USD/MN, margen)
- ✅ Configuración de tipo de cambio
- ✅ Gestión de stock inicial por producto
- ✅ Asignación de inventario a gestores
- ✅ Confirmación de pagos de cierres
- ✅ Reportes de su tienda

#### 👨‍💼 Manager
- ✅ Gestión de gestores
- ✅ Gestión de inventario asignado (no stock total)
- ✅ Configuración de tipo de cambio (si no hay Director)
- ✅ Gestión de productos (si no hay Director)
- ✅ Confirmación de cierres pendientes
- ✅ Resolución de conflictos de inventario
- ✅ Reportes de sus gestores

#### 💼 Gestor
- ✅ Confirmación/rechazo de inventario asignado
- ✅ Ventas al contado y crédito
- ✅ Gestión de deudas pendientes
- ✅ Eliminación de ventas antes de cierre
- ✅ Ejecución de cierres de caja
- ✅ Consulta de inventario disponible

### Inventario y Productos
- **Productos con moneda dual**: Costo en USD o MN
- **Margen configurable**: Porcentaje de ganancia por producto
- **Comisión variable**: Configurable por producto (usa default de tienda si no se especifica)
- **Stock inicial**: Gestión de inventario por tienda y producto
- **Asignación cuantificada**: Asignar cantidades específicas a gestores
- **Flujo de aprobación**: Manager asigna → Gestor confirma/rechaza
- **Conflictos de inventario**: Gestión automática de rechazos

### Ventas y Pagos
- **Ventas al contado**: Pago inmediato (PAID)
- **Ventas al crédito**: Registro de deuda (PENDING) con nombre del cliente
- **Seguimiento de deudas**: Tabla "Deudas Pendientes" para créditos
- **Pago de deudas**: Los gestores pueden registrar pagos de ventas al crédito
- **Cálculo automático**: Precio base + comisión según tipo de cambio

### Cierre de Caja
- **Ejecución de cierre**: Gestor agrupa ventas y genera resumen
- **Cálculos automáticos**: Total base MN, total comisión, total final MN
- **Fecha Contable**: Se registra la fecha local del negocio, independiente de la hora del servidor
- **Estado del cierre**: PENDING (esperando dinero) → COMPLETED (dinero recibido)
- **Confirmación de recepción**: Manager marca cuando recibe dinero físico
- **Historial completo**: Todos los cierres con sus ventas asociadas

### Tipo de Cambio
- **Persistente en base de datos**: Los cambios se guardan permanentemente
- **Historial por tienda**: Registro de todos los cambios con fechas de vigencia
- **Cálculo de precios**: Venta USD × Tipo de cambio = Precio MN
- **Congelado por venta**: Cada venta guarda el tipo de cambio usado (no retroactivo)

### Auditoría y Seguridad
- **Registro completo**: Toda operación se guarda en `AuditLog`
- **Trazabilidad**: Quién, cuándo, qué acción, entidad afectada
- **Valores old/new**: Compara estados antes y después
- **Filtros por rol**: Cada rol ve su auditoría correspondiente

### Exportación de Reportes
- **Formatos**: CSV, PDF, Excel
- **Filtros por fecha**: Selector de rango de fechas
- **Múltiples vistas**: Ventas, cierres, métricas por gestor
- **Columnas personalizadas**: Periodo, tienda, gestor, montos calculados

## 🏗️ Arquitectura

```
nexus-salesflow-multi-tenant/
├── frontend/                 # React + Vite + Tailwind
│   ├── views/               # Componentes de vista por rol
│   │   ├── Login.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── DirectorDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   └── GestorDashboard.tsx
│   ├── components/          # Componentes reutilizables
│   │   ├── Layout.tsx
│   │   ├── SellModal.tsx
│   │   ├── ExportButton.tsx
│   │   ├── DateRangeSelector.tsx
│   │   └── ReportCard.tsx
│   ├── hooks/               # Custom hooks
│   │   └── useApi.ts       # Hook centralizado de API
│   ├── App.tsx              # Componente principal
│   ├── types.ts             # Definiciones TypeScript
│   ├── utils.ts             # Utilidades de cálculo
│   ├── exportUtils.ts       # Exportación de reportes
│   └── dateUtils.ts         # Utilidades de fecha
│
└── backend/                 # Express + TypeScript + PostgreSQL
    ├── src/
    │   ├── index.ts         # API principal y endpoints
    │   ├── db.ts           # Conexión a PostgreSQL
    │   ├── auth.ts         # Autenticación JWT
    │   ├── middleware.ts   # Middlewares de seguridad
    │   ├── types.ts        # Tipos TypeScript
    │   ├── inventory.ts    # Lógica de inventario
    │   ├── sales.ts        # Lógica de ventas
    │   └── init-db.ts     # Inicialización de BD
    ├── migrations/          # Migraciones de base de datos
    ├── package.json
    ├── Dockerfile         # Docker de desarrollo
    └── Dockerfile.prod    # Docker de producción (multi-stage)

├── Dockerfile.prod        # Frontend production build con nginx
├── nginx.conf             # Configuración de nginx
├── docker-compose.prod.yml # Orquestación de producción
└── .github/workflows/
    └── deploy.yml          # CI/CD pipeline (GitHub Actions)
```

### Tecnologías

| Frontend | Backend | Base de Datos |
|-----------|---------|---------------|
| React 19.2 | Express 5.2 | PostgreSQL |
| TypeScript 5.8 | TypeScript 5.9 | pg 8.16 |
| Vite 6.2 | JWT 9.0 | - |
| Tailwind CSS 4.1 | bcrypt 5.0 | - |
| jsPDF 4.0 | express-validator 7.3 | - |


### 🔐 Flujo Seguro para Nuevos Desarrolladores

#### Requisitos Previos de Seguridad
- ✅ Cuenta con un gestor de contraseñas (1Password, Bitwarden, Vault)
- ✅ Tiene acceso a los secretos del proyecto (solicitar al lead developer)
- ✅ Conoce las políticas de seguridad de la organización

#### Paso 1: Solicitar Accesos
```bash
# Contactar al lead developer para obtener:
# 1. URL del repositorio (si es privado)
# 2. Secretos de producción (via canal seguro)
# 3. Acceso a la base de datos de desarrollo
```

#### Paso 2: Generar Secretos Locales
```bash
# Generar JWT_SECRET seguro (64 caracteres aleatorios)
openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64

# Generar DATABASE_URL para desarrollo local
# Formato: postgresql://usuario:password@localhost:5432/nexusdb
```

#### Paso 3: Configurar Archivos .env
```bash
# ✅ COPIAR archivos de ejemplo
cp .env.example .env
cp backend/.env.example backend/.env

# ✅ EDITAR con valores reales (no compartir estos archivos)
# ⚠️ NUNCA committiar archivos .env al repositorio
```

#### Paso 4: Verificar Configuración de Seguridad
```bash
# Verificar que .env está en .gitignore
cat .gitignore | grep -E "^\.env"

# Verificar que JWT_SECRET no es el valor por defecto
grep "JWT_SECRET" backend/.env | grep -v "tu_secreto"
```

#### Paso 5: Configurar Base de Datos Local
```bash
# Crear usuario y base de datos PostgreSQL
sudo -u postgres createuser -s nexus_dev
sudo -u postgres createdb nexusdb
sudo -u postgres psql -c "ALTER USER nexus_dev PASSWORD 'tu_password_seguro';"

# Ejecutar script de inicialización
cd backend && npx ts-node src/init-db.ts
```

#### ✅ Checklist de Seguridad para Pull Requests
- [ ] No hay URLs de producción en el código
- [ ] No hay IPs hardcodeadas
- [ ] No hay credenciales en comentarios
- [ ] Las variables de entorno usan `process.env.VARIABLE`
- [ ] Los mensajes de error no revelan información sensible

#### ⚠️ Reglas de Oro
1. **NUNCA** committiar archivos `.env`
2. **NUNCA** compartir tokens en Slack/mensajería
3. **NUNCA** hacer push de secretos a Git
4. **SIEMPRE** usar HTTPS en producción
5. **SIEMPRE** rotar secretos si hay sospecha de compromiso

#### 📚 Recursos de Seguridad
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## 🚀 Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/wcardero/nexus-salesflow-multi-tenant.git
cd nexus-salesflow-multi-tenant
```

### 2. Configurar base de datos

```bash
# Crear base de datos
createdb nexusdb

# Ejecutar script de inicialización
cd backend
npx ts-node src/init-db.ts
```

### 3. Configurar variables de entorno

Crear `.env` en la raíz:
```bash
# Frontend
VITE_API_URL=http://localhost:3001
VITE_PORT=3000
```

Crear `.env` en `/backend`:
```bash
# Backend
DATABASE_URL=postgresql://tu_usuario:tu_password_seguro@localhost:5432/nexusdb
JWT_SECRET=tu_secreto_super_seguro
PORT=3001
```

### 4. Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
```

### 5. Iniciar el proyecto

```bash
# Terminal 1: Iniciar backend
cd backend
npm run dev

# Terminal 2: Iniciar frontend
cd ..
npm run dev
```

El frontend estará disponible en `http://localhost:3000`
El backend estará disponible en `http://localhost:3001`

## 🐳 Instalación con Docker (Opcional)

Si prefieres no instalar PostgreSQL localmente, puedes usar Docker para la base de datos:

### Configurar PostgreSQL con Docker

```bash
# 1. Crear archivo de configuración de Docker
cp docker.env.example backend/docker.env

# 2. Editar backend/docker.env con tus credenciales
# POSTGRES_USER=tu_usuario
# POSTGRES_PASSWORD=tu_password_seguro
# POSTGRES_DB=nexusdb

# 3. Levantar base de datos
docker-compose up -d postgres

# 4. Verificar que está corriendo
docker ps
```

### Configurar variables de entorno con Docker

En `backend/.env`, actualiza la conexión a PostgreSQL:

```bash
# DATABASE_URL debe apuntar al contenedor Docker
DATABASE_URL=postgresql://tu_usuario:tu_password_seguro@localhost:5432/nexusdb
```

### Verificar conexión a base de datos

```bash
# Probar conexión desde el contenedor
docker exec -it nexus-sales-db psql -U tu_usuario_db -d nexusdb -c "\dt"

# Ejecutar script de inicialización
cd backend
npx ts-node src/init-db.ts
```

### Notas Importantes

- El puerto 5432 está expuesto para desarrollo (puedes conectarte desde herramientas locales como pgAdmin)
- Los datos persisten en volumen Docker: `postgres_data`
- Para detener la base de datos: `docker-compose stop postgres`
- Para eliminar base de datos y datos: `docker-compose down -v`

## ⚙️ Configuración

### Primer Usuario (Admin)
1. Accede a `http://localhost:3000`
2. El sistema detectará que no hay usuarios
3. Crea el primer usuario con rol **Admin**
4. Desde el admin podrás crear tiendas y otros usuarios

### Crear Tienda
1. Inicia sesión como Admin
2. Ve a "Tiendas" → "Crear Tienda"
3. Ingresa el nombre y comisión por defecto (ej: 10%)

### Crear Usuarios
1. **Director**: Admin crea y asigna a tienda
2. **Manager**: Admin/Director crea y asigna a tienda
3. **Gestor**: Manager crea (asignado automáticamente a su tienda)

## 📖 Uso

### Flujo Completo de Ventas

#### 1. Configuración Inicial
```
Admin → Crea tienda → Crea Director/Manager
Director/Manager → Configura tipo de cambio → Crea productos
Director/Manager → Define stock inicial → Asigna inventario a gestores
```

#### 2. Ciclo de Ventas
```
Manager: Asigna inventario → Estado: Pending
Gestor: Confrece inventario → Estado: Confirmed
Gestor: Vende productos (contado/crédito)
Gestor: Ejecuta cierre → Estado: PENDING
Gestor: Entrega dinero físico
Manager: Confirma recepción → Estado: COMPLETED
```

### Gestión de Inventario

#### Asignar Inventario a Gestor
1. Manager va a "Asignar Inventario"
2. Selecciona producto y gestor
3. Define cantidad
4. Sistema valida disponibilidad
5. Gestor recibe notificación

#### Gestor Confirma/Rechaza
1. Gestor ve inventario pendiente
2. Compara con inventario físico
3. **Confirma** → Inventario disponible para ventas
4. **Rechaza** → Crea conflicto que Manager debe resolver

### Ventas

#### Venta al Contado
1. Gestor selecciona producto
2. Ingresas cantidad
3. Selecciona "Pago al contado"
4. Sistema calcula: Precio base + Comisión = Precio final
5. Venta se registra inmediatamente

#### Venta al Crédito
1. Gestor selecciona producto
2. Ingresas cantidad
3. Selecciona "Venta al crédito"
4. Ingresas nombre y apellidos del cliente
5. Venta se registra como PENDING (deuda)
6. Aparece en tab "Deudas Pendientes"

#### Pagar Deuda
1. Gestor va a "Deudas Pendientes"
2. Busca venta al crédito
3. Clic en "Marcar como pagada"
4. Sistema actualiza estado a PAID

### Cierre de Caja

#### Ejecutar Cierre
1. Gestor va a "Cierres Pendientes"
2. Clic en "Ejecutar Cierre"
3. Sistema muestra resumen:
   - Productos vendidos
   - Total base MN (sin comisión)
   - Total comisión (10% configurable)
   - Total final MN (base + comisión)
4. Gestor confirma
5. Cierre se crea con estado PENDING

#### Confirmar Recepción
1. Manager ve cierres PENDING
2. Gestor entrega dinero físico
3. Manager hace clic en "Validar Cierre"
4. Sistema cambia estado a COMPLETED
5. Dinero se registra como recibido

## 🔄 Flujos de Negocio

### Gestión de Tipo de Cambio

```
1. Director/Manager va a "Tipo de Cambio"
2. Ingresas nuevo valor (ej: 300)
3. Selecciona fecha de inicio
4. Sistema guarda en historial
5. Precio MN = Costo USD × (1 + Margen) × Tipo de Cambio
```

**Historial de Cambios:**
- Cada cambio queda registrado en `ExchangeRate`
- Productos guardan el tipo de cambio al momento de la venta
- No hay efectos retroactivos

### Conflictos de Inventario

```
Gestor: "Este inventario no coincide" → Rechaza
↓
Sistema: Crea conflicto en InventoryConflict
↓
Manager: Ve conflicto pendiente
↓
Manager: Acciones disponibles:
  - Reasignar: Actualizar cantidad y poner Pending
  - Cancelar: Eliminar asignación completamente
↓
Sistema: Conflicto pasa a "Resolved"
```

### Auditoría

**Registro Automático:**
- Creación/edición/eliminación de usuarios
- Cambios de contraseñas
- Asignación de inventario
- Ventas y cierres
- Cambios de tipo de cambio

**Visualización:**
- Admin: Ve toda la auditoría
- Director: Auditoría de su tienda
- Manager: Auditoría de sus gestores
- Gestor: Auditoría de sus propias operaciones

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/login` | Iniciar sesión | ❌ |
| GET | `/api/users/exists` | Verificar si existen usuarios | ❌ |

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Listar usuarios | ✅ |
| POST | `/api/users` | Crear usuario | ✅* |
| PUT | `/api/users/:id` | Editar usuario | ✅ |
| DELETE | `/api/users/:id` | Eliminar usuario | ✅ |
| PUT | `/api/users/:id/password` | Cambiar contraseña | ✅ |

*Primer admin sin autenticación

### Tiendas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/stores` | Listar tiendas | ✅ |
| GET | `/api/stores/public` | Listar tiendas públicas | ❌ |
| POST | `/api/stores` | Crear tienda | ✅ |
| PUT | `/api/stores/:id` | Editar tienda | ✅ |
| DELETE | `/api/stores/:id` | Eliminar tienda | ✅ |

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Listar productos | ✅ |
| POST | `/api/products` | Crear producto | ✅ |
| PUT | `/api/products/:id` | Editar producto | ✅ |
| DELETE | `/api/products/:id` | Eliminar producto | ✅ |

### Inventario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventory` | Listar inventario | ✅ |
| GET | `/api/product-stock` | Listar stock inicial | ✅ |
| POST | `/api/product-stock` | Crear stock inicial | ✅ |
| PUT | `/api/product-stock/:id` | Editar stock | ✅ |
| DELETE | `/api/product-stock/:id` | Eliminar stock | ✅ |
| GET | `/api/assigned-inventory` | Listar asignaciones | ✅ |
| POST | `/api/assigned-inventory` | Asignar inventario | ✅ |
| POST | `/api/assigned-inventory/:id/confirm` | Confirmar asignación | ✅ |
| POST | `/api/assigned-inventory/:id/reject` | Rechazar asignación | ✅ |

### Ventas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/sales` | Listar ventas | ✅ |
| POST | `/api/sales/batch` | Crear venta en lote | ✅ |
| DELETE | `/api/sales/:id` | Eliminar venta | ✅ |
| POST | `/api/sales/:id/mark-paid` | Marcar venta al crédito como pagada | ✅ |

### Cierres

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/closings` | Listar cierres | ✅ |
| POST | `/api/closings` | Ejecutar cierre | ✅ |
| PATCH | `/api/closings/:id/complete` | Validar cierre | ✅ |

### Conflictos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventory-conflicts` | Listar conflictos | ✅ |
| POST | `/api/inventory-conflicts/:id/resolve` | Resolver conflicto | ✅ |

### Tipo de Cambio

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/exchange-rates` | Crear tipo de cambio | ✅ |

### Auditoría

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/audit-logs` | Listar auditoría | ✅ |

### Reportes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/director/metrics` | Métricas de director | ✅ |

## 🗄️ Base de Datos

### Tablas Principales

#### User
```sql
- id (TEXT PK)
- name (TEXT)
- password (TEXT) - bcrypt hash
- role (ENUM: Admin, Director, Manager, Gestor)
- storeId (TEXT FK) - NULL para Admin
- createdBy (TEXT FK) - Quién creó el usuario
```

#### Store
```sql
- id (TEXT PK)
- name (TEXT UNIQUE)
- defaultCommissionRate (DOUBLE PRECISION)
- directorId (TEXT FK) - Director asignado (opcional)
```

#### Product
```sql
- id (TEXT PK)
- name (TEXT)
- costUSD (DOUBLE PRECISION)
- costMN (DOUBLE PRECISION)
- margin (DOUBLE PRECISION)
- currency (ENUM: USD, MN)
- priceMN (DOUBLE PRECISION) - Calculado
- gestorCommissionMN (DOUBLE PRECISION) - Calculado
- commissionRate (DOUBLE PRECISION) - Específico del producto
- storeId (TEXT FK)
- createdBy (TEXT FK)
```

#### ProductStock
```sql
- id (TEXT PK)
- productId (TEXT FK)
- storeId (TEXT FK)
- quantity (INTEGER)
```

#### AssignedInventory
```sql
- id (TEXT PK)
- productId (TEXT FK)
- gestorId (TEXT FK)
- quantity (INTEGER)
- assignedAt (TIMESTAMP)
- status (ENUM: Pending, Confirmed, Rejected)
- confirmedAt (TIMESTAMP)
- rejectionReason (TEXT)
- priceMN (DOUBLE PRECISION)
```

#### Sale
```sql
- id (TEXT PK)
- inventoryItemId (TEXT FK)
- gestorId (TEXT FK)
- productId (TEXT FK)
- soldAt (TIMESTAMP)
- accountingDate (DATE) - Fecha local del negocio
- exchangeRateUsed (DOUBLE PRECISION)
- costUSD (DOUBLE PRECISION)
- costMN (DOUBLE PRECISION)
- margin (DOUBLE PRECISION)
- saleUSD (DOUBLE PRECISION)
- baseMN (DOUBLE PRECISION)
- commission (DOUBLE PRECISION)
- finalMN (DOUBLE PRECISION)
- paymentStatus (ENUM: PAID, PENDING)
- customerName (TEXT)
```

#### Closing
```sql
- id (TEXT PK)
- gestorId (TEXT FK)
- initiatedAt (TIMESTAMP)
- completedAt (TIMESTAMP)
- accountingDate (DATE) - Fecha local del negocio
- status (ENUM: PENDING, COMPLETED)
- totalBaseMN (DOUBLE PRECISION)
- totalCommission (DOUBLE PRECISION)
- totalFinalMN (DOUBLE PRECISION)
```

#### InventoryConflict
```sql
- id (TEXT PK)
- assignedInventoryId (TEXT FK)
- gestorId (TEXT FK)
- managerId (TEXT FK)
- reason (TEXT)
- status (ENUM: Pending, Resolved)
- createdAt (TIMESTAMP)
- resolvedAt (TIMESTAMP)
```

#### AssignedInventory
```sql
- id (TEXT PK)
- productId (TEXT FK)
- gestorId (TEXT FK)
- quantity (INTEGER)
- assignedAt (TIMESTAMP)
- status (ENUM: Pending, Confirmed, Rejected, Archived, Cancelled)
- confirmedAt (TIMESTAMP)
- rejectionReason (TEXT)
- priceMN (DOUBLE PRECISION) - Precio congelado al asignar
```

#### Closing
```sql
- id (TEXT PK)
- gestorId (TEXT FK)
- initiatedAt (TIMESTAMP)
- completedAt (TIMESTAMP)
- status (ENUM: PENDING, COMPLETED)
- totalBaseMN (DOUBLE PRECISION)
- totalCommission (DOUBLE PRECISION)
- totalFinalMN (DOUBLE PRECISION)
```

#### InventoryConflict
```sql
- id (TEXT PK)
- assignedInventoryId (TEXT FK)
- gestorId (TEXT FK)
- managerId (TEXT FK)
- reason (TEXT)
- status (ENUM: Pending, Resolved)
- createdAt (TIMESTAMP)
- resolvedAt (TIMESTAMP)
```

#### ExchangeRate
```sql
- id (TEXT PK)
- rate (DOUBLE PRECISION)
- startDate (TIMESTAMP)
- endDate (TIMESTAMP)
- storeId (TEXT FK)
```

#### AuditLog
```sql
- id (TEXT PK)
- userId (TEXT FK)
- action (TEXT)
- entityType (TEXT)
- entityId (TEXT)
- oldValues (JSONB)
- newValues (JSONB)
- timestamp (TIMESTAMP)
- storeId (TEXT FK)
```

### Relaciones Muchos a Muchos

#### _StoreToUser
```sql
- A (TEXT FK → Store.id)
- B (TEXT FK → User.id)
```
Permite asignar múltiples managers a una tienda.

#### _ClosingToSale
```sql
- A (TEXT FK → Closing.id)
- B (TEXT FK → Sale.id)
```
Relaciona ventas con su cierre correspondiente.

## 🛠️ Desarrollo

### Scripts Disponibles

#### Frontend
```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para producción
npm run preview  # Previsualiza build de producción
npm run test     # Ejecuta tests con Vitest
```

#### Backend
```bash
npm run dev      # Inicia servidor de desarrollo (ts-node-dev)
npm run build    # Compila TypeScript
npm run start    # Ejecuta build compilado
```

### Testing

```bash
# Frontend tests
npm run test

# Backend tests (cuando estén implementados)
cd backend
npm test
```

### Migraciones

Las migraciones de base de datos se encuentran en `/backend/migrations/`:

- `add_inventory_approval_flow.sql` - Flujo de aprobación de inventario
- `add_product_additional_columns.sql` - Columnas adicionales de productos
- `add_createdBy_to_user.sql` - Rastreo de creador de usuarios
- `add_currency_to_product.sql` - Soporte de moneda dual
- `add_commissionRate_to_product.sql` - Comisión específica por producto
- `make_cost_columns_nullable.sql` - Columnas de costo opcionales

Para ejecutar migraciones:

```bash
cd backend
psql -U user -d nexusdb -f migrations/add_inventory_approval_flow.sql
```


## 🚀 Despliegue en Producción

El proyecto utiliza **GitHub Actions + Dokploy** para un despliegue automatizado y seguro. Este enfoque reemplaza el despliegue manual con Docker, eliminando la necesidad de acceso SSH al VPS.

> ✅ **Estado**: El despliegue con GitHub Actions + Dokploy está funcionando correctamente en producción.

### Arquitectura de Despliegue

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   GitHub    │────▶│  GitHub Actions │────▶│   Dokploy    │
│  (código)   │     │   (CI/CD build) │     │   (deploy)   │
└─────────────┘     └─────────────────┘     └──────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────┐
                       │                              │              │
                       ▼                              ▼              ▼
               ┌──────────────┐            ┌──────────────┐  ┌──────────────┐
               │  PostgreSQL  │            │  Backend API │  │   Frontend   │
               │    (DB)      │            │  (Node.js)   │  │   (Nginx)    │
               └──────────────┘            └──────────────┘  └──────────────┘
```

### Flujo de CI/CD

1. **Push a main**: Cada push a la rama `main` activa el pipeline
2. **GitHub Actions**: Construye las imágenes Docker de frontend y backend
3. **Dokploy**: Recibe el webhook y despliega automáticamente en el VPS

### Configuración Inicial (One-time Setup)

#### 1. Configurar Variables en Dokploy UI

En el panel de Dokploy, configura las siguientes variables de entorno:

**Variables para Frontend:**
- `VITE_API_URL`: URL del backend (ej: `https://api.tudominio.com`)
- `VITE_PORT`: `80` (puerto interno de nginx)
- `NODE_ENV`: `production`

**Variables para Backend:**
- `DATABASE_URL`: URL de conexión PostgreSQL
- `JWT_SECRET`: Clave secreta para JWT (generar valor seguro)
- `PORT`: `3001`
- `NODE_ENV`: `production`
- `FRONTEND_URL`: URL del frontend

**Variables para PostgreSQL:**
- `POSTGRES_USER`: Usuario de base de datos
- `POSTGRES_PASSWORD`: Contraseña segura
- `POSTGRES_DB`: `nexusdb`

> ⚠️ **IMPORTANTE**: Las variables se gestionan exclusivamente en Dokploy UI. No se usan archivos `.env` en producción.

#### 2. Configurar Secret en GitHub

En el repositorio de GitHub, ve a **Settings → Secrets and variables → Actions**:

1. Crea un nuevo secret: `DOKPLOY_WEBHOOK_URL`
2. Valor: La URL del webhook proporcionada por Dokploy

> ✅ **Solo necesitas este secret**. Dokploy inyecta todas las demás variables automáticamente.

### Archivos de Producción

| Archivo | Descripción |
|---------|-------------|
| `Dockerfile.prod` (raíz) | Build de frontend con nginx |
| `backend/Dockerfile.prod` | Build de backend multi-stage |
| `nginx.conf` | Configuración de nginx para SPA |
| `docker-compose.prod.yml` | Orquestación de servicios (usa variables de Dokploy) |
| `.github/workflows/deploy.yml` | Pipeline de CI/CD |

### Características del Despliegue

#### ✅ Seguridad
- **Sin acceso SSH necesario**: Todo se maneja vía webhooks
- **Variables en Dokploy UI**: No hay archivos `.env` expuestos
- **Build multi-stage**: Imágenes optimizadas sin código fuente innecesario
- **Tests excluidos**: `tsconfig.json` excluye archivos de test del build

#### ✅ Automatización
- **Deploy automático**: Push a main → build → deploy
- **Sin intervención manual**: No requiere SSH al VPS
- **Rollback automático**: Dokploy mantiene versiones anteriores

#### ✅ Optimización
- **Frontend**: Servido por nginx (estático, rápido)
- **Backend**: Imagen Node.js compilada (TypeScript → JavaScript)
- **PostgreSQL**: Datos persistentes en volumen

### Monitoreo

#### Ver Logs en Dokploy UI

1. Accede al panel de Dokploy
2. Selecciona el servicio (frontend, backend o postgres)
3. Ve a la pestaña "Logs"
4. Visualiza logs en tiempo real

#### Verificar Estado del Despliegue

```bash
# Desde cualquier máquina, verificar endpoints
curl https://api.tudominio.com/api/users/exists
curl https://tudominio.com
```

### Solución de Problemas

#### El deploy no se activa
- Verifica que el secret `DOKPLOY_WEBHOOK_URL` esté configurado
- Revisa los logs de GitHub Actions en la pestaña "Actions"

#### Error de conexión a base de datos
- Verifica que `DATABASE_URL` esté correctamente configurada en Dokploy UI
- Asegúrate de que el servicio PostgreSQL esté corriendo

#### Variables no disponibles
- Las variables deben configurarse en Dokploy UI, NO en archivos `.env`
- Verifica que el servicio tenga las variables asignadas

### Backup y Restore

Dokploy maneja automáticamente los backups de PostgreSQL. Para backups manuales:

```bash
# Backup desde Dokploy UI (Terminal)
pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | psql -U $POSTGRES_USER $POSTGRES_DB
```


## 📁 Estructura del Proyecto

```
nexus-salesflow-multi-tenant/
├── frontend/
│   ├── components/          # Componentes reutilizables
│   │   ├── Layout.tsx       # Layout principal con sidebar
│   │   ├── SellModal.tsx    # Modal de venta
│   │   ├── ExportButton.tsx # Botón de exportación
│   │   ├── DateRangeSelector.tsx
│   │   └── ReportCard.tsx
│   ├── views/               # Vistas por rol
│   │   ├── Login.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── DirectorDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── GestorDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   ├── StoreManagement.tsx
│   │   └── ManagerManagement.tsx
│   ├── hooks/               # Custom hooks
│   │   └── useApi.ts       # Hook centralizado de API
│   ├── utils.ts             # Utilidades de cálculo
│   ├── exportUtils.ts       # Exportación CSV/PDF/Excel
│   ├── dateUtils.ts         # Utilidades de fecha
│   ├── types.ts             # Definiciones TypeScript
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   ├── index.css            # Estilos globales
│   ├── vite.config.ts       # Configuración de Vite
│   ├── tailwind.config.js   # Configuración de Tailwind
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts         # API principal (1000+ líneas)
│   │   ├── db.ts           # Conexión PostgreSQL
│   │   ├── auth.ts         # Autenticación JWT
│   │   ├── middleware.ts   # Middlewares
│   │   ├── types.ts        # Tipos TypeScript
│   │   ├── inventory.ts    # Lógica de inventario
│   │   ├── sales.ts        # Lógica de ventas
│   │   ├── init-db.ts      # Inicialización de BD
│   │   └── store.ts       # (Eliminado - funcionalidad integrada)
│   ├── migrations/         # Scripts de migración
│   ├── db.sql             # Script SQL completo
│   ├── init-db.ts         # Inicializador de BD (TypeScript)
│   ├── Dockerfile         # Docker de desarrollo
│   ├── Dockerfile.prod    # Docker de producción (multi-stage)
│   └── package.json
│
├── .gitignore
├── README.md
├── LICENSE
├── docker-compose.yml        # Docker de desarrollo
├── docker-compose.prod.yml   # Docker de producción
├── Dockerfile.prod           # Frontend production build
├── nginx.conf                # Configuración nginx
├── .github/workflows/
│   └── deploy.yml            # CI/CD pipeline
└── package.json
```

## 🧮 Cálculos

### Precio de Producto

**Para producto en USD:**
```
Venta USD = Costo USD × (1 + Margen)
Precio MN Base = Venta USD × Tipo de Cambio
Comisión = Precio MN Base × Tasa de Comisión
Precio Final = Precio MN Base + Comisión
```

**Para producto en MN:**
```
Precio MN Base = Costo MN × (1 + Margen)
Comisión = Precio MN Base × Tasa de Comisión
Precio Final = Precio MN Base + Comisión
```

### Ejemplo Numérico

Producto: Jabón
- Costo: $10 USD
- Margen: 30%
- Tipo de cambio: 300 MN/USD
- Comisión: 10%

```
Venta USD = $10 × 1.30 = $13
Precio MN Base = $13 × 300 = 3,900 MN
Comisión = 3,900 × 0.10 = 390 MN
Precio Final = 3,900 + 390 = 4,290 MN
```

### Cierre de Caja

```
Total Base MN = Σ (Precio Base de todas las ventas)
Total Comisión = Σ (Comisión de todas las ventas)
Total Final MN = Σ (Precio Final de todas las ventas)

Monto a entregar = Total Base MN
Monto que se queda el gestor = Total Comisión
```

## 🔐 Seguridad

### Autenticación
- JWT tokens con expiración de 24 horas
- Contraseñas hasheadas con bcrypt
- Rate limiting en endpoints sensibles (login)

### Autorización
- Middleware `authenticateToken` en todos los endpoints protegidos
- Validación de roles por endpoint
- Filtrado de datos por tienda y usuario

### Validaciones
- `express-validator` para validación de inputs
- Validaciones en frontend y backend
- Sanitización de datos

### Auditoría
- Registro automático de todas las operaciones críticas
- Traza completa de cambios (oldValues, newValues)
- Índices optimizados para consultas de auditoría

## 📊 Estadísticas y Reportes

### Métricas Disponibles

- Total de ventas por periodo
- Ventas por gestor
- Ventas por producto
- Cierres por periodo
- Ganancias netas
- Comisiones pagadas
- Deudas pendientes

### Filtros

- Rango de fechas
- Por tienda
- Por gestor
- Por producto
- Por estado de pago (contado/crédito)

### Exportación

**Columnas incluidas:**
- Periodo
- Tienda
- Gestor
- Producto
- Fecha de venta
- Cantidad
- Precio base MN
- Comisión
- Precio final MN
- Estado de pago
- Nombre del cliente (si es crédito)

## 🐛 Problemas Conocidos

### Solucionados
- ✅ Gestores no se listaban para Managers - Solucionado: Backend verifica _StoreToUser
- ✅ Error "Access token required" al asignar inventario - Solucionado: Agregado header Authorization
- ✅ Foreign Key Constraint al eliminar usuarios/tiendas - Solucionado: Limpieza en cascada y orden de auditoría
- ✅ Estadísticas en cero para Director - Solucionado: Lógica de búsqueda por Product.storeId y alias camelCase
- ✅ Desfase horario en cierres y ventas - Solucionado: Sistema de Fecha Contable (accountingDate)
- ✅ Cálculo de precios con comisión 0% - Solucionado: Corrección de validación falsy en utils.ts
- ✅ Botones desalineados en Gestor - Solucionado: Flexbox layout y eliminación de márgenes manuales

### Por Monitorear
- Conexión a base de datos en producción
- Performance con grandes volúmenes de datos
- Rate limiting en endpoints de reportes

## 🚀 Roadmap Futuro

### Próximas Versiones
- [ ] Dashboard de métricas en tiempo real
- [ ] Notificaciones push para conflictos y cierres
- [ ] Integración con pasarelas de pago
- [ ] Reportes de tendencias y forecasting
- [ ] Gestión de devoluciones
- [ ] Multi-moneda completa
- [ ] Aplicación móvil para gestores

## 📝 Licencia

Este proyecto está licenciado bajo la **MIT License** - ver el archivo [LICENSE](LICENSE) para más detalles.

Copyright (c) 2026 wcardero

## 👥 Contribuyentes

- [wcardero](https://github.com/wcardero) - Desarrollador principal

## 📧 Contacto

Para reportar issues o solicitar features, por favor crea un issue en el [repositorio de GitHub](https://github.com/wcardero/nexus-salesflow-multi-tenant/issues).

---

**Última actualización:** Febrero 2026
**Versión:** 1.0.0
**Autor:** [wcardero](https://github.com/wcardero)
