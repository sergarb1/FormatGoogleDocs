// ==========================================
// UTILIDADES (DETECCIÓN DE CÓDIGO, NODOS, TRIM)
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

// TableCell no expone getParagraphs(): recorre hijos con getChild().
// Solo PARAGRAPH: ListItem no tiene setFontFamily/getFontFamily y
// rompería limpiarParrafos/esTextoCodigo si apareciera en una celda.
function parrafosDeCelda(cell) {
  const result = [];
  const n = cell.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = cell.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      result.push(child.asParagraph());
    }
  }
  return result;
}

// true si el párrafo está en una tabla de datos (no 1x1)
function estaEnTablaDatos(paragraph) {
  let node = paragraph.getParent();
  while (node && node.getType && node.getType() !== DocumentApp.ElementType.BODY) {
    if (node.getType() === DocumentApp.ElementType.TABLE) {
      return !esTablaCodeBlock(node.asTable());
    }
    node = node.getParent();
  }
  return false;
}

// true si el párrafo está dentro de una tabla 1x1 (CodeBlock)
function estaEnTablaCodeBlock(paragraph) {
  if (!CONFIG.TRATAR_TABLA_1X1_COMO_CODIGO) return false;
  let node = paragraph.getParent();
  while (node && node.getType && node.getType() !== DocumentApp.ElementType.BODY) {
    if (node.getType() === DocumentApp.ElementType.TABLE) {
      return esTablaCodeBlock(node.asTable());
    }
    node = node.getParent();
  }
  return false;
}

// true si el code point es "borde invisible" (no confiar solo en String.trim)
function esBlancoCodigo(cp) {
  return (
    cp === 9 || cp === 10 || cp === 11 || cp === 12 || cp === 13 || cp === 32 ||
    cp === 160 || cp === 5760 ||
    (cp >= 8192 && cp <= 8202) ||
    cp === 8232 || cp === 8233 || cp === 8239 || cp === 8287 ||
    cp === 12288 || cp === 65279 ||
    cp === 8203 || cp === 8204 || cp === 8205 || cp === 173
  );
}

// Texto crudo: concatena hijos Text (más fiable que getText() con \t)
function textoCrudoParrafo(paragraph) {
  let s = '';
  const n = paragraph.getNumChildren();
  for (let i = 0; i < n; i++) {
    const child = paragraph.getChild(i);
    if (child.getType() === DocumentApp.ElementType.TEXT) {
      s += child.asText().getText();
    }
  }
  if (s.length > 0) return s;
  return paragraph.getText();
}

// Rangos [ini, fin) de no-blancos laterales por code points
function rangosBlancosLaterales(texto) {
  let ini = 0;
  let fin = texto.length;
  while (ini < fin && esBlancoCodigo(texto.charCodeAt(ini))) ini++;
  while (fin > ini && esBlancoCodigo(texto.charCodeAt(fin - 1))) fin--;
  return { ini: ini, fin: fin };
}

// true si hay tabs/NBSP/exóticos o dobles+ espacios en medio
function hayEspaciosColapsables(texto) {
  let vistoNoBlanco = false;
  let espaciosSeguidos = 0;
  for (let i = 0; i < texto.length; i++) {
    const cp = texto.charCodeAt(i);
    const esHorizontal =
      cp === 9 || cp === 32 || cp === 160 || cp === 5760 ||
      (cp >= 8192 && cp <= 8202) ||
      cp === 8239 || cp === 8287 || cp === 12288;
    if (esHorizontal) {
      if (cp !== 32) return true;
      espaciosSeguidos++;
      if (espaciosSeguidos >= 2 && vistoNoBlanco) return true;
    } else {
      vistoNoBlanco = true;
      espaciosSeguidos = 0;
    }
  }
  return false;
}

// Quita bordes laterales por code points y (en texto no código) tabs/espacios intermedios.
// enCelda solo documenta el origen; la normalización interna aplica a cuerpo y celdas.
function trimParrafo(paragraph, enCelda) {
  const bruto = textoCrudoParrafo(paragraph);
  if (bruto.length === 0) return;

  if (CONFIG.DEBUG_TABLAS) {
    if (!globalThis.__fpMuestras) globalThis.__fpMuestras = 0;
    if (globalThis.__fpMuestras < 6) {
      globalThis.__fpMuestras++;
      const codes = [];
      for (let i = 0; i < Math.min(bruto.length, 40); i++) codes.push(bruto.charCodeAt(i));
      const codesFin = [];
      const desdeFin = Math.max(0, bruto.length - 12);
      for (let i = desdeFin; i < bruto.length; i++) codesFin.push(bruto.charCodeAt(i));
      fpLog('[Formato Pro][debug] muestra#%s inicio=%s fin=%s JSON=%s',
        globalThis.__fpMuestras, JSON.stringify(codes), JSON.stringify(codesFin), JSON.stringify(bruto));
    }
  }

  const antes = bruto;
  let texto = bruto;
  const esCodigo = esTextoCodigo(paragraph);

  // 1–2) Tabs y espacios horizontales intermedios en texto no código (cuerpo y celdas)
  if (CONFIG.NORMALIZAR_TABS_EN_CELDAS && CONFIG.COLAPSAR_ESPACIOS_EN_CELDAS && !esCodigo) {
    if (hayEspaciosColapsables(texto)) {
      try {
        const exoticos = [
          0x0009, 0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005,
          0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000
        ];
        const clase = exoticos.map(cp => String.fromCharCode(cp)).join('');
        paragraph.replaceText('[' + clase + ']+', ' ');
        paragraph.replaceText(' {2,}', ' ');
        texto = textoCrudoParrafo(paragraph);
      } catch (eSp) {
        if (CONFIG.DEBUG_TABLAS) fpLog('[Formato Pro][debug] colapsar espacios: %s', eSp);
      }
    }
  } else if (CONFIG.NORMALIZAR_TABS_EN_CELDAS && texto.indexOf('\t') !== -1 && !esCodigo) {
    try {
      paragraph.replaceText('\\t+', ' ');
      texto = textoCrudoParrafo(paragraph);
    } catch (eTab) {
      if (CONFIG.DEBUG_TABLAS) fpLog('[Formato Pro][debug] replace \\t: %s', eTab);
    }
  }

  // 3) Bordes laterales por code points (NO String.trim)
  const r = rangosBlancosLaterales(texto);
  const tieneIni = r.ini > 0;
  const tieneFin = r.fin < texto.length;
  const soloBlancos = r.ini >= r.fin;

  if (!tieneIni && !tieneFin) {
    if (CONFIG.DEBUG_TABLAS && texto !== antes) {
      fpLog('[Formato Pro][debug] trim/colapso intermedio OK antes=%s después=%s',
        JSON.stringify(antes), JSON.stringify(texto));
    }
    return;
  }
  if (soloBlancos) return;

  try {
    const et = paragraph.editAsText();
    const largo = texto.length;
    if (tieneFin) et.deleteText(r.fin, largo - 1);
    if (tieneIni) et.deleteText(0, r.ini - 1);
  } catch (eDel) {
    try {
      const BLANCOS = '\\t \\u000b\\u000c\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u2060\\u3000\\ufeff\\u200b\\u00ad';
      paragraph.replaceText('[' + BLANCOS + ']+$', '');
      paragraph.replaceText('^[' + BLANCOS + ']+', '');
    } catch (eRe) {
      if (CONFIG.DEBUG_TABLAS) {
        fpLog('[Formato Pro][debug] trim fallo delete/replace: %s / %s', eDel, eRe);
      }
    }
  }

  if (CONFIG.DEBUG_TABLAS) {
    fpLog('[Formato Pro][debug] trim antes=%s después=%s',
      JSON.stringify(antes), JSON.stringify(textoCrudoParrafo(paragraph)));
  }
}
