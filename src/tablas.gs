// ==========================================
// MÓDULO 2: PROCESAMIENTO DE TABLAS
// ==========================================
function procesarTablas() {
  cargarConfiguracion();
  const soloMenu = !FP_EN_TOTAL;
  if (soloMenu) fpLimpiarLogs();

  const tables = DocumentApp.getActiveDocument().getBody().getTables();
  let nDatos = 0;
  let nCode = 0;
  let nErrBorde = 0;
  let nParr = 0;
  let nSinParr = 0;
  const indicesDatos = [];

  tables.forEach((table, idx) => {
    if (CONFIG.TRATAR_TABLA_1X1_COMO_CODIGO && esTablaCodeBlock(table)) {
      nCode++;
      return;
    }
    nDatos++;
    indicesDatos.push({
      tableIndex: idx,
      numRows: table.getNumRows(),
      numCols: table.getNumRows() > 0 ? table.getRow(0).getNumCells() : 0
    });

    // DocumentApp (primer intento; a veces no pinta bordes en HTML pegado)
    try {
      table.setBorderWidth(CONFIG.BORDE_TABLA_GROSOR);
      table.setBorderColor(CONFIG.BORDE_TABLA_COLOR);
    } catch (eBorde) {
      nErrBorde++;
      if (CONFIG.DEBUG_TABLAS) {
        fpLog('[Formato Pro][debug] setBorder tabla: %s', eBorde);
      }
    }

    const numRows = table.getNumRows();
    for (let r = 0; r < numRows; r++) {
      const row = table.getRow(r);
      const esCabecera = (r === 0);

      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);

        try {
          const attrs = {};
          attrs[DocumentApp.Attribute.BORDER_WIDTH] = CONFIG.BORDE_TABLA_GROSOR;
          attrs[DocumentApp.Attribute.BORDER_COLOR] = CONFIG.BORDE_TABLA_COLOR;
          cell.setAttributes(attrs);
        } catch (e) {
          nErrBorde++;
          if (CONFIG.DEBUG_TABLAS) {
            fpLog('[Formato Pro][debug] setAttributes r%s c%s: %s', r, c, e);
          }
        }

        if (esCabecera) {
          cell.setBackgroundColor('#dadce0');
        } else {
          cell.setBackgroundColor(null);
        }

        const hijos = [];
        for (let i = 0; i < cell.getNumChildren(); i++) {
          hijos.push(String(cell.getChild(i).getType()));
        }

        const parrafos = parrafosDeCelda(cell);
        if (parrafos.length === 0) {
          nSinParr++;
          if (CONFIG.DEBUG_TABLAS) {
            fpLog('[Formato Pro][debug] celda vacía de PARRAGRAPH r%s c%s hijos=[%s] texto=%s',
              r, c, hijos.join(','), JSON.stringify(cell.getText()));
          }
        }
        nParr += parrafos.length;

        if (parrafos.length > 1 && !esTablaCodeBlock(table)) {
          for (let pi = parrafos.length - 1; pi >= 1; pi--) {
            const pe = parrafos[pi];
            const rb = textoCrudoParrafo(pe);
            const rr = rangosBlancosLaterales(rb);
            if (rr.ini >= rr.fin) {
              try {
                pe.removeFromParent();
                nParr--;
              } catch (eVac) {}
            }
          }
        }

        parrafos.forEach(paragraph => {
          if (paragraph.getParent() == null) return;
          if (!estaEnTablaCodeBlock(paragraph)) {
            trimParrafo(paragraph, true);
          }

          paragraph.setLineSpacing(CONFIG.INTERLINEADO_TABLA);
          paragraph.setSpacingBefore(0);
          paragraph.setSpacingAfter(0);

          if (esCabecera) {
            paragraph.setBold(true);
            paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          } else {
            paragraph.setBold(false);
            paragraph.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
          }
        });
      }
    }

    if (CONFIG.AJUSTAR_DIMENSIONES_TABLA) {
      try {
        ajustarDimensionesTabla(table);
      } catch (eDim) {
        if (CONFIG.DEBUG_TABLAS) {
          fpLog('[Formato Pro][debug] ajustarDimensionesTabla: %s', eDim);
        }
      }
    }
  });

  // Bordes fuertes vía Docs API (una petición por tabla de datos)
  let docsApiOk = 0;
  let docsApiErr = 0;
  if (CONFIG.USAR_DOCS_API_BORDES && indicesDatos.length > 0) {
    const res = aplicarBordesDocsApi(indicesDatos);
    docsApiOk = res.ok;
    docsApiErr = res.err;
  }

  if (CONFIG.DEBUG_TABLAS) {
    fpLog('[Formato Pro][debug] procesarTablas: total=%s datos=%s 1x1=%s párrafos=%s celdasSinParr=%s errBordeDocApp=%s docsApiOk=%s docsApiErr=%s',
      tables.length, nDatos, nCode, nParr, nSinParr, nErrBorde, docsApiOk, docsApiErr);
  }

  if (soloMenu) fpFinEjecucion('📋 Formatear tablas — logs');
}

// Aplica bordes de CONFIG.BORDE_TABLA_* a tablas de datos con Docs API
// (updateTableCellStyle). Devuelve {ok, err}.
function aplicarBordesDocsApi(tablasDatos) {
  const out = { ok: 0, err: 0 };
  if (typeof Docs === 'undefined' || !Docs || !Docs.Documents) {
    if (CONFIG.DEBUG_TABLAS) {
      fpLog('[Formato Pro][debug] Docs API no disponible — Editor → Servicios → Google Docs API');
    }
    return out;
  }

  const docId = DocumentApp.getActiveDocument().getId();
  const rgb = hexARgb(CONFIG.BORDE_TABLA_COLOR);
  const borde = {
    width: { magnitude: CONFIG.BORDE_TABLA_GROSOR, unit: 'PT' },
    color: { color: { rgbColor: rgb } },
    dashStyle: 'SOLID'
  };

  let startIdxs = [];
  try {
    startIdxs = indicesTablasInicio(docId);
  } catch (eGet) {
    out.err = tablasDatos.length;
    fpLog('[Formato Pro][debug] Docs.Documents.get para índices de tabla: %s', eGet);
    return out;
  }

  const requests = [];
  tablasDatos.forEach(meta => {
    if (meta.numRows < 1 || meta.numCols < 1) return;
    const start = startIdxs[meta.tableIndex];
    if (typeof start !== 'number') {
      if (CONFIG.DEBUG_TABLAS) {
        fpLog('[Formato Pro][debug] sin startIndex para tabla DocumentApp %s (API tiene %s tablas)',
          meta.tableIndex, startIdxs.length);
      }
      return;
    }
    requests.push({
      updateTableCellStyle: {
        tableStartLocation: { index: start },
        tableCellStyle: {
          borderTop: borde,
          borderBottom: borde,
          borderLeft: borde,
          borderRight: borde
        },
        fields: 'borderTop,borderBottom,borderLeft,borderRight'
      }
    });
  });

  if (requests.length === 0) return out;

  try {
    Docs.Documents.batchUpdate({ requests: requests }, docId);
    out.ok = requests.length;
  } catch (eBatch) {
    if (CONFIG.DEBUG_TABLAS) {
      fpLog('[Formato Pro][debug] batchUpdate bordes (%s): %s — reintento 1 a 1',
        requests.length, eBatch);
    }
    requests.forEach((request, i) => {
      try {
        Docs.Documents.batchUpdate({ requests: [request] }, docId);
        out.ok++;
      } catch (e) {
        out.err++;
        if (CONFIG.DEBUG_TABLAS) {
          fpLog('[Formato Pro][debug] Docs API solicitud %s: %s', i, e);
        }
      }
    });
  }
  return out;
}

// startIndex UTF-16 de cada tabla de primer nivel (mismo orden que Body.getTables)
function indicesTablasInicio(docId) {
  const doc = Docs.Documents.get(docId);
  const out = [];
  const content = (doc.body && doc.body.content) || [];
  for (let i = 0; i < content.length; i++) {
    const el = content[i];
    if (el && el.table && typeof el.startIndex === 'number') {
      out.push(el.startIndex);
    }
  }
  return out;
}

// La tabla ocupa SIEMPRE el ancho útil de página (máx. columna total).
// Las columnas solo se reparten proporcionalmente al contenido como ayuda de lectura.
function ajustarDimensionesTabla(table) {
  const body = DocumentApp.getActiveDocument().getBody();
  const numRows = table.getNumRows();
  if (numRows < 1) return;
  const numCols = table.getRow(0).getNumCells();
  if (numCols < 1) return;

  const anchoUtil = body.getPageWidth() - body.getMarginLeft() - body.getMarginRight();
  const charW = CONFIG.TAMAÑO_CUERPO * 0.5;
  const pad = 10;
  const minCol = 36;

  const necesidad = [];
  for (let c = 0; c < numCols; c++) necesidad[c] = 0;

  for (let r = 0; r < numRows; r++) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells() && c < numCols; c++) {
      const cell = row.getCell(c);
      const span = Math.max(1, cell.getColSpan());
      const lineas = cell.getText().split('\n');
      let maxLen = 0;
      for (let k = 0; k < lineas.length; k++) {
        if (lineas[k].length > maxLen) maxLen = lineas[k].length;
      }
      const ancho = maxLen * charW + pad;
      const porCol = ancho / span;
      for (let s = 0; s < span && c + s < numCols; s++) {
        if (porCol > necesidad[c + s]) necesidad[c + s] = porCol;
      }
    }
  }

  let total = 0;
  for (let c = 0; c < numCols; c++) {
    if (necesidad[c] < minCol) necesidad[c] = minCol;
    total += necesidad[c];
  }

  const anchos = [];
  let sumado = 0;
  for (let c = 0; c < numCols; c++) {
    let w;
    if (c === numCols - 1) {
      w = Math.max(minCol, anchoUtil - sumado);
    } else {
      w = Math.max(minCol, Math.round((necesidad[c] / (total || 1)) * anchoUtil));
      sumado += w;
    }
    anchos.push(w);
    table.setColumnWidth(c, w);
  }

  // Ajuste fino: si la última columna absorbió el resto de forma inválida, reparte por defecto
  const sumFinal = anchos.reduce((a, b) => a + b, 0);
  if (sumFinal !== anchoUtil && numCols > 0) {
    const dif = anchoUtil - sumFinal;
    const last = Math.max(minCol, anchos[numCols - 1] + dif);
    anchos[numCols - 1] = last;
    table.setColumnWidth(numCols - 1, last);
  }

  for (let r = 0; r < numRows; r++) {
    try {
      table.getRow(r).setMinimumHeight(0);
    } catch (eH) {
      // setMinimumHeight puede fallar en HTML pegado; no crítico
    }
  }

  if (CONFIG.DEBUG_TABLAS) {
    let totalAplicado = 0;
    for (let c = 0; c < numCols; c++) totalAplicado += table.getColumnWidth(c);
    fpLog('[Formato Pro][debug] dimensiones tabla: cols=%s anchoUtil=%s total=%s',
      numCols, anchoUtil, totalAplicado);
  }
}

function hexARgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  if (isNaN(n)) return { red: 0, green: 0, blue: 0 };
  return {
    red: ((n >> 16) & 255) / 255,
    green: ((n >> 8) & 255) / 255,
    blue: (n & 255) / 255
  };
}
