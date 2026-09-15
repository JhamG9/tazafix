// Opciones predefinidas de meses de cobertura para el fondo de emergencia. Son referencias de
// planificación financiera, no un límite legal.
export interface NivelCobertura {
	id: 'basico' | 'recomendado' | 'conservador';
	label: string;
	// Texto a mostrar para los meses (puede ser un rango, ej. "4-5 meses").
	mesesLabel: string;
	// Valor numérico usado en el cálculo (punto medio del rango cuando aplica).
	meses: number;
	descripcion: string;
}

export const nivelesCobertura: NivelCobertura[] = [
	{
		id: 'basico',
		label: 'Básico',
		mesesLabel: '3 meses',
		meses: 3,
		descripcion: 'Si tienes ingresos estables y pocas personas a cargo.',
	},
	{
		id: 'recomendado',
		label: 'Recomendado',
		mesesLabel: '4-5 meses',
		meses: 4.5,
		descripcion: 'El punto medio más usado para la mayoría de personas.',
	},
	{
		id: 'conservador',
		label: 'Conservador',
		mesesLabel: '6 meses',
		meses: 6,
		descripcion: 'Si tus ingresos son variables o tienes personas a cargo.',
	},
];
