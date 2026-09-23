# AGENTS.md — Reglas para agentes IA

Este archivo define el contexto técnico y las reglas estrictas que todo agente IA (OpenCode, Claude, Copilot, etc.) debe seguir al modificar este repositorio.

## Rol

Ingeniero de Software experto en **Google Apps Script (GAS)** y manipulación del DOM de **Google Docs** (`DocumentApp`).

## Contexto

Script modular en GAS para **limpiar y normalizar documentos** generados al copiar/pegar contenido de HTML/webs externas. Los documentos contienen apuntes técnicos: texto normal, tablas de datos y **bloques de código** (tablas 1x1 o fuentes monoespaciadas creadas por extensiones como CodeBlocks).

## Reglas estrictas de desarrollo

1. **Nunca romper la protección de código.** Las funciones `esTablaCodeBlock` y `esTextoCodigo` (y la constante `CONFIG.FUENTES_CODIGO`) son el núcleo de protección. Toda lógica de formateo debe consultarlas antes de modificar un elemento.
2. **Mantener la arquitectura modular** separada por responsabilidades:
   - Módulo 1: Jerarquía de títulos → `procesarTitulos()`
   - Módulo 2: Tablas de datos → `procesarTablas()`
   - Módulo 3: Normalización de cuerpo → `normalizarCuerpo()`
   - Módulo 4: Fuente/alineación dedicada → `aplicarFuenteCuerpo()`
   - Módulo 5: Párrafos vacíos → `eliminarParrafosVacios()`
   - Módulo 6: Limpieza de estilos copiados → `limpiarEstilosCopiados()` + `limpiarParrafos()`
   - Utilidades: `esTablaCodeBlock`, `esTextoCodigo`, `obtenerPatronesTitulo`
   - UI: `onOpen`, `mostrarDialogoConfig`, `aplicarConfiguracion`, `ejecutarLimpiezaTotal`
3. **Usar únicamente métodos nativos** de `DocumentApp.getActiveDocument().getBody()` (y sus hijos). No introducir librerías externas ni `UrlFetchApp` salvo que lo pida el usuario explícitamente.
4. **Configuración centralizada.** Todos los valores editables por el usuario van en el objeto `CONFIG` o en `PRESETS_TITULOS`. No esparcir valores mágicos (`'Calibri'`, `12`, regex sueltas) por la lógica.
5. **Colores de fondo de celdas:** solo se modifican en cabeceras de tablas de datos reales. Las tablas 1x1 (CodeBlocks) no deben recibir `setBackgroundColor` de cabecera.
6. **Al añadir una nueva función** que se ejecute desde el menú:
   - Añadir el `.addItem(...)` correspondiente en `onOpen()`
   - Nombrar la función con verbo en infinitivo español (`procesarX`, `limpiarX`, `aplicarX`)
   - Actualizar la tabla del `README.md`
7. **Compatibilidad:** el script debe seguir siendo **un solo archivo** `src/Code.gs` (límite práctico de pegado en Apps Script para usuarios no técnicos). No fragmentar en múltiples archivos salvo petición explícita.

## Mapa de módulos

| Símbolo | Tipo | Responsabilidad |
|---|---|---|
| `CONFIG` | objeto | Toda la configuración editable |
| `PRESETS_TITULOS` | objeto | Regex de títulos por preset |
| `onOpen()` | UI | Construye el menú `⚡ Formato Pro` |
| `procesarTitulos()` | módulo 1 | Aplica H1/H2/H3 según presets/regex |
| `obtenerPatronesTitulo()` | util | Resuelve qué regex usar según `CONFIG.PRESET_TITULOS` |
| `procesarTablas()` | módulo 2 | Formatea tablas de datos, ignora 1x1 |
| `normalizarCuerpo()` | módulo 3 | Fuente, tamaño, alineación, interlineado del texto normal |
| `aplicarFuenteCuerpo()` | módulo 4 | Solo tipografía/alineación del cuerpo |
| `eliminarParrafosVacios()` | módulo 5 | Borra párrafos en blanco consecutivos (nunca el último de una sección) |
| `limpiarEstilosCopiados()` | módulo 6 | Limpia fondos, subrayados, tamaños heredados (incl. tablas 1x1) |
| `limpiarParrafos()` | aux módulo 6 | Lógica por párrafo; distingue código vs normal |
| `trimParrafo(paragraph)` | util | Quita espacios iniciales/finales preservando formato de runs |
| `esTablaCodeBlock(table)` | util | true si tabla 1x1 |
| `esTextoCodigo(paragraph)` | util | true si fuente monoespaciada |
| `mostrarDialogoConfig()` | UI | Modal de configuración |
| `aplicarConfiguracion(datos)` | UI | Guarda valores del modal en `CONFIG` |
| `ejecutarLimpiezaTotal()` | maestro | Ejecuta todos los módulos en orden |

## Cómo añadir un nuevo módulo

1. Crear la función en una sección `// MÓDULO N: ...` en `src/Code.gs`.
2. Si necesita configuración, añadirla al objeto `CONFIG`.
3. Registrarla en `onOpen()` con un `.addItem(...)`.
4. Si debe entrar en la limpieza total, llamarla desde `ejecutarLimpiezaTotal()` en el orden correcto.
5. Actualizar `README.md` (tabla de opciones) y este archivo (mapa de módulos).

## Prompt maestro

Para tareas de mantenimiento/iteración con un agente, usa el prompt de [`docs/PROMPT_MAESTRO.md`](docs/PROMPT_MAESTRO.md).

## Depuración (clasp + logs)

Flujo profesional OpenCode ↔ GAS documentado en [`docs/DEPURACION.md`](docs/DEPURACION.md):

1. Modificar `src/Code.gs` (o el `.js` local si hay proyecto clasp).
2. Usar `console.log()` / `CONFIG.DEBUG_TIEMPOS` para instrumentar.
3. `clasp push` → ejecutar en Google Docs → `clasp logs --watch`.
4. Corregir según el error real de Cloud Logging (no inventar APIs).

**Regla de logs:** preferir `console.log` / `console.time` (compatible con `clasp logs`). `Logger.log` solo si el usuario lo pide.

**Tipos:** el repo incluye `@types/google-apps-script` en `package.json` — al modificar el script, respetar la API real de `DocumentApp` (no inventar métodos).
