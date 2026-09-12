// Formatters de números/moneda compartidos entre las calculadoras.
export const currency = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
	maximumFractionDigits: 0,
});

export const miles = new Intl.NumberFormat('es-CO');
