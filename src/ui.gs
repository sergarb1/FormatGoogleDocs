// ==========================================
// MENÚ (agrupado por intención)
// ==========================================
function onOpen() {
  cargarConfiguracion();
  const ui = DocumentApp.getUi();

  const menuTitulos = ui.createMenu('📑 Títulos y estructura')
    .addItem('Detectar títulos (H1, H2, H3)', 'procesarTitulos')
    .addItem('Quitar líneas y viñetas vacías', 'eliminarParrafosVacios');

  const menuTablas = ui.createMenu('📊 Tablas de datos')
    .addItem('Formatear tablas', 'procesarTablas');

  const menuCuerpo = ui.createMenu('📝 Texto del cuerpo')
    .addItem('Normalizar cuerpo', 'normalizarCuerpo')
    .addItem('Recortar espacios sobrantes', 'recortarEspaciosLaterales')
    .addItem('Solo fuente y alineación', 'aplicarFuenteCuerpo')
    .addItem('Limpiar estilos pegados de la web', 'limpiarEstilosCopiados');

  ui.createMenu('⚡ Formato Pro')
    .addItem('✨ Limpieza completa (recomendado)', 'ejecutarLimpiezaTotal')
    .addSeparator()
    .addSubMenu(menuTitulos)
    .addSubMenu(menuTablas)
    .addSubMenu(menuCuerpo)
    .addSeparator()
    .addItem('⚙️ Configurar…', 'mostrarDialogoConfig')
    .addItem('📋 Ver resumen', 'verUltimosLogs')
    .addToUi();
}

// ==========================================
// DIÁLOGO DE CONFIGURACIÓN
// ==========================================
function mostrarDialogoConfig() {
  cargarConfiguracion();
  const html = HtmlService.createHtmlOutput(
    `
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Google Sans', Arial, sans-serif;
        font-size: 13px;
        margin: 0;
        padding: 16px 20px 20px;
        color: #0F172A;
        background: #FFFFFF;
      }
      fieldset {
        border: 1px solid #E4E7EB;
        border-radius: 6px;
        margin: 0 0 14px;
        padding: 10px 14px 12px;
      }
      legend {
        font-weight: 700;
        font-size: 12px;
        color: #1E3A5F;
        padding: 0 6px;
        letter-spacing: 0.02em;
      }
      .row {
        display: flex;
        gap: 10px;
        margin-top: 8px;
      }
      .field { flex: 1; min-width: 0; }
      label {
        display: block;
        font-weight: 600;
        font-size: 12px;
        margin-bottom: 4px;
        color: #0F172A;
      }
      label .hint {
        display: block;
        font-weight: 400;
        font-size: 11px;
        color: #64748B;
        margin-top: 1px;
      }
      select, input[type="text"], input[type="number"] {
        width: 100%;
        padding: 7px 8px;
        border: 1px solid #E4E7EB;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        background: #fff;
        color: #0F172A;
      }
      select:focus, input:focus {
        outline: 2px solid #1E3A5F;
        outline-offset: 1px;
        border-color: #1E3A5F;
      }
      input.invalid, select.invalid {
        border-color: #DC2626;
        outline-color: #DC2626;
      }
      .err {
        display: none;
        color: #DC2626;
        font-size: 11px;
        margin-top: 3px;
      }
      .err.show { display: block; }
      .check {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 8px;
        font-size: 12px;
        color: #0F172A;
        cursor: pointer;
      }
      .check input { margin-top: 2px; flex-shrink: 0; }
      .check .hint {
        display: block;
        font-size: 11px;
        color: #64748B;
        font-weight: 400;
      }
      .actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 4px;
      }
      #status {
        font-size: 12px;
        font-weight: 600;
        min-height: 18px;
      }
      #status.ok { color: #059669; }
      #status.error { color: #DC2626; }
      button.primary {
        padding: 9px 20px;
        background: #1a73e8;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        transition: background 150ms ease;
      }
      button.primary:hover { background: #1557b0; }
      button.primary:disabled {
        background: #94a3b8;
        cursor: default;
      }
      button.link {
        background: none;
        border: none;
        color: #1a73e8;
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
        padding: 4px 0;
        text-decoration: underline;
      }
      button.link:hover { color: #1557b0; }
      .footer-note {
        margin-top: 10px;
        font-size: 11px;
        color: #64748B;
      }
    </style>
    <form id="form" onsubmit="event.preventDefault(); guardar();">
      <fieldset>
        <legend>📑 Títulos</legend>
        <div class="field">
          <label for="preset">Cómo detectar títulos</label>
          <select id="preset">
            <option value="GUION_LARGO" ${CONFIG.PRESET_TITULOS === 'GUION_LARGO' ? 'selected' : ''}>Guion LARGO — "1 — ", "1.2 – " (defecto)</option>
            <option value="GUION" ${CONFIG.PRESET_TITULOS === 'GUION' ? 'selected' : ''}>Guion ambos — largo "—" y corto "-"</option>
            <option value="GUION_CORTO" ${CONFIG.PRESET_TITULOS === 'GUION_CORTO' ? 'selected' : ''}>Guion CORTO — "1 - ", "1.2 - "</option>
            <option value="PUNTO" ${CONFIG.PRESET_TITULOS === 'PUNTO' ? 'selected' : ''}>Punto — "1. ", "1.2. "</option>
            <option value="MARKDOWN" ${CONFIG.PRESET_TITULOS === 'MARKDOWN' ? 'selected' : ''}>Markdown — "# ", "## "</option>
            <option value="MIXTO" ${CONFIG.PRESET_TITULOS === 'MIXTO' ? 'selected' : ''}>Mixto — punto + guion + Markdown</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>📝 Texto del cuerpo</legend>
        <div class="row">
          <div class="field">
            <label for="fuente">Fuente</label>
            <input id="fuente" type="text" value="${CONFIG.FUENTE_CUERPO}" />
            <div class="err" id="err-fuente">Escribe un nombre de fuente</div>
          </div>
          <div class="field" style="max-width: 100px;">
            <label for="tamano">Tamaño</label>
            <input id="tamano" type="number" min="6" max="72" value="${CONFIG.TAMAÑO_CUERPO}" />
            <div class="err" id="err-tamano">Entre 6 y 72</div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label for="alineacion">Alineación</label>
            <select id="alineacion">
              <option value="JUSTIFY" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.JUSTIFY ? 'selected' : ''}>Justificado</option>
              <option value="LEFT" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.LEFT ? 'selected' : ''}>Izquierda</option>
              <option value="CENTER" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.CENTER ? 'selected' : ''}>Centrado</option>
              <option value="RIGHT" ${CONFIG.ALINEACION_CUERPO === DocumentApp.HorizontalAlignment.RIGHT ? 'selected' : ''}>Derecha</option>
            </select>
          </div>
          <div class="field" style="max-width: 130px;">
            <label for="interlineado">Interlineado
              <span class="hint">Solo párrafos fuera de tablas</span>
            </label>
            <input id="interlineado" type="number" step="0.05" min="0.5" max="3" value="${CONFIG.INTERLINEADO}" />
            <div class="err" id="err-interlineado">Entre 0.5 y 3</div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>📊 Tablas de datos</legend>
        <div class="field" style="max-width: 160px;">
          <label for="interlineadoTabla">Interlineado en celdas
            <span class="hint">Independiente del texto</span>
          </label>
          <input id="interlineadoTabla" type="number" step="0.05" min="0.5" max="3" value="${CONFIG.INTERLINEADO_TABLA}" />
          <div class="err" id="err-interlineadoTabla">Entre 0.5 y 3</div>
        </div>
        <label class="check">
          <input type="checkbox" id="ajustarDim" ${CONFIG.AJUSTAR_DIMENSIONES_TABLA ? 'checked' : ''} />
          <span>Ancho de página y columnas al contenido
            <span class="hint">La tabla siempre ocupa el ancho útil; las columnas se reparten según el texto</span>
          </span>
        </label>
        <label class="check">
          <input type="checkbox" id="docsBordes" ${CONFIG.USAR_DOCS_API_BORDES ? 'checked' : ''} />
          <span>Borde negro fino (Docs API)
            <span class="hint">Requiere el servicio «Google Docs API» en el editor</span>
          </span>
        </label>
      </fieldset>

      <div class="actions">
        <button type="button" class="link" onclick="restaurarDefecto()">↺ Valores por defecto</button>
        <button type="submit" class="primary" id="btnGuardar">Guardar</button>
      </div>
      <div id="status" role="status" aria-live="polite"></div>
      <div class="footer-note">Los cambios se aplican la próxima vez que ejecutes una opción del menú.</div>
    </form>
    <script>
      function marcarError(id, mostrar) {
        const input = document.getElementById(id);
        const err = document.getElementById('err-' + id);
        if (input) input.classList.toggle('invalid', mostrar);
        if (err) err.classList.toggle('show', mostrar);
        return !mostrar;
      }

      function validar() {
        let ok = true;
        const tamano = parseFloat(document.getElementById('tamano').value);
        const inter = parseFloat(document.getElementById('interlineado').value);
        const interT = parseFloat(document.getElementById('interlineadoTabla').value);
        const fuente = document.getElementById('fuente').value.trim();

        ok = marcarError('fuente', !fuente) && ok;
        ok = marcarError('tamano', !(tamano >= 6 && tamano <= 72)) && ok;
        ok = marcarError('interlineado', !(inter >= 0.5 && inter <= 3)) && ok;
        ok = marcarError('interlineadoTabla', !(interT >= 0.5 && interT <= 3)) && ok;
        return ok;
      }

      ['tamano', 'interlineado', 'interlineadoTabla', 'fuente'].forEach(function(id) {
        document.addEventListener('DOMContentLoaded', function() {
          const el = document.getElementById(id);
          if (el) el.addEventListener('blur', validar);
        });
      });

      function restaurarDefecto() {
        document.getElementById('preset').value = 'GUION_LARGO';
        document.getElementById('fuente').value = 'Calibri';
        document.getElementById('tamano').value = 12;
        document.getElementById('alineacion').value = 'JUSTIFY';
        document.getElementById('interlineado').value = 1.15;
        document.getElementById('interlineadoTabla').value = 1.5;
        document.getElementById('ajustarDim').checked = true;
        document.getElementById('docsBordes').checked = true;
        const s = document.getElementById('status');
        s.className = '';
        s.textContent = 'Valores por defecto cargados. Pulsa Guardar.';
      }

      function guardar() {
        const status = document.getElementById('status');
        const btn = document.getElementById('btnGuardar');
        if (!validar()) {
          status.className = 'error';
          status.textContent = 'Revisa los campos marcados.';
          return;
        }
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Guardando…';
        status.className = '';
        status.textContent = '';

        const datos = {
          preset: document.getElementById('preset').value,
          fuente: document.getElementById('fuente').value.trim(),
          tamano: document.getElementById('tamano').value,
          alineacion: document.getElementById('alineacion').value,
          interlineado: document.getElementById('interlineado').value,
          interlineadoTabla: document.getElementById('interlineadoTabla').value,
          ajustarDim: document.getElementById('ajustarDim').checked,
          docsBordes: document.getElementById('docsBordes').checked
        };

        let cerrado = false;
        let responder = false;
        // Si el backend no contesta, no dejar el botón colgado en «Guardando…»
        const timeoutId = setTimeout(function() {
          if (responder) return;
          responder = true;
          btn.disabled = false;
          btn.textContent = 'Guardar';
          status.className = 'error';
          status.textContent = 'Sin respuesta del script. Revisa el documento (recarga) y vuelve a intentarlo.';
        }, 15000);

        function ok() {
          if (responder) return;
          responder = true;
          clearTimeout(timeoutId);
          status.className = 'ok';
          status.textContent = '✓ Guardado';
          setTimeout(function() {
            if (cerrado) return;
            cerrado = true;
            try { google.script.host.close(); } catch (e) {}
          }, 350);
        }

        function fail(err) {
          if (responder) return;
          responder = true;
          clearTimeout(timeoutId);
          btn.disabled = false;
          btn.textContent = 'Guardar';
          status.className = 'error';
          status.textContent = 'No se pudo guardar: ' + (err && err.message ? err.message : err);
        }

        try {
          google.script.run
            .withSuccessHandler(ok)
            .withFailureHandler(fail)
            .aplicarConfiguracion(datos);
        } catch (e) {
          fail(e);
        }
      }
    </script>
    `
  )
    .setWidth(420)
    .setHeight(560);

  DocumentApp.getUi().showModalDialog(html, '⚙️ Configurar Formato Pro');
}

// Punto de entrada de google.script.run desde el diálogo ⚙️.
// Siempre devuelve; los errores van a withFailureHandler (nunca dejar el cliente colgado).
function aplicarConfiguracion(datos) {
  try {
    cargarConfiguracion();
    if (!datos || typeof datos !== 'object') {
      throw new Error('Datos de configuración inválidos');
    }

    if (datos.preset) CONFIG.PRESET_TITULOS = String(datos.preset);
    if (datos.fuente) CONFIG.FUENTE_CUERPO = String(datos.fuente);
    if (datos.tamano !== undefined && datos.tamano !== null && datos.tamano !== '') {
      CONFIG.TAMAÑO_CUERPO = parseInt(datos.tamano, 10);
    }
    if (datos.interlineado !== undefined && datos.interlineado !== null && datos.interlineado !== '') {
      CONFIG.INTERLINEADO = parseFloat(datos.interlineado);
    }
    if (datos.interlineadoTabla !== undefined && datos.interlineadoTabla !== null && datos.interlineadoTabla !== '') {
      CONFIG.INTERLINEADO_TABLA = parseFloat(datos.interlineadoTabla);
    }
    if (typeof datos.ajustarDim === 'boolean') CONFIG.AJUSTAR_DIMENSIONES_TABLA = datos.ajustarDim;
    if (typeof datos.docsBordes === 'boolean') CONFIG.USAR_DOCS_API_BORDES = datos.docsBordes;

    const mapAlignment = {
      'JUSTIFY': DocumentApp.HorizontalAlignment.JUSTIFY,
      'LEFT': DocumentApp.HorizontalAlignment.LEFT,
      'CENTER': DocumentApp.HorizontalAlignment.CENTER,
      'RIGHT': DocumentApp.HorizontalAlignment.RIGHT
    };
    if (datos.alineacion && mapAlignment[datos.alineacion]) {
      CONFIG.ALINEACION_CUERPO = mapAlignment[datos.alineacion];
    }

    if (!guardarConfiguracion()) {
      throw new Error('No se pudo persistir la configuración en el documento');
    }
    return { ok: true };
  } catch (e) {
    try { fpLog('[Formato Pro] aplicarConfiguracion: %s', e); } catch (e2) {}
    throw e instanceof Error ? e : new Error(String(e));
  }
}

// ==========================================
// EJECUCIÓN MAESTRA
// ==========================================
function ejecutarLimpiezaTotal() {
  cargarConfiguracion();
  fpLimpiarLogs();
  FP_EN_TOTAL = true;
  try {
    const marcar = CONFIG.DEBUG_TIEMPOS
      ? (nombre) => {
          const t0 = Date.now();
          return () => fpLog('[Formato Pro] %s: %sms', nombre, Date.now() - t0);
        }
      : () => () => {};

    let fin = marcar('eliminarParrafosVacios');
    eliminarParrafosVacios();
    fin();

    fin = marcar('limpiarEstilosCopiados');
    limpiarEstilosCopiados();
    fin();

    fin = marcar('recortarEspaciosLaterales');
    recortarEspaciosLaterales();
    fin();

    fin = marcar('procesarTitulos');
    procesarTitulos();
    fin();

    fin = marcar('procesarTablas');
    procesarTablas();
    fin();

    fin = marcar('normalizarCuerpo');
    normalizarCuerpo();
    fin();
  } finally {
    FP_EN_TOTAL = false;
  }

  fpFinEjecucion('✨ Limpieza completa — logs');
}
