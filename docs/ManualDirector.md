# MANUAL DEL DIRECTOR
## Guía Completa para Directores - Nexus SalesFlow

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Managers](#gestión-de-managers)
4. [Confirmación de Cierres](#confirmación-de-cierres)
5. [Reportes y Métricas](#reportes-y-métricas)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)

---

## INTRODUCCIÓN

Como **Director**, usted tiene la responsabilidad general de la tienda. Es el enlace entre la administración y los managers, con visión completa de las operaciones comerciales.

### Permisos del Director

✅ **Puede hacer:**
- Crear y gestionar managers de su tienda
- Confirmar pagos de cierres de caja
- Visualizar todos los reportes de la tienda
- Acceder a auditoría completa de la tienda
- Ver estadísticas y métricas de desempeño

❌ **No puede hacer:**
- Crear otros directores (solo Admin)
- Gestionar productos (eso lo hace el Manager)
- Configurar tipo de cambio (eso lo hace el Manager)
- Asignar inventario (eso lo hace el Manager)
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
- Cierres pendientes de confirmación
- Deudas pendientes
- Alertas importantes
- Estadísticas de desempeño

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
    Crea Managers
              ↓
    Managers configuran:
      - Productos
      - Tipo de cambio
      - Stock inicial
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
│  4. Revisar reportes iniciales                         │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  DURANTE EL DÍA                                        │
├────────────────────────────────────────────────────────┤
│  5. Supervisar operaciones de managers                 │
│  6. Verificar rendimiento de gestores                  │
│  7. Revisar reportes en tiempo real                    │
│  8. Apoyar en validación de cierres si es necesario    │
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

**P: ¿Qué información ve el Admin sobre mi tienda?**
R: El Admin puede ver todas las operaciones y métricas de todas las tiendas para supervisión general.

---

## EJEMPLOS PRÁCTICOS

### Ejemplo 1: Creación de un Manager

**Nuevo Manager: Ana García**

```
Datos de entrada:
- Nombre: ana.garcia
- Contraseña: Manager2024!
- Tienda: Tienda Principal

Proceso:
1. Director inicia sesión
2. Accede a "Gestión de Managers"
3. Completa formulario con datos
4. Guarda cambios
5. Manager puede iniciar sesión inmediatamente

Responsabilidades del Manager:
✓ Crear y gestionar gestores
✓ Configurar productos
✓ Establecer tipo de cambio
✓ Asignar inventario
✓ Validar cierres de caja
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

Validación por Director:
✓ Gestor entrega: $39,980 (Base)
✓ Gestor se queda: $3,998 (Comisión)
✓ Total verificado: $43,978
```

### Ejemplo 3: Reporte de Desempeño

**Análisis Semanal de la Tienda:**

```
Período: 01/02/2026 - 07/02/2026

Resumen General:
- Ventas Totales: $125,000 MN
- Cierres Realizados: 15
- Gestores Activos: 3
- Managers Activos: 1

Desglose por Gestor:
┌──────────────┬──────────┬────────────┐
│ Gestor       │ Ventas   │ Comisión   │
├──────────────┼──────────┼────────────┤
│ Juan Pérez   │ $45,000  │ $4,500     │
│ María López  │ $52,000  │ $5,200     │
│ Pedro Ruiz   │ $28,000  │ $2,800     │
└──────────────┴──────────┴────────────┘

Acciones del Director:
✓ Identificar a María como top performer
✓ Capacitar a Pedro para mejorar ventas
✓ Revisar estrategia de productos con manager
```

---

**Manual del Director - Versión 1.0**
**Fecha: Febrero 2026**
**Sistema: Nexus SalesFlow**
