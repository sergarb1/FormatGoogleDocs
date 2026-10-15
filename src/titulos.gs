// ==========================================
// MÓDULO 1: JERARQUÍA DE TÍTULOS
// ==========================================
function procesarTitulos() {
  cargarConfiguracion();
  const body = DocumentApp.getActiveDocument().getBody();
  const paragraphs = parrafosObjetivo(body);
  const patrones = obtenerPatronesTitulo();
  let n = 0;

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
        n++;
        return;
      }
    }
  });

  fpStat('titulos', n);
}

function obtenerPatronesTitulo() {
  const estilo = CONFIG.PRESET_TITULOS;

  if (estilo === 'PERSONALIZADO') {
    const personalizados = CONFIG.PATRONES_PERSONALIZADOS || [];
    if (personalizados.length > 0) {
      // Soporta { nivel, regex: RegExp } o { nivel, regex: String }
      return personalizados
        .map(p => {
          const fuente = p && p.regex instanceof RegExp
            ? p.regex.source
            : String((p && p.regex) || '');
          if (!fuente) return null; // vacío: new RegExp('') casaría con todo
          try {
            return { nivel: p.nivel, regex: new RegExp(fuente) };
          } catch (e) {
            fpLog('[Formato Pro] Patrón personalizado inválido (nivel %s): %s', p && p.nivel, fuente);
            return null;
          }
        })
        .filter(p => p !== null);
    }
    return PRESETS_TITULOS.GUION_LARGO;
  }

  // Alias de versiones anteriores
  if (estilo === 'NUMERICO') return PRESETS_TITULOS.PUNTO;
  if (estilo === 'AMBOS') return PRESETS_TITULOS.MIXTO;

  return PRESETS_TITULOS[estilo] || PRESETS_TITULOS.GUION_LARGO;
}
