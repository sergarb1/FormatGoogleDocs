# ⚡ Formato Pro — Normalizador de documentos para Google Docs

Script de **Google Apps Script** que limpia y normaliza documentos de Google Docs generados al copiar y pegar contenido de HTML/webs externas. Diseñado para documentos técnicos con **títulos, tablas de datos, texto normal y bloques de código (CodeBlocks)**.

## Características

- **Jerarquía de títulos** automática (H1, H2, H3) con presets:
  - Numérico: `1.`, `1.1`, `1.1.1`, `1 -`, etc.
  - Markdown: `#`, `##`, `###`
  - Ambos (recomendado) o expresiones regulares personalizadas
- **Tablas de datos**: trim de espacios en celdas, cabecera en **negrita + centrada + gris** (`#dadce0`), resto **justificado y sin fondo** (ignora tablas 1×1)
- **Protección de CodeBlocks**: detecta tablas 1×1 y fuentes monoespaciadas (`Consolas`, `Courier New`, `Roboto Mono`, `Fira Code`, `JetBrains Mono`…) y no les aplica formato de cuerpo
- **Cuerpo de texto** por defecto: **Calibri 12, justificado**, interlineado 1.15 (todo configurable)
- **Limpieza de párrafos vacíos** consecutivos
- **Limpieza de estilos copiados**: fondos heredados, subrayados, tamaños de fuente dispares, espaciados de pegado — también dentro de tablas 1×1, sin romper la monoespaciada del código
- **Diálogo de configuración** para cambiar preset de títulos, fuente, tamaño, alineación e interlineado sin tocar el código
- **Ejecución maestra** con un solo clic

## Instalación

1. Abre tu documento en **Google Docs**.
2. Ve a **Extensiones → Apps Script**.
3. Borra el contenido del archivo `Code.gs` por defecto.
4. Copia y pega todo el contenido de [`src/Code.gs`](src/Code.gs).
5. **Guarda** (💾 o `Ctrl/Cmd + S`) y **recarga** la pestaña del documento.
6. Aparecerá el menú **⚡ Formato Pro** en la barra de Google Docs.

> Si es la primera vez que usas Apps Script, Google te pedirá autorizar permisos sobre tus documentos. Acepta y vuelve a recargar.

## Uso

| Opción del menú | Qué hace |
|---|---|
| 1. Detectar y aplicar jerarquía de títulos | Convierte líneas que parecen títulos en H1/H2/H3 |
| 2. Formatear tablas de datos | Trim en celdas, cabecera negrita/centrada/gris, resto justificado sin fondo (ignora 1×1) |
| 3. Normalizar cuerpo de texto | Aplica fuente, tamaño, alineación e interlineado al texto normal |
| 4. Limpiar saltos de línea vacíos | Elimina párrafos en blanco consecutivos |
| 5. Limpiar estilos copiados | Quita fondos, subrayados y tamaños heredados del pegado (incluye CodeBlocks) |
| 6. Aplicar alineación y fuente del cuerpo | Solo aplica tipografía/alineación sin tocar el resto |
| ⚙️ Configurar opciones… | Diálogo para elegir preset de títulos, fuente, tamaño, alineación, interlineado |
| 🚀 Ejecutar limpieza completa | Ejecuta todos los módulos en orden optimizado |

## Configuración rápida

El bloque `CONFIG` al principio de [`src/Code.gs`](src/Code.gs) permite editar valores sin buscar por todo el archivo:

```javascript
const CONFIG = {
  FUENTE_CUERPO: 'Calibri',
  TAMAÑO_CUERPO: 12,
  ALINEACION_CUERPO: DocumentApp.HorizontalAlignment.JUSTIFY,
  INTERLINEADO: 1.15,
  PRESET_TITULOS: 'AMBOS', // 'NUMERICO' | 'MARKDOWN' | 'AMBOS' | 'PERSONALIZADO'
  PATRONES_PERSONALIZADOS: [], // para PRESET_TITULOS = 'PERSONALIZADO'
  IGNORAR_CODEBLOCKS_EN_FORMATO: true,
  FUENTES_CODIGO: [ 'Consolas', 'Courier New', /* ... */ ],
  TRATAR_TABLA_1X1_COMO_CODIGO: true,
  DEBUG_TIEMPOS: true // logs por módulo en Execution log / clasp logs
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

Para desarrollar e iterar sin copiar/pegar a mano: instala `clasp`, clona el script, y usa `clasp push` + `clasp logs --watch` para que la IA lea los `console.log()` y errores de Google en local.

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

> 🔒 **Nunca pegues el ID del script en archivos del repo** (`README`, `Code.gs`, `package.json`…). Vive solo en `.clasp.json` / `.clasprc.json`, ambos ignorados por git.

También puedes usar el **Debug** del editor de Apps Script (icono insecto) para breakpoints visuales.

## Estructura del repo

```
FormatGoogleDocs/
├── LICENSE                 # AGPL v3.0
├── README.md               # Este archivo
├── AGENTS.md               # Reglas para agentes IA que mantengan el repo
├── package.json            # Tipos @types/google-apps-script para la IA
├── src/
│   └── Code.gs             # Script principal listo para Apps Script
└── docs/
    ├── PROMPT_MAESTRO.md   # Prompt para OpenCode / Claude / otros agentes
    └── DEPURACION.md       # Flujo clasp + MCP + logs en local
```

## Licencia

[AGPL v3.0](LICENSE)
