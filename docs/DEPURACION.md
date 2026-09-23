# Depuración con OpenCode + clasp (MCP)

Google Apps Script (GAS) se ejecuta en los servidores de Google, no en tu máquina local. No existe un MCP oficial de Google que permita **breakpoints en tiempo real** desde un editor local.

La forma profesional de integrar **OpenCode + MCP** para depurar y desarrollar Apps Script es combinar un **MCP de Terminal/Comandos** con la herramienta oficial **`clasp`** (Command Line Apps Script Projects).

Esto permite a tu IA local:

1. Descargar el código
2. Modificarlo
3. Subirlo (`clasp push`)
4. **Leer los logs de error de Google en tu terminal** (`clasp logs`)

---

## 1. Preparar el entorno local (el "puente" hacia Google)

```bash
# Instalar clasp globalmente
npm install -g @google/clasp

# Instalar los tipos de Google (crucial para que la IA entienda el código)
npm install -D @types/google-apps-script

# Iniciar sesión con tu cuenta de Google (abre el navegador)
clasp login
```

También hay que habilitar la API de Apps Script:
https://script.google.com/home/usersettings → activar **API de Apps Script**.

## 2. Configurar los MCP en tu entorno

En tu configuración de servidores MCP (`mcp.json` o la configuración de OpenCode), asegúrate de que la IA tiene acceso a:

1. **Filesystem MCP:** leer/escribir los archivos `.js`/`.gs` locales.
2. **Command / Terminal MCP:** ejecutar comos de `clasp` por ti.

### MCP experimental oficial de clasp

```bash
claude mcp add clasp -- npx -y @google/clasp mcp
```

> Requiere `clasp login` previo. En modo MCP, clasp usa las mismas credenciales que como CLI.

## 3. Descargar el proyecto de Apps Script

### ¿De dónde saco el ID del script?

1. Abre Google Docs → **Extensiones → Apps Script**.
2. En el editor: **Configuración** (engranaje, izquierda).
3. **Propiedades del proyecto → ID del script** y cópialo.

Alternativa: en la URL del editor,

```
https://script.google.com/d/ESTE_ES_EL_ID/edit
```

copia solo la parte entre `/d/` y `/edit`.

> El ID de la URL de Google Docs (`document/d/…`) **no es** el ID del script.

```bash
clasp clone "AQUI_TU_ID_DE_SCRIPT"
```

Esto descargará tu código (p. ej. `Code.js`) y un `appsscript.json`. El `.clasp.json` generado contiene el ID: **ya está en `.gitignore`**.

> Para este repo, el archivo fuente canónico es `src/Code.gs`. Tras `clasp clone`, alinea el nombre de archivo con lo que espera tu proyecto clasp (`Code.js` / `Code.gs`) y usa `clasp push` para subir cambios.

## 4. Flujo de depuración con la IA

Prompt de sistema / instrucción inicial para OpenCode:

> **Actúa como desarrollador de Google Apps Script. Nuestro flujo de trabajo es:**
> 1. Modifica los archivos `.js` locales. Usa `console.log()` para depurar variables clave.
> 2. Ejecuta `clasp push` en la terminal para subir los cambios a Google.
> 3. Pídeme que ejecute el script en Google Docs.
> 4. Tras ejecutarlo, usa `clasp logs` para leer los resultados de mis `console.log()` o los errores del sistema y corregir el código.

### Logs en tiempo real

```bash
clasp logs --watch
```

Los `console.log()` de este proyecto (con `CONFIG.DEBUG_TIEMPOS: true`) aparecen con el prefijo:

```
[Formato Pro] limpiarEstilosCopiados: 1204ms
```

### Si el log está vacío

`clasp logs` usa **Cloud Logging**, no el Logger antiguo. Si es la primera vez:

```bash
clasp setup-logs
```

(Requiere asociar un projectId de GCP al script — ver docs de clasp.)

## 5. Debug visual en el editor de Apps Script

Sin salir de Google:

1. Abre **Extensiones > Apps Script**.
2. Selecciona `ejecutarLimpiezaTotal` en el desplegable de funciones.
3. Pulsa **Debug** (icono de insecto).
4. Añade breakpoints haciendo clic en el margen izquierdo de una línea.
5. **Step over / Step out** para recorrer; el panel inferior muestra variables.

Útil para confirmar **en qué módulo** se atasca antes de mirar logs.

## ¿Por qué esta es la mejor forma real?

- **Tipado perfecto:** con `@types/google-apps-script`, el entorno local da a OpenCode la estructura exacta del DOM de Google Docs (`DocumentApp.ParagraphHeading`, etc.), evitando que la IA invente funciones.
- **Logs en local:** `clasp logs` conecta tu terminal con Google Cloud Logging. Si el script falla en Docs, la IA lee el error exacto (ej. `TypeError: Cannot read property ... of null`) y lo corrige en tu archivo local.
- **Iteración cerrada:** modificar → `clasp push` → ejecutar en Docs → `clasp logs` → corregir, todo sin copiar/pegar a mano.

---

## Comandos útiles de clasp

| Comando | Qué hace |
|---|---|
| `clasp login` | Autentica con Google |
| `clasp clone <ID>` | Descarga el proyecto a local |
| `clasp push` | Sube cambios locales a Google |
| `clasp pull` | Baja cambios de Google a local |
| `clasp open-script` | Abre el editor web del script |
| `clasp logs --watch` | Tail de Cloud Logging |
| `clasp mcp` | Modo MCP (STDIO) para agentes |
| `clasp run <fn>` | Ejecuta una función remota (requiere API Executable) |

Volver a [README](../README.md) · Reglas de agentes en [AGENTS.md](../AGENTS.md)
