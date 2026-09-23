/// <reference types="@types/google-apps-script" />

// Declaraciones globales útiles para agentes/IDE al trabajar con src/*.gs
// DocumentApp, HtmlService, Logger, console, etc. vienen de @types/google-apps-script.
// (Docs: servicio avanzado declarado en src/appsscript.json; no está en @types.)

declare const CONFIG: {
  FUENTE_CUERPO: string;
  TAMAÑO_CUERPO: number;
  ALINEACION_CUERPO: GoogleAppsScript.Document.HorizontalAlignment;
  INTERLINEADO: number;
  ESPACIO_ANTES: number;
  ESPACIO_DESPUES: number;
  INTERLINEADO_TABLA: number;
  PRESET_TITULOS: 'NUMERICO' | 'MARKDOWN' | 'AMBOS' | 'PERSONALIZADO';
  PATRONES_PERSONALIZADOS: { nivel: 1 | 2 | 3; regex: RegExp }[];
  IGNORAR_CODEBLOCKS_EN_FORMATO: boolean;
  FUENTES_CODIGO: string[];
  TRATAR_TABLA_1X1_COMO_CODIGO: boolean;
  BORDE_TABLA_GROSOR: number;
  BORDE_TABLA_COLOR: string;
  USAR_DOCS_API_BORDES: boolean;
  NORMALIZAR_TABS_EN_CELDAS: boolean;
  COLAPSAR_ESPACIOS_EN_CELDAS: boolean;
  AJUSTAR_DIMENSIONES_TABLA: boolean;
  DEBUG_TIEMPOS: boolean;
  DEBUG_TABLAS: boolean;
  DEBUG_MOSTRAR_DIALOGO: boolean;
};

declare const PRESETS_TITULOS: Record<string, { nivel: 1 | 2 | 3; regex: RegExp }[]>;
