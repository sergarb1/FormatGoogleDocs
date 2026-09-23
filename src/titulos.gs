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
        return;
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
