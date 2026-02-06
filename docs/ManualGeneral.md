# MANUAL GENERAL - NEXUS SALESFLOW
## Sistema de Gestión de Ventas Multi-Tenant

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Roles del Sistema](#roles-del-sistema)
3. [Acceso al Sistema](#acceso-al-sistema)
4. [Manual del Director](#manual-del-director)
5. [Manual del Manager](#manual-del-manager)
6. [Manual del Gestor](#manual-del-gestor)
7. [Flujo Completo de Ventas](#flujo-completo-de-ventas)
8. [Solución de Problemas](#solución-de-problemas)

---

## INTRODUCCIÓN

**Nexus SalesFlow** es un sistema integral para la gestión de ventas en múltiples tiendas, diseñado para facilitar el control de inventario, seguimiento de deudas y cierre de caja automatizado.

### Características Principales

- **Multi-Tenant**: Múltiples tiendas independientes con datos aislados
- **Jerarquía de Roles**: Estructura clara de permisos
- **Control de Inventario**: Asignación y seguimiento en tiempo real
- **Ventas al Contado y Crédito**: Flexibilidad en métodos de pago
- **Cierre de Caja Automatizado**: Cálculos precisos de comisiones
- **Auditoría Completa**: Registro de todas las operaciones

---

## ROLES DEL SISTEMA

El sistema cuenta con 4 niveles de usuarios:

### 🛡️ Administrador (Admin)
- Crea tiendas y usuarios
- Gestiona la estructura general
- **No participa en operaciones diarias**

### 👔 Director
- Gestiona managers de su tienda
- Supervisa reportes y estadísticas de la tienda
- Confirma pagos de cierres
- Visualiza auditoría de operaciones

### 👨‍💼 Manager
- Gestiona gestores de su tienda
- Crea y administra productos
- Configura tipo de cambio
- Gestiona stock inicial
- Asigna inventario a gestores
- Confirma cierres de caja
- Resuelve conflictos de inventario

### 💼 Gestor
- Recibe y confirma inventario
- Realiza ventas (contado y crédito)
- Gestiona deudas pendientes
- Ejecuta cierres de caja

---

## ACCESO AL SISTEMA

### 1. Iniciar Sesión

1. Abra su navegador web
2. Ingrese la URL proporcionada por su administrador
3. Ingrese su **nombre de usuario** y **contraseña**
4. Haga clic en **"Iniciar Sesión"**

### 2. Selección de Tienda

Si tiene acceso a múltiples tiendas, seleccione la tienda correspondiente antes de continuar.

### 3. Panel Principal

Cada rol verá un panel adaptado a sus funciones específicas.

---

## MANUAL DEL DIRECTOR

### Funciones Principales

#### 1. Gestión de Managers

**Crear un Manager:**
1. Vaya a la sección "Usuarios"
2. Haga clic en "Crear Usuario"
3. Seleccione rol "Manager"
4. Complete los datos:
   - Nombre de usuario
   - Contraseña temporal
   - Tienda asignada
5. Haga clic en "Guardar"

#### 2. Validación de Cierres de Caja

1. Vaya a "Cierres"
2. Revise los cierres pendientes
3. Verifique el monto a recibir (Base MN)
4. Cuente el dinero físico entregado
5. Haga clic en "Validar Cierre"
6. El estado cambia a "COMPLETED"

> **Nota**: Solo valide cuando tenga físicamente el dinero en sus manos.

#### 3. Reportes y Métricas

El Director puede visualizar:
- Ventas totales por período
- Ventas por manager
- Ventas por gestor
- Cierres de caja
- Productos más vendidos
- Deudas pendientes
- Estadísticas de desempeño

**Exportar Reportes:**
- Formatos disponibles: CSV, PDF, Excel
- Filtros por fecha, manager, gestor, producto
- Haga clic en el botón "Exportar" en cualquier reporte

---

## MANUAL DEL MANAGER

### Funciones Principales

#### 1. Gestión de Gestores

**Crear un Gestor:**
1. Vaya a "Gestores"
2. Haga clic en "Crear Gestor"
3. Ingrese:
   - Nombre de usuario
   - Contraseña
4. El gestor se asigna automáticamente a su tienda

#### 2. Gestión de Productos

**Crear un Producto:**
1. Vaya a "Productos"
2. Haga clic en "Nuevo Producto"
3. Complete la información:
   - **Nombre**: Nombre del producto
   - **Costo**: En USD o MN
   - **Margen**: Porcentaje de ganancia (ej: 30 para 30%)
   - **Comisión**: Porcentaje para el gestor
4. Haga clic en "Guardar"

**Fórmula de Precios:**
```
Venta USD = Costo USD × (1 + Margen)
Precio MN = Venta USD × Tipo de Cambio
Precio Final = Precio MN + Comisión
```

#### 3. Configuración de Tipo de Cambio

1. Vaya a "Tipo de Cambio"
2. Ingrese el nuevo valor (ej: 300)
3. Seleccione fecha de inicio de vigencia
4. Haga clic en "Guardar Cambio"

> **Nota**: Los cambios solo afectan ventas futuras.

#### 4. Stock Inicial

1. Vaya a "Stock Inicial"
2. Seleccione el producto
3. Ingrese la cantidad disponible
4. Haga clic en "Guardar"

#### 5. Asignación de Inventario

**Asignar Inventario a un Gestor:**

1. Vaya a "Asignar Inventario"
2. Seleccione:
   - **Producto**: Del listado disponible
   - **Gestor**: Destinatario
   - **Cantidad**: Unidades a asignar
3. Haga clic en "Asignar"

**Flujo de Asignación:**
```
Manager Asigna → Estado: PENDING
Gestor Confirma → Estado: CONFIRMED
Inventario disponible para ventas
```

#### 6. Confirmación de Cierres

**Validar un Cierre de Caja:**

1. Vaya a "Cierres Pendientes"
2. Revise el resumen del cierre:
   - Total Base MN
   - Total Comisión
   - Total Final MN
3. Verifique que recibió el dinero físico del gestor
4. Haga clic en "Validar Cierre"
5. El estado cambia a "COMPLETED"

#### 7. Gestión de Conflictos

**Resolver un Conflicto de Inventario:**

Cuando un gestor rechaza inventario asignado:

1. Vaya a "Conflictos de Inventario"
2. Revise el motivo del rechazo
3. Acciones disponibles:
   - **Reasignar**: Corregir cantidad y reenviar
   - **Cancelar**: Eliminar la asignación
4. El conflicto se marca como "Resuelto"

#### 5. Monitoreo de Gestores

- Visualice inventario asignado a cada gestor
- Revise ventas realizadas
- Monitoree deudas pendientes
- Consulte historial de cierres

---

## MANUAL DEL GESTOR

### Funciones Principales

#### 1. Confirmación de Inventario

**Confirmar Inventario Asignado:**

1. Vaya a "Mi Inventario"
2. Verá las asignaciones con estado "Pendiente"
3. Compare con el inventario físico recibido
4. Acciones disponibles:
   - **Confirmar**: Aceptar la asignación
   - **Rechazar**: Indicar discrepancia

**Si Rechaza:**
- Ingrese el motivo del rechazo
- El manager recibirá notificación del conflicto

#### 2. Realizar Ventas

**Venta al Contado:**

1. Vaya a "Nueva Venta"
2. Seleccione el producto
3. Ingrese la cantidad
4. Seleccione "Pago al Contado"
5. Revise el precio calculado:
   - Precio Base
   - Comisión
   - Total
6. Haga clic en "Confirmar Venta"

**Venta al Crédito:**

1. Seleccione el producto y cantidad
2. Elija "Venta al Crédito"
3. Ingrese datos del cliente:
   - Nombre
   - Apellidos
4. Haga clic en "Confirmar Venta"
5. La venta aparece en "Deudas Pendientes"

#### 3. Gestión de Deudas

**Marcar Deuda como Pagada:**

1. Vaya a "Deudas Pendientes"
2. Busque la venta al crédito
3. Cuando el cliente pague, haga clic en "Marcar como Pagada"
4. El estado cambia a "PAID"

#### 4. Cierre de Caja

**Ejecutar un Cierre:**

> **Importante**: El cierre agrupa TODAS las ventas no cerradas previas.

1. Vaya a "Cierres"
2. Haga clic en "Ejecutar Cierre"
3. Revise el resumen:
   ```
   Total Base MN: Suma de precios base
   Total Comisión: Suma de comisiones
   Total Final MN: Total Base + Comisiones
   ```
4. Confirme que entregará al manager:
   - **Base MN** (lo que entrega)
   - Se queda con **Comisión** (su ganancia)
5. Haga clic en "Confirmar Cierre"

**Después del Cierre:**
- El cierre queda en estado "PENDING"
- Debe entregar el dinero físico al manager
- El manager validará y cambiará a "COMPLETED"

#### 5. Consulta de Inventario

- Vea su inventario disponible en tiempo real
- Revise historial de ventas
- Consulte cierres realizados
- Verifique deudas pendientes

---

## FLUJO COMPLETO DE VENTAS

```
┌─────────────────────────────────────────────────────────┐
│                  CONFIGURACIÓN INICIAL                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Admin: Crea Tienda → Asigna Director                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Director: Crea Managers                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Manager:                                               │
│  • Configura Tipo de Cambio                             │
│  • Crea Productos                                       │
│  • Define Stock Inicial                                 │
│  • Crea Gestores                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Manager: Asigna Inventario a Gestores                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Gestor: Confirma Inventario → Realiza Ventas           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Gestor: Ejecuta Cierre → Entrega Dinero                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Manager/Director: Valida Cierre → Registra Recepción   │
└─────────────────────────────────────────────────────────┘
```

---

## SOLUCIÓN DE PROBLEMAS

### No puedo iniciar sesión

**Verifique:**
- Nombre de usuario correcto
- Contraseña (distingue mayúsculas/minúsculas)
- URL del sistema
- Contacte al administrador si olvidó la contraseña

### No veo inventario disponible

**Posibles causas:**
- No tiene asignaciones confirmadas
- El inventario asignado está en estado "PENDING"
- Contacte a su manager para verificar asignaciones

### Error al realizar una venta

**Verifique:**
- Tenga suficiente inventario disponible
- El tipo de cambio esté configurado
- Los datos del cliente (en ventas a crédito)

### No puedo ejecutar cierre de caja

**Requisitos:**
- Tener ventas pendientes (no cerradas)
- No tener cierres previos sin confirmar

### El precio calculado no es correcto

**Verifique:**
- Costo del producto
- Margen configurado
- Tipo de cambio actual
- Comisión del producto

---

## REGLAS IMPORTANTES

### Para Directores
- Mantenga actualizado el tipo de cambio
- Supervise el stock inicial
- Revise reportes periódicos

### Para Managers
- Asigne inventario de forma precisa
- Resuelva conflictos rápidamente
- Valide cierres solo al recibir dinero físico

### Para Gestores
- Confirme inventario físico antes de aceptar
- No borre ventas después de ejecutar un cierre
- Mantenga registro de deudas al crédito

---

## CONTACTO Y SOPORTE

Para reportar problemas técnicos o solicitar ayuda:
- Contacte a su administrador de sistema
- O al departamento de soporte técnico

---

**Documento versión 1.0**
**Fecha: Febrero 2026**
