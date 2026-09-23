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

  // Preset de detección de títulos: 'NUMERICO' | 'MARKDOWN' | 'AMBOS' | 'PERSONALIZADO'
  PRESET_TITULOS: 'AMBOS',

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
  TRATAR_TABLA_1X1_COMO_CODIGO: true
};

// Presets de expresiones regulares para títulos
const PRESETS_TITULOS = {
  NUMERICO: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+[\.\-:]?\s+/ },        // 1.1.1
    { nivel: 2, regex: /^\d+\.\d+[\.\-:]?\s+/ },             // 1.1
    { nivel: 1, regex: /^\d+[\.\-:]\s+/ }                    // 1.  /  1 -
  ],
  MARKDOWN: [
    { nivel: 3, regex: /^#{3,}\s+/ },                        // ### Título
    { nivel: 2, regex: /^##\s+/ },                           // ## Título
    { nivel: 1, regex: /^#\s+/ }                             // # Título
  ],
  AMBOS: [
    { nivel: 3, regex: /^\d+\.\d+\.\d+[\.\-:]?\s+/ },
    { nivel: 3, regex: /^#{3,}\s+/ },
    { nivel: 2, regex: /^\d+\.\d+[\.\-:]?\s+/ },
    { nivel: 2, regex: /^##\s+/ },
    { nivel: 1, regex: /^\d+[\.\-:]\s+/ },
    { nivel: 1, regex: /^#\s+/ }
  ],
  PERSONALIZADO: []
};

// ==========================================
// MENÚ
// ==========================================
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('⚡ Formato Pro')
    .addItem('1. Detectar y aplicar jerarquía de títulos (H1, H2, H3)', 'procesarTitulos')
    .addItem('2. Formatear tablas de datos (ignorando CodeBlocks)', 'procesarTablas')
    .addItem('3. Normalizar cuerpo de texto (ignorando código)', 'normalizarCuerpo')
    .addItem('4. Limpiar saltos de línea vacíos', 'eliminarParrafosVacios')
    .addItem('5. Limpiar estilos copiados (incl. tablas 1x1)', 'limpiarEstilosCopiados')
    .addItem('6. Aplicar alineación y fuente del cuerpo', 'aplicarFuenteCuerpo')
    .addSeparator()
    .addItem('⚙️ Configurar opciones…', 'mostrarDialogoConfig')
    .addItem('🚀 Ejecutar limpieza completa', 'ejecutarLimpiezaTotal')
    .addToUi();
}

// ==========================================
// MÓDULO 1: JERARQUÍA DE TÍTULOS
// ==========================================
function procesarTitulos() {
  const body = DocumentApp.getActiveDocument().getBody();
  const paragraphs = body.getParagraphs();
  const patrones = obtenerPatronesTitulo();

  paragraphs.forEach(p => {
    const text = p.getText().trim();
    if (text.length === 0) return;
    if (CONFIG.IGNORAR_CODEBLOCKS_EN_FORMATO && esTextoCodigo(p)) return;

    for (let i = 0; i < patrones.length; i++) {
      const patron = patrones[i];
      if (patron.regex.test(text)) {
        if (patron.nivel === 1) {
          p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        } else if (patron.nivel === 2) {
          p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
        } else if (patron.nivel === 3) {
          p.setHeading(DocumentApp.ParagraphHeading.HEADING3);
        }
        return; // Aplicar el primer patrón que coincida (orden importa)
      }
    }
  });
}

function obtenerPatronesTitulo() {
  if (CONFIG.PRESET_TITULOS === 'PERSONALIZADO') {
    return CONFIG.PATRONES_PERSONALIZADOS;
  }
  return PRESETS_TITULOS[CONFIG.PRESET_TITULOS] || PRESETS_TITULOS.AMBOS;
}

// ==========================================
// MÓDULO 2: PROCESAMIENTO DE TABLAS
// ==========================================
function procesarTablas() {
  const tables = DocumentApp.getActiveDocument().getBody().getTables();

  tables.forEach(table => {
    if (CONFIG.TRATAR_TABLA_1X1_COMO_CODIGO && esTablaCodeBlock(table)) return;

    const numRows = table.getNumRows();
    for (let r = 0; r < numRows; r++) {
      const row = table.getRow(r);
      const esCabecera = (r === 0);

      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);

        if (esCabecera) {
          cell.setBackgroundColor('#f1f3f4');
        }

        for (let p = 0; p < cell.getNumChildren(); p++) {
          const child = cell.getChild(p);
          if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
            const paragraph = child.asParagraph();
            paragraph.setLineSpacing(1.0);
            paragraph.setSpacingBefore(0);
            paragraph.setSpacingAfter(0);

            if (esCabecera) {
              paragraph.setBold(true);
            }
          }
        }
      }
    }
  });
}

// ==========================================
// MÓDULO 3: NORMALIZACIÓN DE CUERPO
// ==========================================
function normalizarCuerpo() {
  const paragraphs = DocumentApp.getActiveDocument().getBody().getParagraphs();

  paragraphs.forEach(p => {
    const heading = p.getHeading();
    const esNormal = heading === DocumentApp.ParagraphHeading.NORMAL;
    const tieneTexto = p.getText().length > 0;

    if (esNormal && tieneTexto) {
      // Proteger código monoespaciado: no cambiar familia/tamaño, pero sí espaciado si se desea
      if (CONFIG.IGNORAR_CODEBLOCKS_EN_FORMATO && esTextoCodigo(p)) return;

      p.setLineSpacing(CONFIG.INTERLINEADO);
      p.setSpacingBefore(CONFIG.ESPACIO_ANTES);
      p.setSpacingAfter(CONFIG.ESPACIO_DESPUES);
      p.setFontFamily(CONFIG.FUENTE_CUERPO);
      p.setFontSize(CONFIG.TAMAÑO_CUERPO);
      p.setAlignment(CONFIG.ALINEACION_CUERPO);
    }
  });
}

// ==========================================
// MÓDULO 4: APLICAR FUENTE / ALINEACIÓN (acción dedicada)
// ==========================================
function aplicarFuenteCuerpo() {
  const paragraphs = DocumentApp.getActiveDocument().getBody().getParagraphs();

  paragraphs.forEach(p => {
    if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) return;
    if (p.getText().length === 0) return;
    if (CONFIG.IGNORAR_CODEBLOCKS_EN_FORMATO && esTextoCodigo(p)) return;

    p.setFontFamily(CONFIG.FUENTE_CUERPO);
    p.setFontSize(CONFIG.TAMAÑO_CUERPO);
    p.setAlignment(CONFIG.ALINEACION_CUERPO);
  });
}

// ==========================================
// MÓDULO 5: LIMPIEZA DE PÁRRAFOS VACÍOS
// ==========================================
function eliminarParrafosVacios() {
  const paragraphs = DocumentApp.getActiveDocument().getBody().getParagraphs();

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    if (p.getText().trim() === '' && p.getNumChildren() === 0) {
      p.removeFromParent();
    }
  }
}

// ==========================================
// MÓDULO 6: LIMPIAR ESTILOS COPIADOS
// ==========================================
// Elimina fondos heredados, subrayados, tamaños dispares y espaciados de pegado.
// Aplica también a tablas 1x1 (CodeBlocks), pero NUNCA cambia la familia monoespaciada.
function limpiarEstilosCopiados() {
  const body = DocumentApp.getActiveDocument().getBody();

  // 1) Párrafos del cuerpo
  limpiarParrafos(body.getParagraphs());

  // 2) Párrafos dentro de todas las tablas (incl. 1x1)
  const tables = body.getTables();
  tables.forEach(table => {
    const numRows = table.getNumRows();
    for (let r = 0; r < numRows; r++) {
      const row = table.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        limpiarParrafos(cell.getParagraphs());
        // Quitar color de fondo heredado en celdas que no sean cabecera de tabla de datos
        // (solo si no es 1x1, para no alterar el aspecto visual del CodeBlock salvo estilos de texto)
        if (!(CONFIG.TRATAR_TABLA_1X1_COMO_CODIGO && esTablaCodeBlock(table))) {
          if (r !== 0) {
            cell.setBackgroundColor(null);
          }
        }
      }
    }
  });
}

function limpiarParrafos(paragraphs) {
  paragraphs.forEach(p => {
    if (p.getText().trim() === '') return;

    const esCodigo = esTextoCodigo(p);

    // Espaciado heredado de copiar/pegar
    p.setSpacingBefore(0);
    p.setSpacingAfter(CONFIG.ESPACIO_DESPUES);
    p.setLineSpacing(CONFIG.INTERLINEADO);

    if (!esCodigo) {
      // Solo normalizar familia/tamaño si NO es código
      p.setFontFamily(CONFIG.FUENTE_CUERPO);
      p.setFontSize(CONFIG.TAMAÑO_CUERPO);
      p.setAlignment(CONFIG.ALINEACION_CUERPO);
      p.setBackgroundColor(null);
      // Quitar subrayado heredado si no es enlace
      const links = p.getLinkUrl();
      if (!links) {
        p.setUnderline(false);
      }
    } else {
      // En código: limpiar solo fondos y subrayados heredados, preservar monoespaciada
      p.setBackgroundColor(null);
      const links = p.getLinkUrl();
      if (!links) {
        p.setUnderline(false);
      }
      // Normalizar espaciado interno sin tocar familia
      p.setLineSpacing(1.0);
      p.setSpacingBefore(0);
      p.setSpacingAfter(4);
    }

    // Normalizar tamaños de fuente dispares en runs de texto (solo si no es código)
    if (!esCodigo) {
      const numChars = p.getText().length;
      if (numChars > 0) {
        for (let i = 0; i < numChars; i++) {
          try {
            p.setFontSize(i, i, CONFIG.TAMAÑO_CUERPO);
          } catch (e) {
            // Ignorar rangos no editables (ej. elementos especiales)
          }
        }
      }
    }
  });
}

// ==========================================
// UTILIDADES (DETECCIÓN DE CÓDIGO)
// ==========================================

// Tabla de 1 fila x 1 columna → asumimos CodeBlock
function esTablaCodeBlock(table) {
  return (table.getNumRows() === 1 && table.getRow(0).getNumCells() === 1);
}

// Comprueba si el párrafo usa fuentes de programación típicas
function esTextoCodigo(paragraph) {
  const font = paragraph.getFontFamily();
  if (!font) return false;
  return CONFIG.FUENTES_CODIGO.indexOf(font) !== -1;
}

// ==========================================
// DIÁLOGO DE CONFIGURACIÓN
// ==========================================
function mostrarDialogoConfig() {
  const html = HtmlService.createHtmlOutput(
    `
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; margin: 12px; }
      label { display: block; margin-top: 10px; font-weight: bold; }
      select, input { width: 100%; padding: 6px; margin-top: 4px; box-sizing: border-box; }
      button { margin-top: 16px; padding: 8px 16px; background: #1a73e8; color: #fff;
               border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
      button:hover { background: #1557b0; }
      .hint { color: #666; font-size: 11px; font-weight: normal; margin-top: 2px; }
    </style>
    <div>
      <label>Preset de títulos</label>
      <select id="preset">
        <option value="AMBOS">Numérico + Markdown (recomendado)</option>
        <option value="NUMERICO">Solo numérico (1., 1.1, 1.1.1)</option>
        <option value="MARKDOWN">Solo Markdown (#, ##, ###)</option>
      </select>

      <label>Fuente del cuerpo</label>
      <input id="fuente" type="text" value="${CONFIG.FUENTE_CUERPO}" />

      <label>Tamaño de fuente</label>
      <input id="tamano" type="number" min="6" max="72" value="${CONFIG.TAMAÑO_CUERPO}" />

      <label>Alineación</label>
      <select id="alineacion">
        <option value="JUSTIFY" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.JUSTIFY ? 'selected' : ''}>Justificado</option>
        <option value="LEFT" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.LEFT ? 'selected' : ''}>Izquierda</option>
        <option value="CENTER" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.CENTER ? 'selected' : ''}>Centrado</option>
        <option value="RIGHT" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.RIGHT ? 'selected' : ''}>Derecha</option>
      </select>

      <label>Interlineado</label>
      <input id="interlineado" type="number" step="0.05" min="0.5" max="3" value="${CONFIG.INTERLINEADO}" />

      <button onclick="guardar()">Guardar</button>
    </div>
    <script>
      function guardar() {
        const datos = {
          preset: document.getElementById('preset').value,
          fuente: document.getElementById('fuente').value,
          tamano: document.getElementById('tamano').value,
          alineacion: document.getElementById('alineacion').value,
          interlineado: document.getElementById('interlineado').value
        };
        google.script.run
          .withSuccessCallback(function() { google.script.host.close(); })
          .aplicarConfiguracion(datos);
      }
    </script>
    `
  )
    .setWidth(360)
    .setHeight(420);

  DocumentApp.getUi().showModalDialog(html, '⚙️ Configurar Formato Pro');
}

function aplicarConfiguracion(datos) {
  if (datos.preset) CONFIG.PRESET_TITULOS = datos.preset;
  if (datos.fuente) CONFIG.FUENTE_CUERPO = datos.fuente;
  if (datos.tamano) CONFIG.TAMAÑO_CUERPO = parseInt(datos.tamano, 10);
  if (datos.interlineado) CONFIG.INTERLINEADO = parseFloat(datos.interlineado);

  const mapAlignment = {
    'JUSTIFY': DocumentApp.HorizontalAlignment.JUSTIFY,
    'LEFT': DocumentApp.HorizontalAlignment.LEFT,
    'CENTER': DocumentApp.HorizontalAlignment.CENTER,
    'RIGHT': DocumentApp.HorizontalAlignment.RIGHT
  };
  if (datos.alineacion && mapAlignment[datos.alineacion]) {
    CONFIG.ALINEACION_CUERPO = mapAlignment[datos.alineacion];
  }
}

// ==========================================
// EJECUCIÓN MAESTRA
// ==========================================
function ejecutarLimpiezaTotal() {
  eliminarParrafosVacios();
  limpiarEstilosCopiados();
  procesarTitulos();
  procesarTablas();
  normalizarCuerpo();
  DocumentApp.getUi().alert('✨ Proceso completado. Documento estructurado correctamente.');
}
