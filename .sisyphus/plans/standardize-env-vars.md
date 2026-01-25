# Plan: Estandarización de Variables de Entorno y Puertos

## Context

### Original Request
El usuario preguntó si la configuración del README era correcta:
```
# Frontend
VITE_API_URL=http://localhost:3001
VITE_PORT=3000
```

### Interview Summary
**Key Discussions**:
- Se identificó que el código actual ignora estas variables y usa valores hardcodeados (`3000`) o nombres incorrectos (`API_URL`).
- El usuario optó por la **Opción A**: Corregir el código para que respete el estándar de Vite (`VITE_API_URL` y `VITE_PORT`).
- Esto evita conflictos de puertos (el backend ya usa el 3001) y permite flexibilidad de configuración.

**Research Findings**:
- `vite.config.ts`: Usa `port: 3000` hardcodeado y mapea `API_URL` en lugar de `VITE_API_URL`.
- `hooks/useApi.ts`: Busca `API_URL` con un fallback a `localhost:3001`.
- `README.md` y `.env.example`: Ya usan los nombres correctos (`VITE_`), pero el código no los lee.

### Metis Review
*Nota: La consulta con Metis falló técnicamente, pero se han aplicado los siguientes guardrails basados en el análisis propio:*
- Asegurar que el fallback siga siendo funcional para no romper el entorno de otros desarrolladores.
- Mantener la compatibilidad con el backend actual (puerto 3001).
- Verificar que el frontend no intente usar el mismo puerto que el backend.

---

## Work Objectives

### Core Objective
Estandarizar la configuración del frontend para que use variables de entorno (`VITE_PORT` y `VITE_API_URL`) siguiendo las convenciones de Vite, permitiendo que las instrucciones del README sean efectivas.

### Concrete Deliverables
- `vite.config.ts`: Actualizado para leer el puerto y la URL de la API desde el entorno.
- `hooks/useApi.ts`: Actualizado para usar la nueva variable estandarizada.
- `.env.example`: Verificado y sincronizado.
- `README.md`: Verificado y sincronizado.

### Definition of Done
- [ ] El frontend arranca en el puerto definido en `VITE_PORT` (o 3000 por defecto).
- [ ] El frontend realiza peticiones a la URL definida en `VITE_API_URL`.
- [ ] No hay discrepancias entre la documentación y el comportamiento del código.

### Must Have
- Respetar el prefijo `VITE_` para todas las variables del cliente.
- Mantener fallbacks razonables (`3000` para puerto, `3001` para API).

### Must NOT Have (Guardrails)
- No cambiar el puerto del backend (se mantiene en 3001).
- No eliminar el soporte para `0.0.0.0` en el host del frontend (necesario para Docker).

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **User wants tests**: Manual-only (preferencia por rapidez y simplicidad en este ajuste de configuración).

### Manual QA Procedure

| Type | Verification Tool | Procedure |
|------|------------------|-----------|
| **Frontend Port** | Terminal / Browser | Cambiar `VITE_PORT=3005` en `.env` y verificar que el servidor de Vite arranca en ese puerto. |
| **API Connectivity** | Browser DevTools | Verificar en la pestaña "Network" que las peticiones salen hacia el valor definido en `VITE_API_URL`. |

---

## Task Flow

```
Tarea 1 (Configuración) → Tarea 2 (Implementación) → Tarea 3 (Documentación)
```

## TODOs

- [ ] 1. **Estandarizar `vite.config.ts`**

  **What to do**:
  - Modificar la configuración de `server.port` para que use `Number(env.VITE_PORT) || 3000`.
  - Actualizar el bloque `define` para mapear `process.env.VITE_API_URL` en lugar de `API_URL`.
  - Asegurar que se carguen todas las variables con prefijo `VITE_`.

  **Parallelizable**: NO

  **References**:
  - `vite.config.ts`: Línea 15 (puerto) y línea 22 (API_URL).
  - Documentación de Vite sobre `loadEnv`.

  **Acceptance Criteria**:
  - El archivo se compila correctamente sin errores de sintaxis.

- [ ] 2. **Actualizar el Hook de API**

  **What to do**:
  - Modificar `hooks/useApi.ts` para que use `process.env.VITE_API_URL` como fuente de la URL base.
  - Mantener el fallback a `http://localhost:3001`.

  **Parallelizable**: YES (con tarea 1)

  **References**:
  - `hooks/useApi.ts`: Línea 3 (Definición de `API_BASE_URL`).

  **Acceptance Criteria**:
  - El frontend sigue pudiendo realizar peticiones al backend usando la nueva variable.

- [ ] 3. **Sincronizar Docker y Documentación**

  **What to do**:
  - Actualizar `docker.env.example` para que use `POSTGRES_DB=nexusdb` (consistente con el README).
  - Verificar que el `README.md` describa correctamente el uso de todas las variables.

  **Parallelizable**: YES

  **References**:
  - `docker.env.example`
  - `README.md`

  **Acceptance Criteria**:
  - Los archivos de ejemplo son 100% coherentes con las instrucciones del README.

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `refactor(config): support VITE_PORT and VITE_API_URL in vite config` | `vite.config.ts` |
| 2 | `refactor(api): use standardized VITE_API_URL in useApi hook` | `hooks/useApi.ts` |
| 3 | `docs(env): align README and .env.example with code changes` | `README.md`, `.env.example` |

---

## Success Criteria

### Verification Commands
```bash
# Para verificar puerto:
export VITE_PORT=3005 && npm run dev
# Expected: El servidor debe indicar "Local: http://localhost:3005"
```
