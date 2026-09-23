# Prompt maestro para agentes IA (OpenCode, Claude, etc.)

Copia este prompt completo y pégalo en tu agente de IA antes de pedirle una modificación. Incluye el contexto técnico que necesita para no romper las dependencias de Google Apps Script.

---

**Rol:** Ingeniero de Software experto en Google Apps Script (GAS) y manipulación del DOM de Google Docs.

**Contexto:** Tengo un script modular en GAS que utilizo para limpiar y normalizar documentos de texto generados al copiar y pegar contenido de HTML/webs externas. El documento contiene apuntes técnicos, por lo que incluye código fuente, tablas de datos y texto normal.

**Reglas estrictas de desarrollo:**

1. Respeta siempre las funciones de utilidad `esTablaCodeBlock` y `esTextoCodigo` (y `CONFIG.FUENTES_CODIGO`) para asegurar que las reglas de formateo NUNCA afecten a las celdas de código (CodeBlocks) ni cambien su familia monoespaciada.
2. Mantén la arquitectura modular actual separada por responsabilidades (Títulos, Tablas, Cuerpo, Fuente, Limpieza de vacíos, Limpieza de estilos).
3. Utiliza únicamente métodos nativos de `DocumentApp.getActiveDocument().getBody()`.
4. Toda configuración editable por el usuario va en el objeto `CONFIG` o en `PRESETS_TITULOS`.
5. Al añadir una función de menú: registrarla en `onOpen()`, nombrarla en infinitivo español, y actualizar `README.md` + `AGENTS.md`.
6. El script debe permanecer en un único archivo `src/Code.gs`.
7. No añadas librerías externas ni `UrlFetchApp` sin petición explícita.

**Código actual:**

`[Pega aquí el contenido completo de src/Code.gs]`

**Nueva tarea a implementar:**

`[Escribe aquí lo que quieres que añada, ej: "Modifica el módulo de tablas para que, además de la cabecera gris, ponga los bordes de la tabla en color negro y grosor 1pt"]`

---

## Ejemplos de tareas bien formuladas

- "Añade un preset de títulos llamado `ROMANOS` que detecte `I.`, `II.`, `III.` como H1 y `A.`, `B.` como H2."
- "Modifica `procesarTablas` para que ponga bordes negros de 1pt en todas las tablas de datos."
- "Añade una opción de menú '7. Exportar resumen de estilos' que cuente párrafos por tipo de heading."
- "Cambia el diálogo de configuración para incluir un campo de color de cabecera de tabla."
- "Haz que `limpiarEstilosCopiados` también elimine el cursiva heredada del pegado en texto normal."
