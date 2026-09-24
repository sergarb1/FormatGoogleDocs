/**
 * SISTEMA DE NORMALIZACIÓN DE DOCUMENTOS (V3)
 * Formato Pro para Google Docs — modular, configurable y compatible con OpenCode.
 *
 * Licencia: AGPL v3.0
 */

// ==========================================
// CONFIGURACIÓN CENTRAL
// ==========================================
const CONFIG = {
  // Cuerpo de texto
  FUENTE_CUERPO: 'Calibri',
  TAMAÑO_CUERPO: 12,
  ALINEACION_CUERPO: DocumentApp.HorizontalAlignment.JUSTIFY, // JUSTIFY | LEFT | CENTER | RIGHT
  INTERLINEADO: 1.15,
  ESPACIO_ANTES: 0,
  ESPACIO_DESPUES: 8,

  // Preset de detección de títulos.
  // DEFECTO = 'GUION_LARGO' (solo "—" / "–").
  // 'GUION' = ambos tipos (largo y corto "-").
  // También: 'GUION_CORTO', 'PUNTO', 'MARKDOWN', 'MIXTO', 'PERSONALIZADO'
  PRESET_TITULOS: 'GUION_LARGO',

  // Regex personalizadas (solo se usan si PRESET_TITULOS = 'PERSONALIZADO')
  // Cada entrada: { nivel: 1|2|3, regex: RegExp }
  PATRONES_PERSONALIZADOS: [],

  // Protección de bloques de código
  IGNORAR_CODEBLOCKS_EN_FORMATO: true,

  // Fuentes consideradas monoespaciadas (código)
  FUENTES_CODIGO: [
    'Consolas', 'Courier New', 'Monospace', 'Roboto Mono',
    'Menlo', 'Source Code Pro', 'Fira Code', 'Droid Sans Mono',
    'Liberation Mono', 'Ubuntu Mono', 'JetBrains Mono', 'Inconsolata'
  ],

  // Tablas 1x1 asumidas como CodeBlock (no se les aplica formato de tabla)
  TRATAR_TABLA_1X1_COMO_CODIGO: true,

  // Bordes de tablas de datos (cuadrícula completa)
  BORDE_TABLA_GROSOR: 1, // puntos
  BORDE_TABLA_COLOR: '#000000',
  // Docs API (updateTableCellStyle) para forzar bordes en HTML pegado
  USAR_DOCS_API_BORDES: true,

  // Texto normal (no código): \t intermedio → espacio simple
  NORMALIZAR_TABS_EN_CELDAS: true,

  // Texto normal (no código): dobles+ espacios (y NBSP) intermedios → un espacio
  COLAPSAR_ESPACIOS_EN_CELDAS: true,

  // Tablas de datos: interlineado de celdas (independiente del cuerpo)
  INTERLINEADO_TABLA: 1.5,

  // Tablas de datos: la tabla ocupa SIEMPRE el ancho útil de página;
  // las columnas se reparten proporcionalmente al contenido
  AJUSTAR_DIMENSIONES_TABLA: true,

  // Logs de tiempo por módulo (ven en el diálogo de logs al final)
  DEBUG_TIEMPOS: false,

  // Logs detallados de tablas/trim/Docs API
  DEBUG_TABLAS: false,

  // Al terminar un menú: mostrar diálogo modal con los logs (sin clasp logs)
  // Desactivado por defecto; se puede reactivar aquí o en el diálogo ⚙️
  DEBUG_MOSTRAR_DIALOGO: false
};

// Presets de expresiones regulares para títulos.
// El orden de niveles (3 → 2 → 1) importa: se aplica el primer match.
// Dos tipos de guion:
//   CORTO "-" (U+002D) y LARGO "–" en dash (U+2013) / "—" em dash (U+2014).
// DEFECTO = GUION_LARGO (solo largo). GUION coge los dos.
const PRESETS_TITULOS = {
  // Ambos tipos: "1 — ", "1 – ", "1 - ", "1.2 — ", "1.2.3 – "
  GUION: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+\s*[-–—]\s+/ },
    { nivel: 2, regex: /^\d+\.\d+\s*[-–—]\s+/ },
    { nivel: 1, regex: /^\d+\s*[-–—]\s+/ }
  ],
  // DEFECTO — solo guion LARGO: "1 — ", "1.2 – "
  GUION_LARGO: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+\s*[–—]\s+/ },
    { nivel: 2, regex: /^\d+\.\d+\s*[–—]\s+/ },
    { nivel: 1, regex: /^\d+\s*[–—]\s+/ }
  ],
  // Solo guion CORTO (hífen ASCII): "1 - ", "1.2 - "
  GUION_CORTO: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+\s*-\s+/ },
    { nivel: 2, regex: /^\d+\.\d+\s*-\s+/ },
    { nivel: 1, regex: /^\d+\s*-\s+/ }
  ],
  // Punto clásico: "1. ", "1.2. ", "1.2.3. "
  PUNTO: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+\.\s+/ },
    { nivel: 2, regex: /^\d+\.\d+\.\s+/ },
    { nivel: 1, regex: /^\d+\.\s+/ }
  ],
  // Markdown: "# ", "## ", "### "
  MARKDOWN: [
    { nivel: 3, regex: /^#{3,}\s+/ },
    { nivel: 2, regex: /^##\s+/ },
    { nivel: 1, regex: /^#\s+/ }
  ],
  // Mixto: punto, guion (corto y largo) y Markdown
  MIXTO: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+\s*[-.–—:]\s+/ },
    { nivel: 2, regex: /^\d+\.\d+\s*[-.–—:]\s+/ },
    { nivel: 1, regex: /^\d+\s*[-.–—:]\s+/ },
    { nivel: 3, regex: /^#{3,}\s+/ },
    { nivel: 2, regex: /^##\s+/ },
    { nivel: 1, regex: /^#\s+/ }
  ],
  // Compatibilidad con nombres antiguos
  NUMERICO: null, // se resuelve a PUNTO
  AMBOS: null,    // se resuelve a MIXTO
  PERSONALIZADO: []
};
