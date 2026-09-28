import { SMMLV_2026 } from './parametrosLaborales2026';

// Valores vigentes para 2026. Fuente: Decreto de auxilio de transporte expedido por el Ministerio
// del Trabajo (Decreto 1470 de 2025).
// TODO: actualizar cada diciembre con el nuevo decreto.
export const AUX_TRANSPORTE_2026 = 249_095;

// El auxilio de transporte solo aplica a quienes ganan hasta 2 SMMLV.
export const TOPE_AUX_TRANSPORTE_2026 = SMMLV_2026 * 2;

// Valor diario del auxilio de transporte (mensual ÷ 30), tal como lo muestra por defecto la
// calculadora oficial del Ministerio del Trabajo para un trabajador por días.
export const AUX_TRANSPORTE_DIARIO_2026 = Math.round(AUX_TRANSPORTE_2026 / 30);

// La exoneración de salud, SENA e ICBF (Ley 1819 de 2016, artículo 65) aplica a trabajadores que
// ganan menos de 10 SMMLV.
export const TOPE_EXONERACION_2026 = SMMLV_2026 * 10;

// A partir de 4 SMMLV el empleado también aporta 1% al fondo de solidaridad pensional.
export const TOPE_FONDO_SOLIDARIDAD_2026 = SMMLV_2026 * 4;

export { SMMLV_2026, clasesRiesgoArl, type ClaseRiesgoArl } from './parametrosLaborales2026';
