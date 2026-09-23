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
// MÓDULO 5: LIMPIEZA DE PÁRRAFOS Y VIÑETAS VACÍOS
// ==========================================
// Borra párrafos en blanco y viñetas (LIST_ITEM) sin texto.
// El párrafo siguiente (el contenido real) NO se mueve.
function eliminarParrafosVacios() {
  const body = DocumentApp.getActiveDocument().getBody();
  const paragraphs = body.getParagraphs();
  let borrados = 0;

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    if (estaEnTablaCodeBlock(p)) continue;

    const bruto = textoCrudoParrafo(p);
    const r = rangosBlancosLaterales(bruto);
    if (r.ini < r.fin) continue;

    const parent = p.getParent();
    if (!parent) continue;

    const esCelda = parent.getType && parent.getType() === DocumentApp.ElementType.TABLE_CELL;
    if (esCelda) {
      let conContenido = 0;
      for (let j = 0; j < parent.getNumChildren(); j++) {
        const hijo = parent.getChild(j);
        if (hijo.getType() !== DocumentApp.ElementType.PARAGRAPH) {
          conContenido++;
          continue;
        }
        const hb = textoCrudoParrafo(hijo.asParagraph());
        const hr = rangosBlancosLaterales(hb);
        if (hr.ini < hr.fin) conContenido++;
      }
      if (conContenido <= 0) continue;
      const idx = parent.getChildIndex(p);
      if (idx === -1) continue;
      const restanConContenido = conContenido - (r.ini < r.fin ? 1 : 0);
      if (restanConContenido <= 0 && idx === 0) continue;
      if (restanConContenido <= 0) {
        let noVacios = 0;
        for (let j = 0; j < parent.getNumChildren(); j++) {
          if (j === idx) continue;
          const hijo = parent.getChild(j);
          if (hijo.getType() !== DocumentApp.ElementType.PARAGRAPH) {
            noVacios++;
            continue;
          }
          const hb = textoCrudoParrafo(hijo.asParagraph());
          const hr = rangosBlancosLaterales(hb);
          if (hr.ini < hr.fin) noVacios++;
        }
        if (noVacios <= 0) continue;
      }
    } else {
      if (parent.getNumChildren() <= 1) continue;
      if (parent === body && body.getNumChildren() <= 1) continue;
    }

    try {
      p.removeFromParent();
      borrados++;
    } catch (e) {
      // Google Docs no permite eliminar el último párrafo de una sección
    }
  }

  if (CONFIG.DEBUG_TABLAS || borrados > 0) {
    fpLog('[Formato Pro] eliminarParrafosVacios: borrados=%s', borrados);
  }
}

// ==========================================
// MÓDULO 6: LIMPIAR ESTILOS COPIADOS
// ==========================================
function limpiarEstilosCopiados() {
  const body = DocumentApp.getActiveDocument().getBody();

  limpiarParrafos(body.getParagraphs());

  const tables = body.getTables();
  tables.forEach(table => {
    const numRows = table.getNumRows();
    for (let r = 0; r < numRows; r++) {
      const row = table.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        limpiarParrafos(parrafosDeCelda(cell));
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

    p.setSpacingBefore(0);
    p.setSpacingAfter(CONFIG.ESPACIO_DESPUES);
    p.setLineSpacing(CONFIG.INTERLINEADO);

    if (!esCodigo) {
      p.setFontFamily(CONFIG.FUENTE_CUERPO);
      p.setFontSize(CONFIG.TAMAÑO_CUERPO);
      p.setAlignment(CONFIG.ALINEACION_CUERPO);
      p.setBackgroundColor(null);
      const links = p.getLinkUrl();
      if (!links) {
        p.setUnderline(false);
      }
    } else {
      p.setBackgroundColor(null);
      const links = p.getLinkUrl();
      if (!links) {
        p.setUnderline(false);
      }
      p.setLineSpacing(1.0);
      p.setSpacingBefore(0);
      p.setSpacingAfter(4);
    }

    if (!esCodigo && p.getText().length > 0) {
      try {
        p.editAsText().setFontSize(CONFIG.TAMAÑO_CUERPO);
      } catch (e) {
        // Ignorar párrafos con elementos especiales
      }
    }
  });
}

// ==========================================
// MÓDULO 7: RECORTE DE ESPACIOS LATERALES
// ==========================================
// Quita espacios sueltos a izquierda/derecha en párrafos del cuerpo y en
// celdas de tablas de datos. No toca código monoespaciado ni tablas 1x1.
function recortarEspaciosLaterales() {
  const soloMenu = !FP_EN_TOTAL;
  if (soloMenu) fpLimpiarLogs();

  const body = DocumentApp.getActiveDocument().getBody();
  let n = 0;
  let nTrim = 0;

  body.getParagraphs().forEach(p => {
    if (estaEnTablaCodeBlock(p)) return;
    const enDatos = estaEnTablaDatos(p);
    if (!enDatos && CONFIG.IGNORAR_CODEBLOCKS_EN_FORMATO && esTextoCodigo(p)) return;
    n++;
    const antes = textoCrudoParrafo(p);
    trimParrafo(p, enDatos);
    const despues = textoCrudoParrafo(p);
    if (antes !== despues) nTrim++;
  });

  if (CONFIG.DEBUG_TABLAS) {
    fpLog('[Formato Pro][debug] recortarEspaciosLaterales: revisados=%s modificados=%s', n, nTrim);
  }

  if (soloMenu) fpFinEjecucion('📋 Recortar espacios — logs');
}
