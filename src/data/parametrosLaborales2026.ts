// Valores vigentes para 2026.
// TODO: actualizar cada diciembre/enero con los nuevos decretos y la resolución de UVT de la DIAN.
export const SMMLV_2026 = 1_750_905;

// Resolución DIAN 000238 de 2025.
export const UVT_2026 = 52_374;

// Jornada máxima legal desde el 15 de julio de 2026 (Ley 2101 de 2021): 42 horas semanales. El
// divisor mensual para el valor de la hora ordinaria es (42 horas ÷ 6 días) × 30 días = 210 horas.
export const HORAS_MENSUALES_JORNADA_2026 = 210;

export interface ClaseRiesgoArl {
	id: string;
	label: string;
	tasa: number;
}

// Tarifas de cotización de riesgos laborales (ARL) por clase de riesgo, Decreto 1772 de 1994.
export const clasesRiesgoArl: ClaseRiesgoArl[] = [
	{ id: 'I', label: 'I (0.522%)', tasa: 0.00522 },
	{ id: 'II', label: 'II (1.044%)', tasa: 0.01044 },
	{ id: 'III', label: 'III (2.436%)', tasa: 0.02436 },
	{ id: 'IV', label: 'IV (4.35%)', tasa: 0.0435 },
	{ id: 'V', label: 'V (6.96%)', tasa: 0.0696 },
];
