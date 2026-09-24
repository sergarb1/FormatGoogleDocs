# ⚡ Formato Pro — Normalizador de documentos para Google Docs

Script de **Google Apps Script** que limpia y normaliza documentos de Google Docs generados al copiar y pegar contenido de HTML/webs externas. Diseñado para documentos técnicos con **títulos, tablas de datos, texto normal y bloques de código (CodeBlocks)**.

## Características

- **Jerarquía de títulos** automática (H1, H2, H3) con presets seleccionables:
  - **Guion largo (defecto)**: `1 — `, `1 – `
  - Guion ambos: largo `—`/`–` **y corto** `1 - `
  - Solo guion corto: `1 - `, `1.2 - `
  - Punto: `1. `, `1.2. `, `1.2.3. `
  - Markdown: `#`, `##`, `###`
  - Mixto: punto + guion + Markdown
  - O expresiones regulares personalizadas (`PERSONALIZADO`)
- **Cuerpo de texto** por defecto: **Calibri 12, justificado**, interlineado 1.15 (todo configurable)
- **Tablas de datos**: trim de espacios/tabs en celdas (tabs intermedios → espacio), cabecera en **negrita + centrada + gris** (`#dadce0`), resto **justificado y sin fondo**, **cuadrícula con borde fino y negro** vía DocumentApp + Docs API, **interlineado de celdas 1.5** (independiente del cuerpo), tabla al **ancho útil de página** con columnas proporcionales al contenido (ignora tablas 1×1)
- **Protección de CodeBlocks**: detecta tablas 1×1 y fuentes monoespaciadas (`Consolas`, `Courier New`, `Roboto Mono`, `Fira Code`, `JetBrains Mono`…) y no les aplica formato de cuerpo ni recorte de espacios
- **Espacios laterales**: recorta espacios/tabs sueltos (por code points, no solo `String.trim`) a izquierda y derecha en párrafos del cuerpo y en celdas; en texto no código colapsa dobles+ espacios intermedios, NBSP y tabs (no toca código)
- **Limpieza de párrafos y viñetas vacíos**: borra párrafos en blanco y viñetas sin contenido **sin mover** la línea siguiente
- **Limpieza de estilos copiados**: fondos heredados, subrayados, tamaños de fuente dispares, espaciados de pegado — también dentro de tablas 1×1, sin romper la monoespaciada del código
- **Diálogo de configuración** (secciones, labels, validación, feedback) para cambiar preset, tipografía, **interlineado del cuerpo (1.15)** e **interlineado de tablas (1.5)** sin tocar el código
- **Menú agrupado** por intención: Limpieza completa + submenús 📑 Títulos / 📊 Tablas / 📝 Cuerpo + ⚙️ / 📋
- **Ejecución maestra** con un solo clic

## Instalación

1. Abre tu documento en **Google Docs**.
2. Ve a **Extensiones → Apps Script**.
3. **Opción A — clasp (recomendada si desarrollas con este repo):** `clasp push` sube todos los `.gs` de `src/`.
4. **Opción B — manual:** borra el archivo `Code.gs` por defecto. Crea un fichero por cada `.gs` de [`src/`](src/) (`config`, `utilidades`, `logs`, `titulos`, `tablas`, `cuerpo`, `ui`) y pega el contenido de cada uno (o concatena todo en un solo `Code.gs`, en este orden).
5. Si usas bordes por Docs API: en el editor → **Servicios → + → Google Docs API** (debe aparecer como `Docs`).
6. **Guarda** (💾 o `Ctrl/Cmd + S`) y **recarga** la pestaña del documento.
7. Aparecerá el menú **⚡ Formato Pro** en la barra de Google Docs.

> Si es la primera vez que usas Apps Script, Google te pedirá autorizar permisos sobre tus documentos. Acepta y vuelve a recargar.

## Uso

| Opción del menú | Qué hace |
|---|---|
| ✨ Limpieza completa (recomendado) | Ejecuta todos los módulos en orden optimizado |
| 📑 Títulos y estructura → Detectar títulos | Convierte líneas que parecen títulos en H1/H2/H3 |
| 📑 Títulos y estructura → Quitar líneas y viñetas vacías | Elimina párrafos en blanco y viñetas sin texto (la línea siguiente no se mueve) |
| 📊 Tablas de datos → Formatear tablas | Trim en celdas, cabecera negrita/centrada/gris, borde fino y negro, interlineado de celdas 1.5, resto justificado sin fondo (ignora 1×1). La tabla ocupa el ancho útil de página y las columnas se reparten proporcionalmente al contenido |
| 📝 Texto del cuerpo → Normalizar cuerpo | Aplica fuente, tamaño, alineación e interlineado (1.15) al texto normal |
| 📝 Texto del cuerpo → Recortar espacios sobrantes | Quita espacios/tabs sueltos a izquierda/derecha en cuerpo y celdas (no toca código) |
| 📝 Texto del cuerpo → Solo fuente y alineación | Solo aplica tipografía/alineación sin tocar el resto |
| 📝 Texto del cuerpo → Limpiar estilos pegados de la web | Quita fondos, subrayados y tamaños heredados del pegado (incluye CodeBlocks) |
| ⚙️ Configurar… | Diálogo con secciones (títulos / cuerpo / tablas), validación y cierre al guardar |
| 📋 Ver resumen | Reabre los logs de la última ejecución (solo bajo demanda; no se abren solos) |

## Configuración rápida

El bloque `CONFIG` en [`src/config.gs`](src/config.gs) permite editar valores sin buscar por todo el código:

```javascript
const CONFIG = {
  FUENTE_CUERPO: 'Calibri',
  TAMAÑO_CUERPO: 12,
  ALINEACION_CUERPO: DocumentApp.HorizontalAlignment.JUSTIFY,
  INTERLINEADO: 1.15, // solo cuerpo (fuera de tablas)
  ESPACIO_ANTES: 0,
  ESPACIO_DESPUES: 8,
  PRESET_TITULOS: 'GUION_LARGO', // 'GUION_LARGO' (defecto) | 'GUION' | 'GUION_CORTO' | 'PUNTO' | 'MARKDOWN' | 'MIXTO' | 'PERSONALIZADO'
  PATRONES_PERSONALIZADOS: [], // solo si PRESET_TITULOS = 'PERSONALIZADO'
  IGNORAR_CODEBLOCKS_EN_FORMATO: true,
  FUENTES_CODIGO: [ 'Consolas', 'Courier New', /* ... */ ],
  TRATAR_TABLA_1X1_COMO_CODIGO: true,
  BORDE_TABLA_GROSOR: 1, // puntos (cuadrícula de tablas de datos)
  BORDE_TABLA_COLOR: '#000000',
  USAR_DOCS_API_BORDES: true, // Docs API updateTableCellStyle (requiere servicio Docs)
  NORMALIZAR_TABS_EN_CELDAS: true, // \t intermedio en texto normal → espacio
  COLAPSAR_ESPACIOS_EN_CELDAS: true, // dobles+/NBSP intermedios en texto normal → un espacio
  INTERLINEADO_TABLA: 1.5, // interlineado de celdas de tablas de datos (independiente del cuerpo)
  AJUSTAR_DIMENSIONES_TABLA: true, // tabla = ancho de página; columnas proporcionales al contenido
  DEBUG_TIEMPOS: false, // tiempos por módulo (solo si reactivas el diálogo de logs)
  DEBUG_TABLAS: false, // logs de tablas/trim/Docs API
  DEBUG_MOSTRAR_DIALOGO: false // no abrir diálogo al terminar; logs solo vía 📋 Ver resumen
};
```

### Personalizar regex de títulos

```javascript
PRESET_TITULOS: 'PERSONALIZADO',
PATRONES_PERSONALIZADOS: [
  { nivel: 1, regex: /^CAP[IÍ]TULO\s+\d+/i },  // CAPÍTULO 1
  { nivel: 2, regex: /^##\s+/ },
  { nivel: 3, regex: /^\d+\.\d+\.\d+\s+/ }
]
```

**Importante:** el orden importa — se aplica el **primer** patrón que coincida.

## Depuración con OpenCode + clasp (MCP)

**Logs sin clasp:** por defecto **no se abren solos** (`DEBUG_MOSTRAR_DIALOGO: false`). Si algo falla o quieres revisar, usa el menú **📋 Ver resumen** (los `fpLog` siguen acumulándose y se guardan en `DocumentProperties`). Para reactivar el diálogo automático al terminar un menú, pon `DEBUG_MOSTRAR_DIALOGO: true` en `CONFIG`.

Para desarrollar e iterar sin copiar/pegar a mano: instala `clasp`, clona el script, y usa `clasp push` para subir cambios (los logs ya no dependen de `clasp logs`).

Guía completa: **[docs/DEPURACION.md](docs/DEPURACION.md)**

### 1. Instalar dependencias del repo

```bash
npm install
```

Instala `@types/google-apps-script` y `typescript` (el editor/la IA ven la API real de `DocumentApp`).

### 2. Instalar clasp y entrar con tu cuenta

```bash
npm install -g @google/clasp
clasp login
```

Activa también la API: https://script.google.com/home/usersettings → **API de Apps Script** → ON.

### 3. ¿De dónde saco el ID del script?

El **ID del script** es el identificador largo del proyecto de Apps Script vinculado a tu documento (no es el ID de la URL de Google Docs).

**Ruta 1 — desde el editor de Apps Script (recomendada):**

1. Abre tu documento en Google Docs.
2. **Extensiones → Apps Script** (se abre el editor en otra pestaña).
3. En el editor, **Configuración** (icono de engranaje, columna izquierda).
4. En la sección **Propiedades del proyecto**, copia el valor de **ID del script**.
   - Formato parecido a: `1AbC…xyz_…` o `1BxiM…` (alfanumérico largo).

**Ruta 2 — desde la URL del editor:**

Con el editor de Apps Script abierto, mira la barra de direcciones:

```
https://script.google.com/d/ESTE_ES_EL_ID/edit
                               ^^^^^^^^^^^^^^^^
```

Copia solo la parte entre `/d/` y `/edit`.

**Ruta 3 — solo el script (si el Docs ya está vinculado):**

También aparece en **Extensiones → Apps Script → Configuración → ID del script** (mismo valor que Ruta 1).

> ⚠️ El ID de la **URL de Google Docs** (`document/d/…`) **no sirve**. Usa el del editor de Apps Script.

### 4. Clonar, editar, subir

```bash
clasp clone "AQUI_TU_ID_DE_SCRIPT"
# OpenCode modifica el .js/.gs local
clasp push
# Ejecuta en Google Docs, luego:
clasp logs --watch
```

`clasp clone` crea `.clasp.json` con ese ID: **está en `.gitignore`** (no se commitea; el ID y credenciales no suben al repo).

> 🔒 **Nunca pegues el ID del script en archivos del repo** (`README`, `*.gs`, `package.json`…). Vive solo en `.clasp.json` / `.clasprc.json`, ambos ignorados por git.

También puedes usar el **Debug** del editor de Apps Script (icono insecto) para breakpoints visuales.

## Estructura del repo

```
FormatGoogleDocs/
├── LICENSE                 # AGPL v3.0
├── README.md               # Este archivo
├── AGENTS.md               # Reglas para agentes IA que mantengan el repo
├── package.json            # Tipos @types/google-apps-script + scripts check/typecheck
├── src/
│   ├── appsscript.json     # Manifiesto (Docs API avanzada habilitada)
│   ├── config.gs           # CONFIG + PRESETS_TITULOS
│   ├── utilidades.gs       # Helpers de nodos/código + trimParrafo
│   ├── logs.gs             # fpLog + diálogo de logs (sin clasp logs)
│   ├── titulos.gs          # Módulo 1: jerarquía de títulos
│   ├── tablas.gs           # Módulo 2: tablas de datos + Docs API bordes
│   ├── cuerpo.gs           # Módulos 3–7: cuerpo, vacíos, estilos, trim
│   └── ui.gs               # Menú, diálogo, ejecución maestra
└── docs/
    ├── PROMPT_MAESTRO.md   # Prompt para OpenCode / Claude / otros agentes
    └── DEPURACION.md       # Flujo clasp + MCP + logs en local
```

## Licencia

[AGPL v3.0](LICENSE)
