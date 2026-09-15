import { eaAMensual } from './credito';

export interface FilaInteresCompuesto {
	mes: number;
	totalAportadoAcumulado: number;
	saldoTotal: number;
	interesGeneradoAcumulado: number;
}

export interface ResultadoInteresCompuesto {
	saldoFinal: number;
	totalAportado: number;
	interesGenerado: number;
	porcentajeInteres: number;
	tabla: FilaInteresCompuesto[];
}

// Simula interés compuesto con aportes mensuales constantes: saldo = saldo*(1+tasa_mensual) + aporte.
// La tasa mensual se deriva de la tasa efectiva anual con la misma conversión usada en el resto
// del sitio (NO dividir la EA entre 12).
export function calcularInteresCompuesto(
	montoInicial: number,
	aporteMensual: number,
	tasaAnual: number,
	anios: number
): ResultadoInteresCompuesto {
	const tasaMensual = eaAMensual(tasaAnual);
	const n = Math.round(anios * 12);

	const tabla: FilaInteresCompuesto[] = [];
	let saldo = montoInicial;

	for (let mes = 1; mes <= n; mes++) {
		saldo = saldo * (1 + tasaMensual) + aporteMensual;
		const totalAportadoAcumulado = montoInicial + aporteMensual * mes;
		const interesGeneradoAcumulado = saldo - totalAportadoAcumulado;
		tabla.push({
			mes,
			totalAportadoAcumulado,
			saldoTotal: saldo,
			interesGeneradoAcumulado,
		});
	}

	const ultimaFila = tabla[tabla.length - 1];
	const saldoFinal = ultimaFila ? ultimaFila.saldoTotal : montoInicial;
	const totalAportado = ultimaFila ? ultimaFila.totalAportadoAcumulado : montoInicial;
	const interesGenerado = saldoFinal - totalAportado;
	const porcentajeInteres = saldoFinal > 0 ? interesGenerado / saldoFinal : 0;

	return { saldoFinal, totalAportado, interesGenerado, porcentajeInteres, tabla };
}
