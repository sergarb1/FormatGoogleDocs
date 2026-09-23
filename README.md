# ⚡ Formato Pro — Normalizador de documentos para Google Docs

Script de **Google Apps Script** que limpia y normaliza documentos de Google Docs generados al copiar y pegar contenido de HTML/webs externas. Diseñado para documentos técnicos con **títulos, tablas de datos, texto normal y bloques de código (CodeBlocks)**.

## Características

- **Jerarquía de títulos** automática (H1, H2, H3) con presets:
  - Numérico: `1.`, `1.1`, `1.1.1`, `1 -`, etc.
  - Markdown: `#`, `##`, `###`
  - Ambos (recomendado) o expresiones regulares personalizadas
- **Tablas de datos** con cabecera gris, negrita y espaciado limpio
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
| 2. Formatear tablas de datos | Cabecera gris + negrita + espaciado uniforme (ignora tablas 1×1) |
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
  TRATAR_TABLA_1X1_COMO_CODIGO: true
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

## Estructura del repo

```
FormatGoogleDocs/
├── LICENSE                 # AGPL v3.0
├── README.md               # Este archivo
├── AGENTS.md               # Reglas para agentes IA que mantengan el repo
├── src/
│   └── Code.gs             # Script principal listo para Apps Script
└── docs/
    └── PROMPT_MAESTRO.md   # Prompt para OpenCode / Claude / otros agentes
```

## Licencia

[AGPL v3.0](LICENSE)
