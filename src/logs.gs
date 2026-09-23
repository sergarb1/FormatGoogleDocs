// ==========================================
// LOGS EN MEMORIA + DIÁLOGO (sin depender de clasp logs)
// ==========================================
var FP_LOGS = [];
var FP_EN_TOTAL = false;
var FP_LOG_MAX = 200;

function fpFormatArgs(args) {
  if (!args || args.length === 0) return '';
  const partes = [];
  for (let i = 0; i < args.length; i++) {
    const v = args[i];
    try {
      if (v instanceof Error) partes.push(String(v));
      else if (v !== null && typeof v === 'object') partes.push(JSON.stringify(v));
      else partes.push(String(v));
    } catch (e) {
      partes.push(String(v));
    }
  }
  if (partes.length === 1) return partes[0];

  let out = partes[0];
  for (let i = 1; i < partes.length; i++) {
    const idx = out.indexOf('%s');
    if (idx === -1) {
      out += ' ' + partes[i];
    } else {
      out = out.substring(0, idx) + partes[i] + out.substring(idx + 2);
    }
  }
  return out;
}

function fpLog() {
  try {
    const line = fpFormatArgs(arguments);
    FP_LOGS.push(line);
    if (FP_LOGS.length > FP_LOG_MAX) {
      FP_LOGS.splice(0, FP_LOGS.length - FP_LOG_MAX);
    }
    console.log.apply(console, arguments);
  } catch (e) {
    try { console.log(line); } catch (e2) {}
  }
}

function fpLimpiarLogs() {
  FP_LOGS = [];
  try { globalThis.__fpMuestras = 0; } catch (e) {}
}

function fpGuardarLogs() {
  try {
    PropertiesService.getDocumentProperties()
      .setProperty('FP_LOGS', JSON.stringify(FP_LOGS.slice(-80)));
  } catch (e) {}
}

function fpCargarLogsGuardados() {
  try {
    const raw = PropertiesService.getDocumentProperties().getProperty('FP_LOGS');
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

function mostrarDialogoLogs(titulo, lineas) {
  const arr = (lineas && lineas.length) ? lineas : FP_LOGS;
  const texto = arr.length ? arr.join('\n') : '(sin logs en esta ejecución)';
  const esc = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Consolas,Monaco,monospace;font-size:11px;margin:8px;' +
    'white-space:pre-wrap;word-break:break-all;}' +
    '</style><div>' + esc + '</div>'
  )
    .setWidth(760)
    .setHeight(480);
  DocumentApp.getUi().showModalDialog(html, titulo || '📋 Logs Formato Pro');
}

function verUltimosLogs() {
  const guardados = fpCargarLogsGuardados();
  const lineas = (guardados.length && !FP_LOGS.length) ? guardados : FP_LOGS;
  mostrarDialogoLogs('📋 Resumen / logs', lineas);
}

// Al final de una ejecución de menú: guardar + mostrar diálogo si DEBUG_MOSTRAR_DIALOGO
function fpFinEjecucion(titulo) {
  fpGuardarLogs();
  if (CONFIG.DEBUG_MOSTRAR_DIALOGO) {
    mostrarDialogoLogs(titulo);
  }
}
