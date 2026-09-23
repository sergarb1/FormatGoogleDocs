/// <reference types="@types/google-apps-script" />

// Declaraciones globales útiles para agentes/IDE al trabajar con src/Code.gs
// DocumentApp, HtmlService, Logger, console, etc. vienen de @types/google-apps-script.

declare const CONFIG: {
  FUENTE_CUERPO: string;
  TAMAÑO_CUERPO: number;
  ALINEACION_CUERPO: GoogleAppsScript.Document.HorizontalAlignment;
  INTERLINEADO: number;
  ESPACIO_ANTES: number;
  ESPACIO_DESPUES: number;
  PRESET_TITULOS: 'NUMERICO' | 'MARKDOWN' | 'AMBOS' | 'PERSONALIZADO';
  PATRONES_PERSONALIZADOS: { nivel: 1 | 2 | 3; regex: RegExp }[];
  IGNORAR_CODEBLOCKS_EN_FORMATO: boolean;
  FUENTES_CODIGO: string[];
  TRATAR_TABLA_1X1_COMO_CODIGO: boolean;
  DEBUG_TIEMPOS: boolean;
};
