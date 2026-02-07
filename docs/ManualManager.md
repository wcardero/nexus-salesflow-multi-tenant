# MANUAL DEL MANAGER
## Guía Completa para Managers - Nexus SalesFlow

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Gestores](#gestión-de-gestores)
4. [Gestión de Productos](#gestión-de-productos)
5. [Configuración de Tipo de Cambio](#configuración-de-tipo-de-cambio)
6. [Stock Inicial](#stock-inicial)
7. [Asignación de Inventario](#asignación-de-inventario)
8. [Confirmación de Cierres](#confirmación-de-cierres)
9. [Resolución de Conflictos](#resolución-de-conflictos)
10. [Monitoreo y Reportes](#monitoreo-y-reportes)
11. [Flujos de Trabajo](#flujos-de-trabajo)
12. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)

---

## INTRODUCCIÓN

Como **Manager**, usted es el enlace entre la dirección y los gestores. Su rol es fundamental para:

- Gestionar el equipo de gestores
- Distribuir inventario eficientemente
- Validar cierres de caja
- Resolver conflictos de inventario
- Supervisar las operaciones diarias

### Permisos del Manager

✅ **Puede hacer:**
- Crear y gestionar gestores
- Crear, editar y eliminar productos
- Configurar y actualizar tipo de cambio
- Gestionar stock inicial por producto
- Asignar inventario a gestores
- Confirmar cierres de caja
- Resolver conflictos de inventario
- Ver reportes de sus gestores

❌ **No puede hacer:**
- Crear directores ni otros managers
- Ver inventario de otras tiendas
- Modificar cierres ya validados
- Eliminar ventas realizadas

---

## PRIMEROS PASOS

### 1. Acceso al Sistema

1. Ingrese la URL del sistema en su navegador
2. Ingrese sus credenciales:
   - **Usuario**: (proporcionado por el admin/director)
   - **Contraseña**: (proporcionada por el admin/director)
3. Seleccione su tienda (si tiene múltiples)
4. Verá el **Panel del Manager**

### 2. Panel Principal

El panel muestra:
- Resumen de ventas del día
- Gestores activos
- Cierres pendientes de validación
- Conflictos de inventario
- Alertas importantes

---

## GESTIÓN DE GESTORES

### Crear un Nuevo Gestor

**Pasos:**

1. Vaya al menú **"Gestores"**
2. Haga clic en **"Crear Gestor"** (botón +)
3. Complete el formulario:
   
   | Campo | Descripción | Ejemplo |
   |-------|-------------|---------|
   | Nombre de Usuario | Identificador único | juan.perez |
   | Contraseña | Mínimo 6 caracteres | Temp2024! |
   | Confirmar Contraseña | Repita la contraseña | Temp2024! |

4. Haga clic en **"Guardar"**

> **Nota**: El gestor se asigna automáticamente a su tienda.

### Editar un Gestor

1. En la lista de gestores, haga clic en el ícono de editar (✏️)
2. Modifique los datos necesarios
3. Haga clic en **"Guardar Cambios"**

### Cambiar Contraseña de un Gestor

1. Seleccione el gestor de la lista
2. Haga clic en **"Cambiar Contraseña"**
3. Ingrese la nueva contraseña
4. Confirme la nueva contraseña
5. Haga clic en **"Actualizar"**

> **Importante**: Informe al gestor su nueva contraseña de forma segura.

### Desactivar/Eliminar un Gestor

> **Advertencia**: Solo elimine gestores que no tengan:
> - Inventario asignado
> - Ventas pendientes
> - Cierres sin validar

1. Seleccione el gestor
2. Haga clic en **"Eliminar"** (🗑️)
3. Confirme la acción

---

## GESTIÓN DE PRODUCTOS

### Conceptos Importantes

**Costo**: Precio de compra del producto (en USD o MN)
**Margen**: Porcentaje de ganancia sobre el costo
**Comisión**: Porcentaje que gana el gestor por cada venta
**Tipo de Cambio**: Tasa USD a Moneda Nacional

### Fórmula de Precios

**Para producto en USD:**
```
Venta USD = Costo USD × (1 + Margen)
Precio MN Base = Venta USD × Tipo de Cambio
Comisión MN = Precio MN Base × Tasa de Comisión
Precio Final MN = Precio MN Base + Comisión MN
```

**Ejemplo Numérico:**
```
Producto: Jabón
Costo: $10.00 USD
Margen: 30%
Tipo de Cambio: 300 MN/USD
Comisión: 10%

Cálculo:
Venta USD = $10 × 1.30 = $13.00 USD
Precio MN Base = $13 × 300 = $3,900 MN
Comisión = $3,900 × 0.10 = $390 MN
Precio Final = $3,900 + $390 = $4,290 MN
```

### Crear un Nuevo Producto

**Paso 1: Acceder**
1. Vaya al menú **"Productos"**
2. Haga clic en **"Nuevo Producto"**

**Paso 2: Información Básica**
1. **Nombre del Producto**: Ingrese nombre descriptivo
2. **Moneda**: Seleccione USD o MN
3. **Costo**: Ingrese el costo de compra

**Paso 3: Configuración de Precios**
1. **Margen**: Porcentaje de ganancia (ej: 30 para 30%)
2. **Comisión**: Porcentaje para el gestor (ej: 10 para 10%)

> **Nota**: Si no especifica comisión, se usará la comisión por defecto de la tienda.

**Paso 4: Guardar**
1. Revise los cálculos automáticos
2. Haga clic en **"Guardar Producto"**

### Editar un Producto

1. Vaya a **"Productos"**
2. Busque el producto en la lista
3. Haga clic en el ícono de editar (✏️)
4. Modifique los campos necesarios
5. Haga clic en **"Guardar Cambios"**

> **Importante**: Los cambios en precios solo afectan ventas futuras. Las ventas existentes mantienen los precios originales.

### Eliminar un Producto

> **⚠️ Precaución**: No puede eliminar productos que:
> - Tengan stock asignado
> - Tengan ventas registradas
> - Estén en inventario de gestores

1. Seleccione el producto
2. Haga clic en **"Eliminar"**
3. Confirme la acción

### Lista de Productos

Vaya a **"Productos"** para ver:
- Todos los productos de la tienda
- Costo y precios actuales
- Margen y comisión configurados
- Stock disponible
- Estado del producto

---

## CONFIGURACIÓN DE TIPO DE CAMBIO

### ¿Qué es el Tipo de Cambio?

Es la tasa de conversión de USD a Moneda Nacional (MN). Este valor es crucial porque:
- Determina el precio de venta de productos en USD
- Afecta todas las ventas futuras
- Se congela en cada venta (no hay efectos retroactivos)

### Cuándo Actualizar el Tipo de Cambio

Actualice el tipo de cambio cuando:
- Haya fluctuaciones significativas del dólar
- Inicie un nuevo período de ventas
- Los precios actuales ya no sean competitivos

### Cómo Configurar el Tipo de Cambio

**Paso 1: Acceder**
1. Vaya al menú **"Tipo de Cambio"**

**Paso 2: Nuevo Valor**
1. Ingrese el nuevo valor (ej: 300)
2. Seleccione la **fecha de inicio** de vigencia
3. Opcional: Establezca fecha de fin (para períodos específicos)

**Paso 3: Confirmar**
1. Revise el valor ingresado
2. Haga clic en **"Guardar Cambio"**

> **Nota**: El sistema guarda un historial de todos los cambios de tipo de cambio.

### Historial de Tipos de Cambio

Vaya a **"Tipo de Cambio"** → **"Historial"** para ver:
- Todos los valores históricos
- Fechas de vigencia
- Usuario que realizó el cambio
- Fecha del cambio

---

## STOCK INICIAL

### Concepto

El **Stock Inicial** es la cantidad total de productos disponibles en la tienda antes de asignarlos a gestores. Es el inventario base sobre el cual se hacen las asignaciones.

### Configurar Stock Inicial

**Paso 1: Acceder**
1. Vaya al menú **"Stock Inicial"**

**Paso 2: Seleccionar Producto**
1. Seleccione el producto del dropdown
2. Verá información del producto:
   - Nombre
   - Costo
   - Precio actual

**Paso 3: Definir Cantidad**
1. Ingrese la cantidad disponible en tienda
2. El sistema valida que sea un número positivo

**Paso 4: Guardar**
1. Haga clic en **"Guardar Stock"**
2. El stock queda disponible para asignaciones

### Actualizar Stock

1. Vaya a **"Stock Inicial"**
2. Busque el producto
3. Haga clic en **"Editar"**
4. Modifique la cantidad
5. Haga clic en **"Guardar"**

> **Importante**: No puede reducir el stock por debajo de lo ya asignado a gestores.

### Control de Stock

El panel de stock muestra:
- **Stock Total**: Cantidad en tienda
- **Asignado**: Cantidad asignada a gestores
- **Disponible**: Stock Total - Asignado
- **Vendido**: Cantidad ya vendida

---

## ASIGNACIÓN DE INVENTARIO

### Conceptos Importantes

**Stock Inicial**: Inventario total disponible en la tienda

**Inventario Asignado**: Porción del stock que entrega a un gestor específico

**Estados del Inventario:**
- **PENDING**: Asignado pero pendiente de confirmación del gestor
- **CONFIRMED**: El gestor ha confirmado recibirlo
- **REJECTED**: El gestor rechazó la asignación (crea conflicto)

### Cómo Asignar Inventario

**Paso 1: Acceder a Asignación**
1. Vaya al menú **"Asignar Inventario"**
2. Haga clic en **"Nueva Asignación"**

**Paso 2: Seleccionar Producto**
1. Seleccione el producto del dropdown
2. Verá:
   - Stock disponible en tienda
   - Precio actual
   - Unidad de medida

**Paso 3: Seleccionar Gestor**
1. Elija el gestor destinatario
2. Solo verá gestores de su tienda

**Paso 4: Definir Cantidad**
1. Ingrese la cantidad a asignar
2. El sistema valida que haya stock suficiente
3. Verá mensaje de error si excede el disponible

**Paso 5: Confirmar**
1. Revise el resumen:
   ```
   Producto: [Nombre]
   Gestor: [Nombre del Gestor]
   Cantidad: [Número]
   Precio Unitario: [Monto]
   ```
2. Haga clic en **"Asignar"**

> **El estado inicial será: PENDING**

### Seguimiento de Asignaciones

Vaya a **"Inventario Asignado"** para ver:
- Todas las asignaciones realizadas
- Estado de cada una (PENDING, CONFIRMED, REJECTED)
- Fecha de asignación
- Fecha de confirmación (si aplica)

### Reasignar Inventario

Si un gestor rechaza la asignación:
1. Vaya a **"Conflictos de Inventario"**
2. Seleccione el conflicto
3. Elija **"Reasignar"**
4. Ajuste la cantidad si es necesario
5. La asignación vuelve a estado PENDING

---

## CONFIRMACIÓN DE CIERRES

### ¿Qué es un Cierre de Caja?

Es el proceso donde el gestor:
1. Agrupa todas sus ventas no cerradas
2. Calcula totales (base, comisión, final)
3. Entrega el dinero físico al manager
4. El manager valida la recepción

### Flujo del Cierre

```
Gestor ejecuta cierre
        ↓
   Estado: PENDING
        ↓
Gestor entrega dinero físico
        ↓
Manager valida recepción
        ↓
   Estado: COMPLETED
```

### Validar un Cierre

**Paso 1: Ver Cierres Pendientes**
1. Vaya a **"Cierres"** → **"Pendientes"**
2. Verá la lista de cierres en estado PENDING

**Paso 2: Revisar Detalles**
Haga clic en un cierre para ver:

```
┌─────────────────────────────────────────────────────┐
│  RESUMEN DEL CIERRE                                 │
├─────────────────────────────────────────────────────┤
│  Gestor: Juan Pérez                                 │
│  Fecha: 05/02/2026                                  │
│                                                     │
│  ─── DESGLOSE POR MÉTODO DE PAGO ───               │
│                                                     │
│  💵 EFECTIVO:                                       │
│     Base MN:        $25,000.00                      │
│                                                     │
│  💳 TRANSFERENCIAS:                                 │
│     Base MN:        $15,000.00                      │
│     Recargos:       $2,000.00                       │
│                                                     │
│  ─────────────────────────────────                  │
│  Total Base MN:     $42,000.00      │
│  (incluye recargos)                                 │
│                                                     │
│  Total Comisión:    $4,500.00                       │
│  ─────────────────────────────────                  │
│  Total Final MN:    $46,500.00                      │
│                                                     │
│  Ventas incluidas: 15                               │
└─────────────────────────────────────────────────────┘
```
┌─────────────────────────────────────┐
│  RESUMEN DEL CIERRE                 │
├─────────────────────────────────────┤
│  Gestor: Juan Pérez                 │
│  Fecha: 05/02/2026                  │
│                                     │
│  Total Base MN:     $45,000.00      │
│  Total Comisión:    $4,500.00       │
│  ─────────────────────────────      │
│  Total Final MN:    $49,500.00      │
│                                     │
│  Ventas incluidas: 15               │
└─────────────────────────────────────┘
```

**Paso 3: Verificar Dinero Físico**
- El gestor debe entregar: **$42,000.00** (Base MN + Recargos por transferencia)
- El gestor se queda con: **$4,500.00** (Comisión)

> **Nota**: El "Base MN" ahora incluye los recargos por transferencia. En el ejemplo:
> - Efectivo: $25,000
> - Transferencias (base + recargo): $15,000 + $2,000 = $17,000
> - **Total a recibir**: $42,000

**Paso 4: Confirmar Validación**
1. Una vez recibido el dinero, haga clic en **"Validar Cierre"**
2. El sistema cambiará el estado a COMPLETED
3. El cierre queda registrado en el historial

> **⚠️ IMPORTANTE**: Solo valide el cierre cuando tenga físicamente el dinero en sus manos.

### Historial de Cierres

Vaya a **"Cierres"** → **"Historial"** para:
- Ver todos los cierres validados
- Filtrar por fecha
- Filtrar por gestor
- Exportar reportes

---

## RESOLUCIÓN DE CONFLICTOS

### ¿Qué es un Conflicto?

Ocurre cuando un gestor **rechaza** una asignación de inventario porque:
- La cantidad no coincide con lo físico recibido
- El producto está dañado
- Hay discrepancia en el tipo de producto

### Ver Conflictos Pendientes

1. Vaya a **"Conflictos de Inventario"**
2. Verá los conflictos con estado **PENDING**
3. Cada conflicto muestra:
   - Gestor que reportó
   - Producto en conflicto
   - Cantidad asignada
   - Motivo del rechazo
   - Fecha de creación

### Resolver un Conflicto

**Opción 1: Reasignar**

Use esta opción cuando:
- Hay error en la cantidad asignada
- El gestor necesita diferente cantidad

**Pasos:**
1. Haga clic en **"Reasignar"**
2. Ajuste la cantidad correcta
3. Agregue nota explicativa (opcional)
4. Haga clic en **"Confirmar Reasignación"**
5. La asignación vuelve a estado PENDING

**Opción 2: Cancelar**

Use esta opción cuando:
- El producto está dañado
- No hay stock disponible
- El gestor no necesita el producto

**Pasos:**
1. Haga clic en **"Cancelar Asignación"**
2. Confirme la cancelación
3. El inventario vuelve al stock de la tienda
4. El conflicto se marca como RESOLVED

### Historial de Conflictos

En **"Conflictos"** → **"Resueltos"** puede ver:
- Todos los conflictos históricos
- Cómo fueron resueltos
- Fechas de resolución

---

## MONITOREO Y REPORTES

### Dashboard del Manager

Su panel principal muestra:

**Métricas del Día:**
- Total de ventas
- Número de cierres
- Ventas por gestor

**Alertas:**
- Cierres pendientes de validación
- Conflictos de inventario sin resolver
- Gestores sin actividad reciente

### Reportes Disponibles

**1. Ventas por Período**
- Acceso: Reportes → Ventas
- Filtros: Fecha inicio, fecha fin, gestor
- Columnas: Fecha, producto, cantidad, monto, gestor

**2. Cierres por Período**
- Acceso: Reportes → Cierres
- Filtros: Fecha, gestor
- Columnas: Fecha, gestor, base MN, comisión, total

**3. Métricas por Gestor**
- Acceso: Reportes → Gestores
- Muestra: Ventas totales, promedio, ranking

**4. Deudas Pendientes**
- Acceso: Reportes → Deudas
- Muestra: Ventas al crédito no pagadas
- Columnas: Cliente, monto, fecha, gestor

### Exportar Reportes

1. Genere el reporte deseado
2. Haga clic en **"Exportar"**
3. Seleccione formato:
   - **CSV**: Para Excel o análisis
   - **PDF**: Para imprimir o compartir
   - **Excel**: Formato nativo de Excel
4. El archivo se descargará automáticamente

---

## FLUJOS DE TRABAJO

### Flujo Diario Recomendado

```
┌────────────────────────────────────────────────────────┐
│  INICIO DEL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  1. Iniciar sesión                                     │
│  2. Revisar conflictos pendientes                      │
│  3. Verificar cierres pendientes de ayer               │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  DURANTE EL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  4. Asignar inventario a gestores según demanda        │
│  5. Resolver conflictos a medida que surgen            │
│  6. Monitorear dashboard                               │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  FIN DEL DÍA                                           │
├────────────────────────────────────────────────────────┤
│  7. Validar cierres de caja                            │
│  8. Verificar que todos los gestores cerraron          │
│  9. Revisar reportes del día                           │
└────────────────────────────────────────────────────────┘
```

### Flujo de Asignación de Inventario

```
Verificar stock disponible
        ↓
Seleccionar producto
        ↓
Seleccionar gestor
        ↓
Definir cantidad
        ↓
Confirmar asignación
        ↓
Esperar confirmación del gestor
        ↓
Si CONFIRMED → Disponible para ventas
        ↓
Si REJECTED → Resolver conflicto
```

### Flujo de Validación de Cierre

```
Gestor ejecuta cierre
        ↓
Notificación al Manager
        ↓
Gestor entrega dinero físico
        ↓
Manager cuenta el dinero
        ↓
Verificar que coincida con Base MN
        ↓
Validar cierre en sistema
        ↓
Cierre COMPLETED
```

---

## CONSEJOS Y MEJORES PRÁCTICAS

### Gestión de Gestores

✅ **Hacer:**
- Capacitar a nuevos gestores antes de asignarles inventario
- Establecer metas de ventas claras
- Comunicarse regularmente con el equipo
- Revisar el desempeño semanal

❌ **Evitar:**
- Asignar inventario sin confirmar disponibilidad física
- Validar cierres sin contar el dinero
- Ignorar conflictos de inventario

### Asignación de Inventario

✅ **Hacer:**
- Asignar según la capacidad de venta del gestor
- Distribuir equitativamente entre gestores
- Verificar stock antes de asignar
- Mantener registro de asignaciones

❌ **Evitar:**
- Asignar más de lo que el gestor puede vender
- Asignar sin verificar el stock disponible
- Acumular inventario en un solo gestor

### Validación de Cierres

✅ **Hacer:**
- Siempre contar el dinero físico antes de validar
- Verificar que el monto coincida con el Base MN
- Mantener registro de cierres validados
- Reportar discrepancias inmediatamente

❌ **Evitar:**
- NUNCA validar sin tener el dinero en mano
- No validar cierres de otros managers
- Ignorar diferencias en los montos

### Manejo de Conflictos

✅ **Hacer:**
- Resolver conflictos el mismo día
- Investigar la causa raíz
- Comunicarse con el gestor para entender el problema
- Documentar las resoluciones

❌ **Evitar:**
- Dejar conflictos sin resolver
- Asumir que el gestor está equivocado
- Reasignar sin corregir el problema

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo ver las ventas de otros managers?**
R: No, solo puede ver las ventas de los gestores de su tienda.

**P: ¿Qué pasa si un gestor no confirma el inventario?**
R: El inventario permanece en estado PENDING y no puede ser vendido.

**P: ¿Puedo modificar un cierre ya validado?**
R: No, los cierres validados (COMPLETED) no pueden modificarse.

**P: ¿Cómo sé cuánto dinero debe entregarme un gestor?**
R: En el detalle del cierre verá "Total Base MN". Ese es el monto a recibir.

**P: ¿Qué hago si el dinero físico no coincide con el cierre?**
R: No valide el cierre. Contacte al gestor para reconciliar la diferencia.

**P: ¿Puedo eliminar un gestor con ventas pendientes?**
R: No, primero debe asegurarse de que no tenga ventas ni cierres pendientes.

---

**Manual del Manager - Versión 1.1**
**Fecha: Febrero 2026**
**Sistema: Nexus SalesFlow**

---

## HISTORIAL DE CAMBIOS

### v1.1 (Febrero 2026)
- **Nuevo**: Cierre de caja con desglose por método de pago (efectivo vs transferencia)
- **Nuevo**: Visualización de recargos por transferencia en cierres
- **Actualizado**: Cálculo de "Base MN" ahora incluye recargos por transferencia
- **Actualizado**: Ejemplos y procedimientos de validación de cierres

### v1.0 (Enero 2026)
- Lanzamiento inicial del manual
- Documentación de gestión de gestores y productos
- Proceso de validación de cierres de caja
- Gestión de conflictos de inventario
