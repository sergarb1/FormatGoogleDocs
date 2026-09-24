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
  const estilo = CONFIG.PRESET_TITULOS;

  if (estilo === 'PERSONALIZADO') {
    if (CONFIG.PATRONES_PERSONALIZADOS && CONFIG.PATRONES_PERSONALIZADOS.length > 0) {
      return CONFIG.PATRONES_PERSONALIZADOS;
    }
    return PRESETS_TITULOS.GUION_LARGO;
  }

  // Alias de versiones anteriores
  if (estilo === 'NUMERICO') return PRESETS_TITULOS.PUNTO;
  if (estilo === 'AMBOS') return PRESETS_TITULOS.MIXTO;

  return PRESETS_TITULOS[estilo] || PRESETS_TITULOS.GUION_LARGO;
}
