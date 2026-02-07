# MANUAL DEL GESTOR
## Guía Completa para Gestores - Nexus SalesFlow

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Inventario](#gestión-de-inventario)
4. [Realizar Ventas](#realizar-ventas)
5. [Gestión de Deudas](#gestión-de-deudas)
6. [Cierre de Caja](#cierre-de-caja)
7. [Consultas y Reportes](#consultas-y-reportes)
8. [Flujos de Trabajo](#flujos-de-trabajo)
9. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)

---

## INTRODUCCIÓN

Como **Gestor**, usted es quien está en contacto directo con los clientes y realiza las operaciones de venta. Su rol es fundamental para:

- Recibir y gestionar inventario asignado
- Realizar ventas al contado, por transferencia (con recargo) y al crédito
- Mantener registro de deudas pendientes
- Ejecutar cierres de caja diarios
- Generar sus comisiones

### Permisos del Gestor

✅ **Puede hacer:**
- Confirmar o rechazar inventario asignado
- Realizar ventas al contado (efectivo)
- Realizar ventas por transferencia (con recargo configurable)
- Realizar ventas al crédito
- Ver sus deudas pendientes
- Marcar deudas como pagadas
- Ejecutar cierres de caja
- Eliminar ventas (antes de cerrar)
- Consultar su inventario disponible

❌ **No puede hacer:**
- Asignarse inventario a sí mismo
- Modificar productos o precios
- Ver ventas de otros gestores
- Eliminar ventas después de un cierre
- Validar sus propios cierres

---

## PRIMEROS PASOS

### 1. Acceso al Sistema

1. Ingrese la URL del sistema en su navegador
2. Ingrese sus credenciales:
   - **Usuario**: (proporcionado por su manager)
   - **Contraseña**: (proporcionada por su manager)
3. Seleccione su tienda
4. Verá el **Panel del Gestor**

### 2. Panel Principal

El panel muestra:
- Inventario disponible
- Ventas del día
- Deudas pendientes
- Cierres recientes
- Accesos rápidos a funciones principales

---

## GESTIÓN DE INVENTARIO

### ¿Cómo llega el inventario?

Su **Manager** le asigna inventario → Usted lo **confirma** → Puede **venderlo**

### Estados del Inventario

| Estado | Significado | ¿Puede vender? |
|--------|-------------|----------------|
| **PENDING** | Asignado, pendiente de su confirmación | ❌ No |
| **CONFIRMED** | Usted confirmó recibirlo | ✅ Sí |
| **REJECTED** | Usted rechazó la asignación | ❌ No |

### Confirmar Inventario Asignado

**Importante**: Solo confirme si físicamente recibió el producto.

**Pasos:**

1. Vaya al menú **"Mi Inventario"**
2. Verá la sección **"Pendientes"**
3. Revise cada asignación:
   ```
   Producto: [Nombre del producto]
   Cantidad: [Número de unidades]
   Asignado por: [Nombre del Manager]
   Fecha: [Fecha de asignación]
   ```

4. Compare con lo que recibió físicamente

5. Si **TODO COINCIDE**:
   - Haga clic en **"Confirmar"** (✅)
   - El estado cambia a CONFIRMED
   - El inventario está disponible para ventas

6. Si **HAY DIFERENCIAS**:
   - Haga clic en **"Rechazar"** (❌)
   - Ingrese el **motivo** del rechazo:
     ```
     Ejemplos:
     - "Recibí 5 unidades, no 10"
     - "El producto está dañado"
     - "No es el producto que solicité"
     ```
   - Haga clic en **"Enviar"**
   - Se crea un conflicto que su manager debe resolver

### Ver Inventario Disponible

Vaya a **"Mi Inventario"** → **"Disponible"** para ver:
- Todos los productos confirmados
- Cantidad disponible de cada uno
- Precio de venta actual
- Historial de movimientos

### Entender los Precios

Cada producto muestra:

```
┌─────────────────────────────────────┐
│  Producto: Jabón Premium            │
├─────────────────────────────────────┤
│  Costo: $10.00 USD                  │
│  Margen: 30%                        │
│  Tipo de Cambio: 300 MN/USD         │
│                                     │
│  Precio Base MN: $3,900.00          │
│  Comisión (10%): $390.00            │
│  ─────────────────────────────      │
│  Precio Final: $4,290.00 MN         │
└─────────────────────────────────────┘
```

- **Precio Base MN**: Lo que entrega al manager
- **Comisión**: Lo que usted gana
- **Precio Final**: Lo que cobra al cliente

---

## REALIZAR VENTAS

### Venta al Contado (Efectivo)

El cliente paga inmediatamente en efectivo.

**Pasos:**

1. Vaya al menú **"Nueva Venta"**
2. Seleccione el **producto** del dropdown
3. Ingrese la **cantidad**
4. Seleccione **"💵 Pago al Contado (efectivo)"**
5. Revise el cálculo automático:
   ```
   Cantidad: 2 unidades
   Precio unitario: $4,290.00 MN
   ─────────────────────────────
   Total: $8,580.00 MN
   ```
6. Haga clic en **"Confirmar Venta"**
7. El sistema registrará la venta con estado **PAID**

> **La venta se descuenta inmediatamente de su inventario disponible.**

### Venta por Transferencia

El cliente paga mediante transferencia bancaria. El sistema permite agregar un recargo por este método de pago.

**Pasos:**

1. Vaya al menú **"Nueva Venta"**
2. Seleccione el **producto** del dropdown
3. Ingrese la **cantidad**
4. Seleccione **"💳 Pago por transferencia"**
5. Ingrese el **% de recargo** (ej: 5, 10, 15):
   ```
   Ejemplo con 10% de recargo:
   
   Cantidad: 1 unidad
   Precio base: $3,900.00 MN
   Comisión (10%): $390.00 MN
   Subtotal: $4,290.00 MN
   Recargo transferencia (10%): $429.00 MN
   ─────────────────────────────────────
   TOTAL A PAGAR: $4,719.00 MN
   ```
6. Revise el desglose completo del cálculo
7. Haga clic en **"Vender"**
8. El sistema registrará la venta con método **TRANSFER**

> **Nota**: El recargo por transferencia se suma a la ganancia de la tienda. Usted solo recibe su comisión habitual.

### Venta al Crédito

El cliente paga después. Se registra como deuda.

**Pasos:**

1. Seleccione el **producto** y **cantidad**
2. Seleccione **"Venta al Crédito"**
3. Ingrese los datos del cliente:
   - **Nombre**: Ej. "Juan"
   - **Apellidos**: Ej. "Pérez García"
4. Revise el monto total
5. Haga clic en **"Confirmar Venta"**
6. La venta se registra con estado **PENDING**
7. Aparecerá automáticamente en **"Deudas Pendientes"**

> **Importante**: Anote los datos del cliente para cobrar después.

### Eliminar una Venta

Puede eliminar ventas **solo si no han sido cerradas**.

**Pasos:**

1. Vaya a **"Mis Ventas"**
2. Busque la venta a eliminar
3. Haga clic en el ícono de eliminar (🗑️)
4. Confirme la acción

> **⚠️ Una vez que ejecute un cierre, NO puede eliminar ventas incluidas en ese cierre.**

---

## GESTIÓN DE DEUDAS

### Ver Deudas Pendientes

Vaya a **"Deudas Pendientes"** para ver:
- Todas las ventas al crédito no pagadas
- Nombre del cliente
- Monto adeudado
- Fecha de la venta
- Días de retraso (si aplica)

### Marcar Deuda como Pagada

Cuando el cliente le pague, puede registrar el pago como efectivo o transferencia.

**Pasos:**

1. Vaya a **"Deudas Pendientes"**
2. Busque la venta del cliente
3. Haga clic en **"Marcar como Pagada"** (💰)
4. Seleccione el **método de pago**:
   - **💵 Efectivo**: Pago normal, mismo monto de la deuda
   - **💳 Transferencia**: Permite agregar % de recargo
5. Si selecciona transferencia, ingrese el **% de recargo** (opcional)
6. Revise el cálculo final:
   ```
   Ejemplo deuda con transferencia y 10% recargo:
   
   Monto original: $5,720.00 MN
   Recargo (10%): $572.00 MN
   ─────────────────────────────
   TOTAL A PAGAR: $6,292.00 MN
   ```
7. Confirme el pago
8. El estado cambia a **PAID** con el método seleccionado
9. El dinero se suma a su próximo cierre

> **Consejo**: Siempre emita un recibo al cliente cuando pague una deuda, especialmente si hay recargo por transferencia.

### Seguimiento de Deudas

Mantenga un registro de:
- Clientes deudores
- Montos adeudados
- Fechas prometidas de pago
- Contactos para cobranza

---

## CIERRE DE CAJA

### ¿Qué es el Cierre?

Es el proceso de:
1. Agrupar TODAS las ventas no cerradas (contado + créditos pagados)
2. Calcular totales (base, comisión, final)
3. Determinar cuánto entregar al manager
4. Determinar su ganancia (comisión)

### ¿Cuándo hacer un Cierre?

- Al final de su jornada
- Cuando necesite entregar dinero al manager
- Periódicamente (diario, por turno, etc.)

> **Importante**: Una vez que cierra, esas ventas quedan "congeladas" y no pueden modificarse.

### Cómo Ejecutar un Cierre

**Paso 1: Iniciar Cierre**
1. Vaya a **"Cierres"**
2. Haga clic en **"Ejecutar Cierre"**

**Paso 2: Revisar Resumen**

El sistema mostrará:

```
┌─────────────────────────────────────────────────────┐
│           RESUMEN DEL CIERRE                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Período: Desde último cierre hasta ahora          │
│                                                     │
│  Ventas incluidas: 12                               │
│                                                     │
│  ───── DESGLOSE POR MÉTODO DE PAGO ─────           │
│                                                     │
│  💵 EFECTIVO:                                      │
│     Base MN:        $30,000.00                     │
│                                                     │
│  💳 TRANSFERENCIAS:                                │
│     Base MN:        $15,000.00                     │
│     Recargos:       $2,500.00                      │
│     Subtotal:       $17,500.00                     │
│                                                     │
│  ─────────────────────────────────                  │
│                                                     │
│  Total Base MN:     $47,500.00  → Entrega al       │
│                                               manager│
│  (incluye recargos por transferencia)              │
│                                                     │
│  Total Comisión:    $4,750.00   → Su ganancia      │
│                                                     │
│  ─────────────────────────────────                  │
│  Total Final MN:    $52,250.00  → Lo cobró a       │
│                                               clientes│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Paso 3: Confirmar**
1. Revise que los montos sean correctos
2. Prepare el dinero:
   - **Base MN**: $52,000.00 (para entregar al manager)
   - **Comisión**: $5,200.00 (se queda usted)
3. Haga clic en **"Confirmar Cierre"**

**Paso 4: Entregar al Manager**
1. El cierre queda en estado **PENDING**
2. Entregue el dinero físico al manager:
   - Solo el **Base MN** ($52,000.00 en el ejemplo)
3. El manager validará el cierre
4. Una vez validado, cambia a **COMPLETED**

### Historial de Cierres

Vaya a **"Cierres"** → **"Historial"** para ver:
- Todos sus cierres
- Estado (PENDING, COMPLETED)
- Fecha de ejecución
- Fecha de validación
- Montos de cada cierre

### Entender los Cálculos

**Ejemplo de Cierre:**

| Venta | Producto | Método | Base MN | Recargo | Comisión | Final MN |
|-------|----------|--------|---------|---------|----------|----------|
| 1 | Jabón | Efectivo | $3,900 | - | $390 | $4,290 |
| 2 | Champú | Transferencia (10%) | $2,500 | $275 | $250 | $3,025 |
| 3 | Crema | Efectivo | $5,200 | - | $520 | $5,720 |
| **TOTAL** | | | **$11,600** | **$275** | **$1,160** | **$13,035** |

**Resultado del Cierre:**
- **Entrega al Manager**: $11,875.00 (Base MN + Recargos)
- **Su Comisión**: $1,160.00 (Su ganancia)
- **Total que cobró**: $13,035.00 (a clientes)

> **Importante**: Los recargos por transferencia se suman al "Base MN" que entrega al manager, aumentando la ganancia total de la tienda.

---

## CONSULTAS Y REPORTES

### Mi Inventario

Vea en tiempo real:
- Productos disponibles
- Cantidades en stock
- Precios actuales

### Mis Ventas

Historial completo de ventas:
- Fecha y hora
- Producto y cantidad
- Tipo de pago (contado/crédito)
- Monto total
- Estado (PAID/PENDING)

### Filtros disponibles:
- Por fecha
- Por tipo de pago
- Por producto

### Mis Cierres

Resumen de todos sus cierres:
- Fecha del cierre
- Estado (PENDING/COMPLETED)
- Total Base MN entregado
- Total Comisión ganada
- Número de ventas incluidas

### Mis Deudas

Ventas al crédito:
- Pendientes de pago
- Ya pagadas
- Por cliente
- Por fecha

---

## FLUJOS DE TRABAJO

### Flujo Diario Completo

```
┌────────────────────────────────────────────────────────┐
│  INICIO DEL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  1. Iniciar sesión                                     │
│  2. Verificar inventario disponible                    │
│  3. Confirmar asignaciones pendientes (si hay)         │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  DURANTE EL DÍA - VENTAS                               │
├────────────────────────────────────────────────────────┤
│  4. Realizar ventas al contado (efectivo)              │
│  5. Realizar ventas por transferencia (con recargo)    │
│  6. Realizar ventas al crédito (anotar datos cliente)  │
│  7. Registrar pagos de deudas (efectivo o transfer)    │
│  8. Verificar inventario periódicamente                │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  FIN DEL DÍA - CIERRE                                  │
├────────────────────────────────────────────────────────┤
│  8. Revisar ventas del día                             │
│  9. Ejecutar cierre de caja                            │
│  10. Separar dinero:                                   │
│      • Base MN → Para entregar al manager              │
│      • Comisión → Su ganancia                          │
│  11. Entregar Base MN al manager                       │
│  12. Esperar validación del manager                    │
└────────────────────────────────────────────────────────┘
```

### Flujo de Venta al Contado

```
Cliente solicita producto
        ↓
Verificar disponibilidad
        ↓
Crear nueva venta
        ↓
Seleccionar producto
        ↓
Ingresar cantidad
        ↓
Seleccionar método de pago:
   • 💵 Efectivo
   • 💳 Transferencia
        ↓
Si es transferencia → Ingresar % recargo
        ↓
Cobrar al cliente (Precio Final)
        ↓
Confirmar venta
        ↓
Entregar producto
        ↓
Venta registrada (PAID)
```

### Flujo de Venta al Crédito

```
Cliente solicita producto a crédito
        ↓
Verificar disponibilidad
        ↓
Crear nueva venta
        ↓
Ingresar producto y cantidad
        ↓
Seleccionar "Venta al Crédito"
        ↓
Ingresar datos del cliente
        ↓
Confirmar venta
        ↓
Entregar producto
        ↓
Anotar deuda (Nombre + Monto)
        ↓
Venta registrada (PENDING)
        ↓
Cuando cliente paga:
        ↓
Marcar como pagada
        ↓
Dinero disponible para cierre
```

### Flujo de Cierre de Caja

```
Fin de jornada
        ↓
Ir a "Cierres"
        ↓
"Ejecutar Cierre"
        ↓
Revisar resumen
        ↓
Separar dinero:
  • Base MN → Bolsa/Envelope
  • Comisión → Su bolsillo
        ↓
Confirmar cierre
        ↓
Cierre en estado: PENDING
        ↓
Entregar Base MN al manager
        ↓
Manager valida
        ↓
Cierre en estado: COMPLETED
```

---

## CONSEJOS Y MEJORES PRÁCTICAS

### Gestión de Inventario

✅ **Hacer:**
- Confirme solo el inventario que físicamente recibió
- Rechace inmediatamente si hay discrepancias
- Mantenga su inventario organizado
- Verifique stock antes de prometer ventas

❌ **Evitar:**
- Confirmar sin verificar físicamente
- Acumular inventario sin vender
- Mezclar productos confirmados con pendientes

### Realización de Ventas

✅ **Hacer:**
- Verifique siempre el precio antes de cobrar
- Entregue ticket/recibo al cliente
- Anote datos completos en ventas a crédito
- Revise el cambio antes de entregarlo

❌ **Evitar:**
- Vender sin verificar disponibilidad
- Olvidar registrar la venta en el sistema
- Permitir modificaciones después de confirmar

### Ventas al Crédito

✅ **Hacer:**
- Tome datos completos del cliente
- Establezca fecha de pago clara
- Entregue copia de la deuda al cliente
- Haga seguimiento de pagos
- Registre el pago inmediatamente

❌ **Evitar:**
- Fiarr a desconocidos sin referencias
- Olvidar registrar el pago cuando lo recibe
- Acumular muchas deudas sin cobrar

### Cierre de Caja

✅ **Hacer:**
- Cuente el dinero antes de confirmar el cierre
- Separe claramente Base y Comisión
- Entregue el dinero al manager personalmente
- Espere la validación antes de irse

❌ **Evitar:**
- Ejecutar cierre sin contar el dinero
- Mezclar su comisión con el Base
- Irse sin entregar el dinero al manager
- Cerrar sin incluir todas las ventas

### Seguridad

✅ **Hacer:**
- Guarde su contraseña en secreto
- Cierre sesión al terminar
- Reporte discrepancias inmediatamente
- No comparta su usuario

❌ **Evitar:**
- Dejar sesión abierta en dispositivos compartidos
- Compartir contraseñas
- Ignorar errores en el sistema

---

## PREGUNTAS FRECUENTES

**P: ¿Por qué no puedo vender un producto?**
R: Verifique que:
- El inventario esté en estado CONFIRMED
- Tenga cantidad suficiente disponible
- El producto no esté agotado

**P: ¿Puedo eliminar una venta después de cerrar?**
R: No, una vez que ejecuta un cierre, las ventas incluidas no pueden modificarse.

**P: ¿Qué pasa si el cliente no paga una deuda?**
R: La deuda permanece en el sistema. El monto ya fue incluido en su cierre, así que no afecta su comisión.

**P: ¿Cuándo recibo mi comisión?**
R: Su comisión se calcula en cada cierre. Usted se queda con ese dinero al momento de separarlo del Base.

**P: ¿Puedo tener múltiples cierres pendientes?**
R: No, debe esperar a que el manager valide un cierre antes de ejecutar otro.

**P: ¿Qué pasa si rechazo inventario?**
R: Se crea un conflicto que su manager debe resolver. Mientras tanto, ese inventario no está disponible.

**P: ¿Cómo sé cuánto debo entregar al manager?**
R: En el resumen del cierre verá "Total Base MN". Ese es el monto exacto a entregar.

**P: ¿Puedo vender productos de otros gestores?**
R: No, solo puede vender el inventario que le fue asignado y confirmado.

---

## EJEMPLOS PRÁCTICOS

### Ejemplo 1: Día de Ventas Completo

**Inventario asignado:**
- 10 jabones
- 5 champús

**Ventas del día:**
1. Venta contado: 2 jabones → $8,580
2. Venta transferencia (10% recargo): 1 champú → $3,025
3. Venta crédito: 3 jabones → $12,870 (pendiente)

**Deuda pagada:**
- Cliente Juan paga deuda anterior (efectivo) → $5,000
- Cliente María paga deuda (transferencia 10%) → $6,292

**Cierre del día:**
```
Ventas contado:           $8,580
Ventas transferencia:     $3,025
Deudas pagadas efectivo:  $5,000
Deudas pagadas transfer:  $6,292
────────────────────────────────
Total ventas:             $22,897

Base MN:                  $20,815  → Entrega al manager
  (incluye $525 de recargos)
Comisión (10%):           $2,082   → Su ganancia
────────────────────────────────
Total cobrado:            $22,897
```

### Ejemplo 2: Venta al Crédito y Cobro

**Lunes:**
- Vende 1 crema a crédito a María
- Monto: $5,720
- Estado: PENDING

**Miércoles:**
- María paga su deuda
- Usted marca como pagada
- Los $5,720 se suman a su próximo cierre

**Viernes (cierre):**
```
Ventas contado:     $10,000
Deuda María:        $5,720
───────────────────────────
Total:              $15,720

Base MN:            $14,291  → Entrega al manager
Comisión:           $1,429   → Su ganancia
```

---

**Manual del Gestor - Versión 1.1**
**Fecha: Febrero 2026**
**Sistema: Nexus SalesFlow**

---

## HISTORIAL DE CAMBIOS

### v1.1 (Febrero 2026)
- **Nuevo**: Método de pago por transferencia con recargo configurable
- **Nuevo**: Opción de pago de deudas por transferencia
- **Nuevo**: Desglose por método de pago (efectivo/transferencia) en cierre de caja
- **Actualizado**: Ejemplos y cálculos incluyendo recargos por transferencia

### v1.0 (Enero 2026)
- Lanzamiento inicial del manual
- Documentación de ventas al contado y crédito
- Proceso de cierre de caja
- Gestión de deudas
