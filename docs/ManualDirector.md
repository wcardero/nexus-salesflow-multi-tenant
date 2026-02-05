# MANUAL DEL DIRECTOR
## Guía Completa para Directores - Nexus SalesFlow

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Managers](#gestión-de-managers)
4. [Gestión de Productos](#gestión-de-productos)
5. [Configuración de Tipo de Cambio](#configuración-de-tipo-de-cambio)
6. [Stock Inicial](#stock-inicial)
7. [Asignación de Inventario](#asignación-de-inventario)
8. [Confirmación de Cierres](#confirmación-de-cierres)
9. [Reportes y Métricas](#reportes-y-métricas)
10. [Flujos de Trabajo](#flujos-de-trabajo)
11. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)

---

## INTRODUCCIÓN

Como **Director**, usted tiene la responsabilidad general de la tienda. Es el enlace entre la administración y los managers, con visión completa de las operaciones comerciales.

### Permisos del Director

✅ **Puede hacer:**
- Crear y gestionar managers de su tienda
- Crear, editar y eliminar productos
- Configurar y actualizar tipo de cambio
- Gestionar stock inicial por producto
- Asignar inventario a gestores
- Confirmar pagos de cierres de caja
- Visualizar todos los reportes de la tienda
- Acceder a auditoría completa de la tienda

❌ **No puede hacer:**
- Crear otros directores (solo Admin)
- Ver información de otras tiendas
- Modificar cierres ya validados
- Eliminar ventas realizadas

---

## PRIMEROS PASOS

### 1. Acceso al Sistema

1. Ingrese la URL del sistema en su navegador
2. Ingrese sus credenciales:
   - **Usuario**: (proporcionado por el administrador)
   - **Contraseña**: (proporcionada por el administrador)
3. Seleccione su tienda
4. Verá el **Panel del Director**

### 2. Panel Principal

El panel muestra:
- Resumen general de la tienda
- Ventas totales del período
- Managers activos
- Productos configurados
- Tipo de cambio actual
- Cierres pendientes de confirmación
- Alertas importantes

---

## GESTIÓN DE MANAGERS

### Crear un Nuevo Manager

**Pasos:**

1. Vaya al menú **"Usuarios"** o **"Managers"**
2. Haga clic en **"Crear Usuario"** o **"Nuevo Manager"**
3. Complete el formulario:
   
   | Campo | Descripción | Ejemplo |
   |-------|-------------|---------|
   | Nombre de Usuario | Identificador único | ana.garcia |
   | Contraseña | Mínimo 6 caracteres | Manager2024! |
   | Confirmar Contraseña | Repita la contraseña | Manager2024! |
   | Rol | Seleccione "Manager" | Manager |

4. Haga clic en **"Guardar"**

> **Nota**: El manager se asigna automáticamente a su tienda y solo podrá ver información de esta tienda.

### Editar un Manager

1. En la lista de managers, haga clic en el ícono de editar (✏️)
2. Modifique los datos necesarios
3. Haga clic en **"Guardar Cambios"**

### Cambiar Contraseña de un Manager

1. Seleccione el manager de la lista
2. Haga clic en **"Cambiar Contraseña"**
3. Ingrese la nueva contraseña
4. Confirme la nueva contraseña
5. Haga clic en **"Actualizar"**

> **Importante**: Comunique al manager su nueva contraseña de forma segura.

### Desactivar/Eliminar un Manager

> **Advertencia**: Solo elimine managers que no tengan:
> - Gestores activos bajo su supervisión
> - Cierres pendientes por confirmar
> - Inventario asignado pendiente

1. Seleccione el manager
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

### El Director también puede Asignar

Aunque los managers suelen hacer las asignaciones diarias, como Director también puede:
- Asignar inventario directamente a gestores
- Supervisar las asignaciones realizadas
- Intervenir en casos especiales

### Cómo Asignar Inventario

**Paso 1: Acceder**
1. Vaya al menú **"Asignar Inventario"**

**Paso 2: Seleccionar Producto**
1. Elija el producto del dropdown
2. Verá:
   - Stock disponible
   - Precio actual
   - Gestores disponibles

**Paso 3: Seleccionar Gestor**
1. Elija el gestor destinatario
2. Solo verá gestores de su tienda

**Paso 4: Definir Cantidad**
1. Ingrese la cantidad a asignar
2. El sistema valida disponibilidad

**Paso 5: Confirmar**
1. Revise el resumen
2. Haga clic en **"Asignar"**

> **Estado inicial**: PENDING (pendiente de confirmación del gestor)

### Supervisión de Asignaciones

Vaya a **"Inventario Asignado"** para ver:
- Todas las asignaciones de la tienda
- Estado (PENDING, CONFIRMED, REJECTED)
- Gestor asignado
- Fecha de asignación
- Fecha de confirmación

---

## CONFIRMACIÓN DE CIERRES

### Responsabilidad del Director

Como Director, debe validar los cierres de caja de los gestores, verificando que:
- Los montos coincidan con las ventas
- El dinero físico haya sido entregado
- No haya discrepancias

### Flujo de Cierre

```
Gestor ejecuta cierre
        ↓
   Estado: PENDING
        ↓
Gestor entrega dinero al Manager/Director
        ↓
Director/Manager cuenta el dinero
        ↓
Valida en el sistema
        ↓
   Estado: COMPLETED
```

### Validar un Cierre

**Paso 1: Ver Cierres Pendientes**
1. Vaya a **"Cierres"** → **"Pendientes"**
2. Verá todos los cierres en estado PENDING

**Paso 2: Revisar Detalles**
Haga clic en un cierre para ver:

```
┌─────────────────────────────────────────────────────┐
│              RESUMEN DEL CIERRE                     │
├─────────────────────────────────────────────────────┤
│  Gestor: Juan Pérez                                 │
│  Manager: Ana García                                │
│  Fecha: 05/02/2026                                  │
│                                                     │
│  Total Base MN:     $45,000.00                      │
│  Total Comisión:    $4,500.00                       │
│  ─────────────────────────────────                  │
│  Total Final MN:    $49,500.00                      │
│                                                     │
│  Ventas incluidas: 15                               │
│  Período: 01/02/2026 - 05/02/2026                   │
└─────────────────────────────────────────────────────┘
```

**Paso 3: Verificar Dinero Físico**
- El gestor debe entregar: **$45,000.00** (Base MN)
- El gestor se queda con: **$4,500.00** (Comisión)

**Paso 4: Confirmar Validación**
1. Cuente el dinero físico recibido
2. Verifique que coincida con "Total Base MN"
3. Haga clic en **"Validar Cierre"**
4. El sistema cambia el estado a COMPLETED

> **⚠️ IMPORTANTE**: NUNCA valide un cierre sin tener físicamente el dinero en sus manos.

### Historial de Cierres

Vaya a **"Cierres"** → **"Historial"** para:
- Ver todos los cierres validados
- Filtrar por fecha
- Filtrar por gestor o manager
- Exportar reportes

---

## REPORTES Y MÉTRICAS

### Dashboard del Director

Su panel principal muestra métricas clave:

**Métricas Generales:**
- Total de ventas del período
- Ventas por manager
- Ventas por gestor
- Cierres realizados
- Deudas pendientes

**Alertas:**
- Cierres pendientes de validación
- Productos con stock bajo
- Gestores sin actividad
- Tipo de cambio desactualizado

### Reportes Disponibles

**1. Ventas por Período**
- Acceso: Reportes → Ventas
- Filtros: Fecha, manager, gestor, producto
- Columnas: Fecha, producto, cantidad, monto, estado

**2. Ventas por Manager**
- Acceso: Reportes → Managers
- Muestra: Total de ventas por cada manager
- Comparativa de desempeño

**3. Ventas por Gestor**
- Acceso: Reportes → Gestores
- Muestra: Total de ventas por gestor
- Ranking de desempeño
- Comisiones generadas

**4. Cierres por Período**
- Acceso: Reportes → Cierres
- Filtros: Fecha, gestor, estado
- Columnas: Fecha, gestor, base MN, comisión, total

**5. Deudas Pendientes**
- Acceso: Reportes → Deudas
- Muestra: Todas las ventas al crédito no pagadas
- Columnas: Cliente, monto, fecha, gestor, días pendientes

**6. Métricas de Productos**
- Acceso: Reportes → Productos
- Muestra:
  - Productos más vendidos
  - Productos con stock bajo
  - Rentabilidad por producto

**7. Auditoría de la Tienda**
- Acceso: Auditoría
- Muestra:
  - Todas las operaciones realizadas
  - Cambios en productos
  - Modificaciones de precios
  - Creación de usuarios

### Exportar Reportes

1. Genere el reporte deseado
2. Haga clic en **"Exportar"**
3. Seleccione formato:
   - **CSV**: Para Excel o análisis de datos
   - **PDF**: Para presentaciones o archivar
   - **Excel**: Formato nativo de Excel
4. El archivo se descargará automáticamente

---

## FLUJOS DE TRABAJO

### Flujo de Configuración Inicial

```
Admin crea tienda y asigna Director
              ↓
    Director inicia sesión
              ↓
    Configura Tipo de Cambio
              ↓
    Crea Productos
              ↓
    Establece Stock Inicial
              ↓
    Crea Managers
              ↓
    Configuración lista para operar
```

### Flujo Diario Recomendado

```
┌────────────────────────────────────────────────────────┐
│  INICIO DEL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  1. Iniciar sesión                                     │
│  2. Revisar dashboard y alertas                        │
│  3. Verificar cierres pendientes                       │
│  4. Revisar stock de productos                         │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  DURANTE EL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  5. Supervisar operaciones                             │
│  6. Actualizar tipo de cambio (si es necesario)        │
│  7. Gestionar productos (crear/editar)                 │
│  8. Revisar reportes en tiempo real                    │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  FIN DEL DÍA                                           │
├────────────────────────────────────────────────────────┤
│  9. Validar cierres pendientes                         │
│  10. Revisar reportes del día                          │
│  11. Verificar deudas pendientes                       │
│  12. Planificar para el siguiente día                  │
└────────────────────────────────────────────────────────┘
```

### Flujo de Gestión de Productos

```
Identificar necesidad de nuevo producto
              ↓
    Recopilar información:
    - Nombre
    - Costo
    - Margen deseado
    - Comisión para gestor
              ↓
    Crear producto en sistema
              ↓
    Configurar stock inicial
              ↓
    Producto disponible para asignación
              ↓
    Monitorear ventas y rentabilidad
```

### Flujo de Validación de Cierre

```
Gestor ejecuta cierre
              ↓
    Notificación al Director/Manager
              ↓
    Gestor entrega dinero físico
              ↓
    Director/Manager cuenta:
    - Billetes
    - Monedas
              ↓
    Verificar contra Total Base MN
              ↓
    Si coincide:
    → Validar cierre
              ↓
    Si NO coincide:
    → Investigar discrepancia
    → No validar hasta resolver
```

---

## CONSEJOS Y MEJORES PRÁCTICAS

### Gestión de Managers

✅ **Hacer:**
- Capacitar a nuevos managers sobre el sistema
- Establecer metas claras de ventas
- Reuniones periódicas de seguimiento
- Delegar responsabilidades apropiadamente

❌ **Evitar:**
- Microgestionar a los managers
- Ignorar reportes de desempeño
- No proporcionar retroalimentación

### Gestión de Productos

✅ **Hacer:**
- Mantener precios competitivos
- Actualizar costos regularmente
- Monitorear productos más vendidos
- Eliminar productos que no se venden
- Establecer márgenes apropiados

❌ **Evitar:**
- Precios desactualizados
- Márgenes muy bajos que no generen ganancia
- Acumular productos que no rotan
- No considerar el tipo de cambio

### Configuración de Tipo de Cambio

✅ **Hacer:**
- Actualizar cuando el dólar fluctúe significativamente
- Comunicar cambios a managers y gestores
- Mantener historial para auditoría
- Considerar el impacto en precios

❌ **Evitar:**
- Tipos de cambio desactualizados
- Cambios muy frecuentes que confundan
- No informar al equipo sobre cambios

### Validación de Cierres

✅ **Hacer:**
- Siempre contar el dinero físicamente
- Verificar que coincida exactamente
- Cuestionar discrepancias
- Documentar casos irregulares

❌ **Evitar:**
- Validar sin contar el dinero
- Ignorar diferencias aunque sean pequeñas
- Validar por presión o prisa

### Supervisión General

✅ **Hacer:**
- Revisar reportes diariamente
- Identificar tendencias de ventas
- Detectar gestores con bajo rendimiento
- Celebrar buen desempeño

❌ **Evitar:**
- Ignorar los reportes
- No actuar ante problemas detectados
- Perder contacto con la operación diaria

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo ver las ventas de otras tiendas?**
R: No, solo tiene acceso a la información de su tienda asignada.

**P: ¿Qué pasa si un gestor no confirma el inventario asignado?**
R: El inventario permanece en estado PENDING y no puede ser vendido hasta que el gestor lo confirme o rechace.

**P: ¿Puedo modificar un cierre ya validado?**
R: No, los cierres validados (COMPLETED) no pueden modificarse por seguridad.

**P: ¿Cómo sé cuánto dinero debe entregar un gestor?**
R: En el detalle del cierre verá "Total Base MN". Ese es el monto exacto a recibir del gestor.

**P: ¿Qué hago si el dinero físico no coincide con el cierre?**
R: NO valide el cierre. Investigue la discrepancia con el gestor y el manager antes de proceder.

**P: ¿Puedo eliminar un manager con gestores activos?**
R: No, primero debe reasignar o eliminar los gestores bajo su supervisión.

**P: ¿Cuántos tipos de cambio puedo tener activos?**
R: Puede tener múltiples registros históricos, pero solo uno es el vigente actual.

**P: ¿Los cambios en el tipo de cambio afectan ventas anteriores?**
R: No, cada venta congela el tipo de cambio al momento de realizarse. Los cambios solo afectan ventas futuras.

**P: ¿Puedo asignar inventario directamente o debe hacerlo el manager?**
R: Ambos pueden asignar inventario. Sin embargo, es recomendable que los managers manejen las asignaciones diarias.

**P: ¿Qué información ve el Admin sobre mi tienda?**
R: El Admin puede ver todas las operaciones y métricas de todas las tiendas para supervisión general.

---

## EJEMPLOS PRÁCTICOS

### Ejemplo 1: Configuración Completa de Producto

**Nuevo Producto: Shampoo Premium**

```
Datos de entrada:
- Costo: $8.00 USD
- Margen deseado: 40%
- Comisión para gestor: 10%
- Tipo de Cambio: 300 MN/USD

Cálculos automáticos:
Venta USD = $8 × 1.40 = $11.20 USD
Precio MN Base = $11.20 × 300 = $3,360 MN
Comisión = $3,360 × 0.10 = $336 MN
Precio Final = $3,360 + $336 = $3,696 MN

Distribución del dinero:
- Base MN ($3,360): Va a la tienda
- Comisión ($336): Se queda el gestor
- Total cobrado al cliente: $3,696
```

### Ejemplo 2: Análisis de Cierre

**Cierre del Gestor Juan Pérez:**

```
Ventas del período:
┌──────────────┬──────────┬────────────┬───────────┬──────────┐
│ Producto     │ Cantidad │ Base MN    │ Comisión  │ Final MN │
├──────────────┼──────────┼────────────┼───────────┼──────────┤
│ Jabón        │ 5        │ $19,500    │ $1,950    │ $21,450  │
│ Shampoo      │ 3        │ $10,080    │ $1,008    │ $11,088  │
│ Crema        │ 2        │ $10,400    │ $1,040    │ $11,440  │
└──────────────┴──────────┴────────────┴───────────┴──────────┘

Totales del Cierre:
Total Base MN:     $39,980  → Entrega a tienda
Total Comisión:    $3,998   → Ganancia del gestor
────────────────────────────────────────
Total Final MN:    $43,978  → Cobró a clientes

Validación:
✓ Gestor entrega: $39,980 (Base)
✓ Gestor se queda: $3,998 (Comisión)
✓ Total verificado: $43,978
```

### Ejemplo 3: Actualización de Tipo de Cambio

**Escenario:**

```
Lunes:
- Tipo de Cambio: 300 MN/USD
- Producto A precio: $3,900 MN

Miércoles (dólar sube):
- Nuevo Tipo de Cambio: 320 MN/USD
- Producto A nuevo precio: $4,160 MN

Impacto:
- Ventas de lunes y martes: Mantienen precio de $3,900
- Ventas de miércoles en adelante: Usan precio de $4,160
- Sin efectos retroactivos
```

---

**Manual del Director - Versión 1.0**
**Fecha: Febrero 2026**
**Sistema: Nexus SalesFlow**
