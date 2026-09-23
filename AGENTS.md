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
   - Módulo 5: Párrafos y viñetas vacíos → `eliminarParrafosVacios()`
   - Módulo 6: Limpieza de estilos copiados → `limpiarEstilosCopiados()` + `limpiarParrafos()`
- Módulo 7: Espacios laterales → `recortarEspaciosLaterales()`
- Utilidades: `esTablaCodeBlock`, `esTextoCodigo`, `obtenerPatronesTitulo`, `trimParrafo`, `hayEspaciosColapsables`, `parrafosDeCelda`, `estaEnTablaCodeBlock`, `estaEnTablaDatos`
- UI: `onOpen` (submenús), `mostrarDialogoConfig`, `aplicarConfiguracion`, `ejecutarLimpiezaTotal`
3. **Usar únicamente métodos nativos** de `DocumentApp.getActiveDocument().getBody()` (y sus hijos). No introducir librerías externas ni `UrlFetchApp` salvo que lo pida el usuario explícitamente.
4. **Configuración centralizada.** Todos los valores editables por el usuario van en el objeto `CONFIG` o en `PRESETS_TITULOS`. No esparcir valores mágicos (`'Calibri'`, `12`, regex sueltas) por la lógica.
5. **Colores de fondo de celdas:** solo se modifican en cabeceras de tablas de datos reales. Las tablas 1x1 (CodeBlocks) no deben recibir `setBackgroundColor` de cabecera.
6. **Bordes de tablas:** la cuadrícula (grosor/color) solo se aplica a tablas de datos vía `CONFIG.BORDE_TABLA_GROSOR` / `CONFIG.BORDE_TABLA_COLOR` en `procesarTablas()`. Nunca a tablas 1x1. Orden: DocumentApp (`setBorderWidth`/`setBorderColor` + `setAttributes` por celda) y después **Docs API** (`updateTableCellStyle` en `aplicarBordesDocsApi()`) si `CONFIG.USAR_DOCS_API_BORDES`. El payload Docs API es: `tableStartLocation: { index }` (índice UTF-16 de `Docs.Documents.get` → `body.content`), `TableCellBorder` con `dashStyle: 'SOLID'` (sin él la API devuelve `DASH_STYLE_UNSPECIFIED`) y `color` envuelto como `{ color: { rgbColor } }` (`OptionalColor`). Un `batchUpdate` con todas las solicitudes (fallback 1 a 1). El servicio avanzado Docs va en `src/appsscript.json` (`enabledAdvancedServices`). Si `Docs` no está activo, loguear aviso (Editor → Servicios → Google Docs API).
7. **Espacios laterales y colapso:** `trimParrafo(paragraph, enCelda)` hace trim de izquierda/derecha **por code points** (`esBlancoCodigo` + `textoCrudoParrafo`, no confiar en `String.trim()`). En texto **no código** (cuerpo y celdas) normaliza `\t` intermedios si `CONFIG.NORMALIZAR_TABS_EN_CELDAS` y colapsa NBSP/exóticos + dobles+ espacios si `CONFIG.COLAPSAR_ESPACIOS_EN_CELDAS`. Los patrones de `replaceText` van con **caracteres Unicode reales** (no `\uXXXX`: RE2 de Docs los rechaza). **Nunca** recortar ni colapsar párrafos con `esTextoCodigo()` ni párrafos de tablas 1x1.
8. **Interlineados independientes:** `CONFIG.INTERLINEADO` (por defecto `1.15`) solo para el cuerpo (`normalizarCuerpo`/`limpiarParrafos`). En tablas de datos usar `CONFIG.INTERLINEADO_TABLA` (por defecto `1.5`) en `procesarTablas`. No forzar un único valor en todo el documento.
9. **Dimensiones de tabla:** si `CONFIG.AJUSTAR_DIMENSIONES_TABLA`, `ajustarDimensionesTabla(table)` hace que la tabla ocupe **siempre** el ancho útil de página (`getPageWidth - margins`); las columnas se reparten proporcionalmente al contenido (longitud de línea × `TAMAÑO_CUERPO * 0.5`), con `setColumnWidth` y la última columna absorbe el resto para que la suma sea exacta. Filas: `setMinimumHeight(0)` para que se adapten al contenido.
10. **Párrafos en blanco / solo-blancos:** `eliminarParrafosVacios()` elimina párrafos cuyo contenido es solo blancos **por code points** (incluye `" "` con `getNumChildren() > 0` y `LIST_ITEM` vacío), salvo tablas 1x1. **No mover** el párrafo siguiente: el contenido real se queda donde está.
11. **Al añadir una nueva función** que se ejecute desde el menú:
    - Registrarla en `onOpen()` dentro del submenú correspondiente (`📑 Títulos…`, `📊 Tablas…`, `📝 Texto…`) o en la raíz si es una acción global
    - Nombrar la función con verbo en infinitivo español (`procesarX`, `limpiarX`, `aplicarX`)
    - Actualizar la tabla del `README.md`
12. **Compatibilidad multi-fichero:** el script vive en varios `.gs` bajo `src/` (pedido explícito del usuario). `clasp push` con `rootDir: src` los sube todos; GAS comparte el ámbito global entre ficheros. El orden de carga no se asume: no usar inicializaciones que dependan de constantes de otro fichero en tiempo de carga (solo en tiempo de ejecución). Para pegado manual en el editor, concatenar en este orden: `config`, `utilidades`, `logs`, `titulos`, `tablas`, `cuerpo`, `ui`.

## Mapa de módulos

| Símbolo | Fichero | Tipo | Responsabilidad |
|---|---|---|---|
| `CONFIG` | `src/config.gs` | objeto | Toda la configuración editable (incl. `INTERLINEADO` 1.15, `INTERLINEADO_TABLA` 1.5, `BORDE_TABLA_*`, `USAR_DOCS_API_BORDES`, `NORMALIZAR_TABS_EN_CELDAS`, `COLAPSAR_ESPACIOS_EN_CELDAS`, `AJUSTAR_DIMENSIONES_TABLA`, flags `DEBUG_*` por defecto en `false`) |
| `PRESETS_TITULOS` | `src/config.gs` | objeto | Regex de títulos por preset |
| `onOpen()` | `src/ui.gs` | UI | Menú `⚡ Formato Pro` con submenús 📑/📊/📝 + ⚙️/📋 |
| `procesarTitulos()` | `src/titulos.gs` | módulo 1 | Aplica H1/H2/H3 según presets/regex |
| `obtenerPatronesTitulo()` | `src/titulos.gs` | util | Resuelve qué regex usar según `CONFIG.PRESET_TITULOS` |
| `procesarTablas()` | `src/tablas.gs` | módulo 2 | Formatea tablas de datos, borde fino/negro, Docs API, ignora 1x1 |
| `aplicarBordesDocsApi(tablas)` | `src/tablas.gs` | util | Bordes vía Docs API `updateTableCellStyle` + `tableStartLocation.index` (batch) |
| `indicesTablasInicio(docId)` | `src/tablas.gs` | util | `startIndex` UTF-16 de tablas de primer nivel (`Docs.Documents.get`) |
| `ajustarDimensionesTabla(table)` | `src/tablas.gs` | util | Tabla = ancho de página; columnas proporcionales al contenido; filas sin min-height |
| `hexARgb(hex)` | `src/tablas.gs` | util | `#000000` → `{red,green,blue}` 0–1 para Docs API |
| `normalizarCuerpo()` | `src/cuerpo.gs` | módulo 3 | Fuente, tamaño, alineación, interlineado del texto normal |
| `aplicarFuenteCuerpo()` | `src/cuerpo.gs` | módulo 4 | Solo tipografía/alineación del cuerpo |
| `eliminarParrafosVacios()` | `src/cuerpo.gs` | módulo 5 | Borra párrafos solo-blancos (code points) y `LIST_ITEM` vacíos (sin mover el siguiente) |
| `limpiarEstilosCopiados()` | `src/cuerpo.gs` | módulo 6 | Limpia fondos, subrayados, tamaños heredados (incl. tablas 1x1) |
| `limpiarParrafos()` | `src/cuerpo.gs` | aux módulo 6 | Lógica por párrafo; distingue código vs normal |
| `recortarEspaciosLaterales()` | `src/cuerpo.gs` | módulo 7 | Trim de espacios izq/der en cuerpo y celdas (no código, no 1x1) |
| `esTablaCodeBlock(table)` | `src/utilidades.gs` | util | true si tabla 1x1 |
| `esTextoCodigo(paragraph)` | `src/utilidades.gs` | util | true si fuente monoespaciada |
| `parrafosDeCelda(cell)` | `src/utilidades.gs` | util | Párrafos de una celda vía `getChild()` |
| `estaEnTablaCodeBlock(paragraph)` | `src/utilidades.gs` | util | true si el párrafo está dentro de una tabla 1x1 |
| `estaEnTablaDatos(paragraph)` | `src/utilidades.gs` | util | true si el párrafo está en tabla de datos (no 1x1) |
| `trimParrafo(paragraph, enCelda?)` | `src/utilidades.gs` | util | Trim por code points; en celdas normaliza `\t` medios y colapsa dobles+/NBSP |
| `hayEspaciosColapsables(texto)` | `src/utilidades.gs` | util | Detecta tabs/NBSP/exóticos o dobles+ espacios en medio |
| `textoCrudoParrafo(paragraph)` | `src/utilidades.gs` | util | Concatena hijos `Text` (fallback `getText()`) |
| `esBlancoCodigo(cp)` | `src/utilidades.gs` | util | true si el code point es blanco/ZWSP/NBSP/BOM… |
| `rangosBlancosLaterales(texto)` | `src/utilidades.gs` | util | Rangos `[ini,fin)` de no-blancos laterales |
| `mostrarDialogoConfig()` | `src/ui.gs` | UI | Modal por secciones (títulos/cuerpo/tablas) con validación y cierre al guardar |
| `aplicarConfiguracion(datos)` | `src/ui.gs` | UI | Guarda valores del modal en `CONFIG` (incl. interlineado tabla) |
| `ejecutarLimpiezaTotal()` | `src/ui.gs` | maestro | Ejecuta todos los módulos en orden |
| `fpLog()` | `src/logs.gs` | util | Log a consola + buffer en memoria |
| `fpFinEjecucion(titulo)` | `src/logs.gs` | util | Guarda logs y abre diálogo solo si `DEBUG_MOSTRAR_DIALOGO` (por defecto `false`) |
| `verUltimosLogs()` | `src/logs.gs` | UI | Menú *📋 Ver resumen* (DocumentProperties); única vía normal de ver logs |

## Cómo añadir un nuevo módulo

1. Crear la función en el `.gs` cuya responsabilidad encaje (ver tabla: `titulos`, `tablas`, `cuerpo`, `utilidades`, `ui`, `config`) con un encabezado `// MÓDULO N: ...`.
2. Si necesita configuración, añadirla al objeto `CONFIG` en `src/config.gs`.
3. Registrarla en `onOpen()` con un `.addItem(...)` (o `.addSubMenu(...)` si agrupa en 📑/📊/📝).
4. Si debe entrar en la limpieza total, llamarla desde `ejecutarLimpiezaTotal()` en el orden correcto.
5. Actualizar `README.md` (tabla de opciones) y este archivo (mapa de módulos).

## Prompt maestro

Para tareas de mantenimiento/iteración con un agente, usa el prompt de [`docs/PROMPT_MAESTRO.md`](docs/PROMPT_MAESTRO.md).

## Depuración (clasp + logs)

Flujo profesional OpenCode ↔ GAS documentado en [`docs/DEPURACION.md`](docs/DEPURACION.md):

1. Modificar el `.gs` correspondiente de `src/`.
2. Usar `console.log()` / `CONFIG.DEBUG_TIEMPOS` para instrumentar.
3. `clasp push` → ejecutar en Google Docs → `clasp logs --watch`.
4. Corregir según el error real de Cloud Logging (no inventar APIs).

**Regla de logs:** usar `fpLog(...)` (`src/logs.gs`) — acumula en memoria; el diálogo modal **no se abre** por defecto (`CONFIG.DEBUG_MOSTRAR_DIALOGO: false`; reactivable en `config.gs`). Guarda las últimas líneas en `DocumentProperties` (menú *📋 Ver resumen*). `console.log` solo dentro de `fpLog`. **No depender de `clasp logs`** (puede no estar configurado).

**Tipos:** el repo incluye `@types/google-apps-script` en `package.json` — al modificar el script, respetar la API real de `DocumentApp` (no inventar métodos).
