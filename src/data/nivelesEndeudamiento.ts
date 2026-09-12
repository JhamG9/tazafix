// Niveles predefinidos de endeudamiento máximo recomendado para la calculadora de capacidad de
// endeudamiento. No son un límite legal (a diferencia de la tasa de usura), son referencias de
// mercado sobre qué tan comprometidos quedan los ingresos mensuales.
export interface NivelEndeudamiento {
	id: 'conservador' | 'estandar' | 'maximo';
	label: string;
	porcentaje: number;
	descripcion: string;
}

export const nivelesEndeudamiento: NivelEndeudamiento[] = [
	{
		id: 'conservador',
		label: 'Conservador',
		porcentaje: 30,
		descripcion: 'Deja más margen para imprevistos y otros gastos.',
	},
	{
		id: 'estandar',
		label: 'Estándar',
		porcentaje: 35,
		descripcion: 'El nivel que suelen usar como referencia los asesores financieros.',
	},
	{
		id: 'maximo',
		label: 'Máximo bancario',
		porcentaje: 40,
		descripcion: 'El límite que suelen aceptar los bancos, sin margen adicional.',
	},
];
