// Formatters de números/moneda compartidos entre las calculadoras.
export const currency = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
	maximumFractionDigits: 0,
});

export const miles = new Intl.NumberFormat('es-CO');

// Formato abreviado para ejes de gráficos: $50M, $1,2B, etc. — para no saturar el eje con cifras
// completas en pesos colombianos.
export function currencyAbreviado(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000) {
		return `$${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
	}
	if (abs >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
	}
	if (abs >= 1_000) {
		return `$${(value / 1_000).toFixed(0)}K`;
	}
	return `$${value.toFixed(0)}`;
}

