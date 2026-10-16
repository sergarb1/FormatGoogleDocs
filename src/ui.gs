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
    .addItem('✨ Formatear solo la selección', 'formatearSeleccion')
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
      select, input[type="text"], input[type="number"], textarea {
        width: 100%;
        padding: 7px 8px;
        border: 1px solid #E4E7EB;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        background: #fff;
        color: #0F172A;
      }
      textarea {
        font-family: Consolas, Monaco, monospace;
        font-size: 11px;
        min-height: 64px;
        resize: vertical;
      }
      select:focus, input:focus, textarea:focus {
        outline: 2px solid #1E3A5F;
        outline-offset: 1px;
        border-color: #1E3A5F;
      }
      input.invalid, select.invalid, textarea.invalid {
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
          <select id="preset" onchange="togglePatrones()">
            <option value="GUION_LARGO" ${CONFIG.PRESET_TITULOS === 'GUION_LARGO' ? 'selected' : ''}>Guion LARGO — "1 — ", "1.2 – " (defecto)</option>
            <option value="GUION" ${CONFIG.PRESET_TITULOS === 'GUION' ? 'selected' : ''}>Guion ambos — largo "—" y corto "-"</option>
            <option value="GUION_CORTO" ${CONFIG.PRESET_TITULOS === 'GUION_CORTO' ? 'selected' : ''}>Guion CORTO — "1 - ", "1.2 - "</option>
            <option value="PUNTO" ${CONFIG.PRESET_TITULOS === 'PUNTO' ? 'selected' : ''}>Punto — "1. ", "1.2. "</option>
            <option value="MARKDOWN" ${CONFIG.PRESET_TITULOS === 'MARKDOWN' ? 'selected' : ''}>Markdown — "# ", "## "</option>
            <option value="MIXTO" ${CONFIG.PRESET_TITULOS === 'MIXTO' ? 'selected' : ''}>Mixto — punto + guion + Markdown</option>
            <option value="PERSONALIZADO" ${CONFIG.PRESET_TITULOS === 'PERSONALIZADO' ? 'selected' : ''}>Personalizado (tus expresiones)</option>
          </select>
        </div>
        <div class="field" id="campoPatrones" style="display:${CONFIG.PRESET_TITULOS === 'PERSONALIZADO' ? 'block' : 'none'}; margin-top:8px;">
          <label for="patrones">Patrones personalizados
            <span class="hint">Una línea por patrón: NIVEL:expresión  ·  Nivel 1, 2 o 3. Se aplica el primero que coincida.</span>
          </label>
          <textarea id="patrones" spellcheck="false">${(CONFIG.PATRONES_PERSONALIZADOS || []).map(p => p.nivel + ':' + (p.regex instanceof RegExp ? p.regex.source : p.regex)).join('\n')}</textarea>
          <div class="err" id="err-patrones">Formato: "1:expresión" (nivel 1–3 y regex válida)</div>
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
              <option value="JUSTIFY" ${alineacionEnum(CONFIG.ALINEACION_CUERPO) === DocumentApp.HorizontalAlignment.JUSTIFY ? 'selected' : ''}>Justificado</option>
              <option value="LEFT" ${alineacionEnum(CONFIG.ALINEACION_CUERPO) === DocumentApp.HorizontalAlignment.LEFT ? 'selected' : ''}>Izquierda</option>
              <option value="CENTER" ${alineacionEnum(CONFIG.ALINEACION_CUERPO) === DocumentApp.HorizontalAlignment.CENTER ? 'selected' : ''}>Centrado</option>
              <option value="RIGHT" ${alineacionEnum(CONFIG.ALINEACION_CUERPO) === DocumentApp.HorizontalAlignment.RIGHT ? 'selected' : ''}>Derecha</option>
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
        <div class="row">
          <div class="field" style="max-width: 130px;">
            <label for="espacioAntes">Espacio antes (pt)</label>
            <input id="espacioAntes" type="number" min="0" max="72" value="${CONFIG.ESPACIO_ANTES}" />
            <div class="err" id="err-espacioAntes">Entre 0 y 72</div>
          </div>
          <div class="field" style="max-width: 130px;">
            <label for="espacioDespues">Espacio después (pt)</label>
            <input id="espacioDespues" type="number" min="0" max="72" value="${CONFIG.ESPACIO_DESPUES}" />
            <div class="err" id="err-espacioDespues">Entre 0 y 72</div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>📊 Tablas de datos</legend>
        <div class="row">
          <div class="field" style="max-width: 140px;">
            <label for="interlineadoTabla">Interlineado en celdas</label>
            <input id="interlineadoTabla" type="number" step="0.05" min="0.5" max="3" value="${CONFIG.INTERLINEADO_TABLA}" />
            <div class="err" id="err-interlineadoTabla">Entre 0.5 y 3</div>
          </div>
          <div class="field" style="max-width: 110px;">
            <label for="grosorBorde">Borde (pt)</label>
            <input id="grosorBorde" type="number" step="0.5" min="0" max="6" value="${CONFIG.BORDE_TABLA_GROSOR}" />
            <div class="err" id="err-grosorBorde">Entre 0 y 6</div>
          </div>
        </div>
        <div class="row">
          <div class="field" style="max-width: 130px;">
            <label for="colorBorde">Color borde</label>
            <input id="colorBorde" type="text" value="${CONFIG.BORDE_TABLA_COLOR}" />
            <div class="err" id="err-colorBorde">Formato #rrggbb</div>
          </div>
          <div class="field" style="max-width: 150px;">
            <label for="colorCabecera">Color cabecera</label>
            <input id="colorCabecera" type="text" value="${CONFIG.CABECERA_TABLA_COLOR}" />
            <div class="err" id="err-colorCabecera">Formato #rrggbb</div>
          </div>
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
            <span class="hint">Requiere el servicio «Google Docs API» en el editor. Si falla en un documento, se desactiva sola allí y se reactiva al volver a marcar.</span>
          </span>
        </label>
        <label class="check">
          <input type="checkbox" id="normalizarTabs" ${CONFIG.NORMALIZAR_TABS_EN_CELDAS ? 'checked' : ''} />
          <span>Tabs intermedios → espacio
            <span class="hint">En texto normal de celdas y cuerpo (el código no se toca)</span>
          </span>
        </label>
        <label class="check">
          <input type="checkbox" id="colapsarEspacios" ${CONFIG.COLAPSAR_ESPACIOS_EN_CELDAS ? 'checked' : ''} />
          <span>Colapsar dobles espacios y NBSP
            <span class="hint">En texto normal de celdas y cuerpo (el código no se toca)</span>
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend>⚙️ General</legend>
        <label class="check">
          <input type="checkbox" id="mostrarResumen" ${CONFIG.MOSTRAR_RESUMEN ? 'checked' : ''} />
          <span>Alerta «✨ Listo: …» al terminar
            <span class="hint">Resumen breve de lo formateado (títulos, tablas, párrafos)</span>
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

      function togglePatrones() {
        const preset = document.getElementById('preset').value;
        document.getElementById('campoPatrones').style.display =
          preset === 'PERSONALIZADO' ? 'block' : 'none';
      }

      function validarPatrones() {
        const preset = document.getElementById('preset').value;
        if (preset !== 'PERSONALIZADO') {
          marcarError('patrones', false);
          return true;
        }
        const lineas = document.getElementById('patrones').value
          .split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
        let ok = lineas.length > 0;
        for (let i = 0; i < lineas.length && ok; i++) {
          const m = lineas[i].match(/^([123])\s*:\s*(.+)$/);
          if (!m) { ok = false; break; }
          try { new RegExp(m[2]); } catch (e) { ok = false; }
        }
        marcarError('patrones', !ok);
        return ok;
      }

      function esHex(v) { return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim()); }

      function validar() {
        let ok = true;
        const tamano = parseFloat(document.getElementById('tamano').value);
        const inter = parseFloat(document.getElementById('interlineado').value);
        const interT = parseFloat(document.getElementById('interlineadoTabla').value);
        const fuente = document.getElementById('fuente').value.trim();
        const eAntes = parseFloat(document.getElementById('espacioAntes').value);
        const eDespues = parseFloat(document.getElementById('espacioDespues').value);
        const grosor = parseFloat(document.getElementById('grosorBorde').value);
        const cBorde = document.getElementById('colorBorde').value.trim();
        const cCab = document.getElementById('colorCabecera').value.trim();

        ok = marcarError('fuente', !fuente) && ok;
        ok = marcarError('tamano', !(tamano >= 6 && tamano <= 72)) && ok;
        ok = marcarError('interlineado', !(inter >= 0.5 && inter <= 3)) && ok;
        ok = marcarError('interlineadoTabla', !(interT >= 0.5 && interT <= 3)) && ok;
        ok = marcarError('espacioAntes', !(eAntes >= 0 && eAntes <= 72)) && ok;
        ok = marcarError('espacioDespues', !(eDespues >= 0 && eDespues <= 72)) && ok;
        ok = marcarError('grosorBorde', !(grosor >= 0 && grosor <= 6)) && ok;
        ok = marcarError('colorBorde', !esHex(cBorde)) && ok;
        ok = marcarError('colorCabecera', !esHex(cCab)) && ok;
        ok = validarPatrones() && ok;
        return ok;
      }

      ['tamano', 'interlineado', 'interlineadoTabla', 'fuente', 'espacioAntes', 'espacioDespues', 'grosorBorde', 'colorBorde', 'colorCabecera'].forEach(function(id) {
        document.addEventListener('DOMContentLoaded', function() {
          const el = document.getElementById(id);
          if (el) el.addEventListener('blur', validar);
        });
      });

      function restaurarDefecto() {
        document.getElementById('preset').value = 'GUION_LARGO';
        document.getElementById('patrones').value = '';
        togglePatrones();
        document.getElementById('fuente').value = 'Calibri';
        document.getElementById('tamano').value = 12;
        document.getElementById('alineacion').value = 'JUSTIFY';
        document.getElementById('interlineado').value = 1.15;
        document.getElementById('espacioAntes').value = 0;
        document.getElementById('espacioDespues').value = 8;
        document.getElementById('interlineadoTabla').value = 1.5;
        document.getElementById('grosorBorde').value = 1;
        document.getElementById('colorBorde').value = '#000000';
        document.getElementById('colorCabecera').value = '#dadce0';
        document.getElementById('ajustarDim').checked = true;
        document.getElementById('docsBordes').checked = true;
        document.getElementById('normalizarTabs').checked = true;
        document.getElementById('colapsarEspacios').checked = true;
        document.getElementById('mostrarResumen').checked = true;
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
          patrones: document.getElementById('patrones').value,
          fuente: document.getElementById('fuente').value.trim(),
          tamano: document.getElementById('tamano').value,
          alineacion: document.getElementById('alineacion').value,
          interlineado: document.getElementById('interlineado').value,
          espacioAntes: document.getElementById('espacioAntes').value,
          espacioDespues: document.getElementById('espacioDespues').value,
          interlineadoTabla: document.getElementById('interlineadoTabla').value,
          grosorBorde: document.getElementById('grosorBorde').value,
          colorBorde: document.getElementById('colorBorde').value.trim(),
          colorCabecera: document.getElementById('colorCabecera').value.trim(),
          ajustarDim: document.getElementById('ajustarDim').checked,
          docsBordes: document.getElementById('docsBordes').checked,
          normalizarTabs: document.getElementById('normalizarTabs').checked,
          colapsarEspacios: document.getElementById('colapsarEspacios').checked,
          mostrarResumen: document.getElementById('mostrarResumen').checked
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
    .setWidth(460)
    .setHeight(740);

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
    if (datos.espacioAntes !== undefined && datos.espacioAntes !== null && datos.espacioAntes !== '') {
      CONFIG.ESPACIO_ANTES = parseInt(datos.espacioAntes, 10);
    }
    if (datos.espacioDespues !== undefined && datos.espacioDespues !== null && datos.espacioDespues !== '') {
      CONFIG.ESPACIO_DESPUES = parseInt(datos.espacioDespues, 10);
    }
    if (datos.interlineadoTabla !== undefined && datos.interlineadoTabla !== null && datos.interlineadoTabla !== '') {
      CONFIG.INTERLINEADO_TABLA = parseFloat(datos.interlineadoTabla);
    }
    if (datos.grosorBorde !== undefined && datos.grosorBorde !== null && datos.grosorBorde !== '') {
      CONFIG.BORDE_TABLA_GROSOR = parseFloat(datos.grosorBorde);
    }
    if (datos.colorBorde) CONFIG.BORDE_TABLA_COLOR = String(datos.colorBorde);
    if (datos.colorCabecera) CONFIG.CABECERA_TABLA_COLOR = String(datos.colorCabecera);
    if (typeof datos.ajustarDim === 'boolean') CONFIG.AJUSTAR_DIMENSIONES_TABLA = datos.ajustarDim;
    if (typeof datos.normalizarTabs === 'boolean') CONFIG.NORMALIZAR_TABS_EN_CELDAS = datos.normalizarTabs;
    if (typeof datos.colapsarEspacios === 'boolean') CONFIG.COLAPSAR_ESPACIOS_EN_CELDAS = datos.colapsarEspacios;
    if (typeof datos.mostrarResumen === 'boolean') CONFIG.MOSTRAR_RESUMEN = datos.mostrarResumen;
    if (typeof datos.docsBordes === 'boolean') {
      CONFIG.USAR_DOCS_API_BORDES = datos.docsBordes;
      // Marcar la casilla de nuevo reintenta la Docs API en este documento
      // (si antes falló, quedó desactivada con docsApiDeshabilitar).
      if (datos.docsBordes) docsApiReactivar();
    }

    // Patrones personalizados: "NIVEL:regex" por línea → [{nivel, regex: String}]
    // Solo si el preset es PERSONALIZADO: si el campo está oculto, no tocar los
    // guardados (evita vaciarlos al cambiar de preset sin interés).
    if (datos.preset === 'PERSONALIZADO' && datos.patrones !== undefined) {
      const lineas = String(datos.patrones || '')
        .split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l.length > 0; });
      const salida = [];
      for (let i = 0; i < lineas.length; i++) {
        const m = lineas[i].match(/^([123])\s*:\s*(.+)$/);
        if (!m) {
          throw new Error('Patrón inválido (línea ' + (i + 1) + '): usa NIVEL:expresión');
        }
        try {
          new RegExp(m[2]);
        } catch (eRe) {
          throw new Error('Expresión regular inválida (línea ' + (i + 1) + ')');
        }
        salida.push({ nivel: parseInt(m[1], 10), regex: m[2] });
      }
      CONFIG.PATRONES_PERSONALIZADOS = salida;
    }

    if (datos.alineacion) {
      CONFIG.ALINEACION_CUERPO = alineacionEnum(datos.alineacion);
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
  fpStatsReset();
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

    fin = marcar('normalizarCuerpo');
    normalizarCuerpo();
    fin();

    // Siempre el último: el centrado de cabeceras, el interlineado de celdas
    // y el ancho de tabla deben prevalecer sobre el formato de cuerpo.
    fin = marcar('procesarTablas');
    procesarTablas();
    fin();
  } finally {
    FP_AMBITO_SELECCION = null;
    FP_EN_TOTAL = false;
  }

  fpFinEjecucion('✨ Limpieza completa — logs');
  if (CONFIG.MOSTRAR_RESUMEN) fpMostrarResumenAlerta();
}

// ==========================================
// FORMATEAR SOLO LA SELECCIÓN
// ==========================================
// Mismos módulos que la limpieza total, pero acotados a los párrafos/tablas
// seleccionados (parrafosObjetivo/tablasObjetivo leen FP_AMBITO_SELECCION).
function formatearSeleccion() {
  cargarConfiguracion();
  const ambito = ambitoSeleccionActual();
  if (!ambito) {
    DocumentApp.getUi().alert(
      'Formato Pro',
      'Selecciona antes algún texto (o una tabla) y vuelve a ejecutar «Formatear solo la selección».',
      DocumentApp.getUi().ButtonSet.OK
    );
    return;
  }

  fpLimpiarLogs();
  fpStatsReset();
  FP_EN_TOTAL = true;
  FP_AMBITO_SELECCION = ambito;
  try {
    fpLog('[Formato Pro] Ámbito: %s párrafo(s), %s tabla(s) seleccionados',
      ambito.paragraphs.length, ambito.tables.length);

    eliminarParrafosVacios();
    limpiarEstilosCopiados();
    recortarEspaciosLaterales();
    procesarTitulos();
    normalizarCuerpo();
    procesarTablas(); // último: centrado/interlineado/ancho de tablas prevalece
  } finally {
    FP_AMBITO_SELECCION = null;
    FP_EN_TOTAL = false;
  }

  fpFinEjecucion('✨ Formatear selección — logs');
  if (CONFIG.MOSTRAR_RESUMEN) fpMostrarResumenAlerta();
}
