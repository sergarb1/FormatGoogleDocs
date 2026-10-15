// ==========================================
// LOGS EN MEMORIA + DIÁLOGO (sin depender de clasp logs)
// ==========================================
var FP_LOGS = [];
var FP_EN_TOTAL = false;
var FP_LOG_MAX = 200;

// Contadores de la ejecución actual (resumen final)
var FP_STATS = null;

function fpStatsReset() {
  FP_STATS = {
    titulos: 0,
    tablas: 0,
    vacios: 0,
    espacios: 0,
    estilos: 0,
    cuerpo: 0
  };
}

function fpStat(clave, n) {
  if (!FP_STATS) fpStatsReset();
  FP_STATS[clave] = (FP_STATS[clave] || 0) + n;
}

// «✨ Listo: 3 títulos, 5 tablas, 12 párrafos…» — cadena corta para alerta/logs
function fpResumenTexto() {
  if (!FP_STATS) return '✨ Listo';
  const partes = [];
  if (FP_STATS.titulos) partes.push(FP_STATS.titulos + ' título' + (FP_STATS.titulos === 1 ? '' : 's'));
  if (FP_STATS.tablas) partes.push(FP_STATS.tablas + ' tabla' + (FP_STATS.tablas === 1 ? '' : 's'));
  if (FP_STATS.vacios) partes.push(FP_STATS.vacios + ' párrafo' + (FP_STATS.vacios === 1 ? '' : 's') + ' vacío' + (FP_STATS.vacios === 1 ? '' : 's'));
  if (FP_STATS.espacios) partes.push(FP_STATS.espacios + ' párrafo' + (FP_STATS.espacios === 1 ? '' : 's') + ' recortado' + (FP_STATS.espacios === 1 ? '' : 's'));
  if (FP_STATS.estilos) partes.push(FP_STATS.estilos + ' párrafo' + (FP_STATS.estilos === 1 ? '' : 's') + ' sin estilos pegados');
  if (FP_STATS.cuerpo) partes.push(FP_STATS.cuerpo + ' párrafo' + (FP_STATS.cuerpo === 1 ? '' : 's') + ' de cuerpo');
  if (partes.length === 0) return '✨ Listo — sin cambios que reportar';
  return '✨ Listo: ' + partes.join(', ');
}

// Alerta breve con el resumen (se cierra con Aceptar)
function fpMostrarResumenAlerta() {
  try {
    DocumentApp.getUi().alert('Formato Pro', fpResumenTexto(), DocumentApp.getUi().ButtonSet.OK);
  } catch (e) {}
}

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
  fpLog(fpResumenTexto());
  fpGuardarLogs();
  if (CONFIG.DEBUG_MOSTRAR_DIALOGO) {
    mostrarDialogoLogs(titulo);
  }
}
