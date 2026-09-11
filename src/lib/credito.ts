export interface FilaAmortizacion {
	mes: number;
	saldoInicial: number;
	interes: number;
	capital: number;
	saldoFinal: number;
}

export interface ResultadoCredito {
	cuotaMensual: number;
	interesTotal: number;
	capitalTotal: number;
	totalPagado: number;
	tablaAmortizacion: FilaAmortizacion[];
}

// EA -> tasa periódica mensual: (1+EA)^(1/12) - 1 (NO dividir la EA entre 12).
export function eaAMensual(ea: number): number {
	return Math.pow(1 + ea, 1 / 12) - 1;
}

// Tasa periódica mensual -> su equivalente efectiva anual: (1+i)^12 - 1.
export function mensualAEA(iMensual: number): number {
	return Math.pow(1 + iMensual, 12) - 1;
}

// Sistema francés (cuota fija, interés decreciente, capital creciente) usado en Colombia.
export function calcularCredito(monto: number, iMensual: number, n: number): ResultadoCredito {
	const cuotaMensual =
		iMensual === 0
			? Math.round(monto / n)
			: Math.round(
					(monto * (iMensual * Math.pow(1 + iMensual, n))) / (Math.pow(1 + iMensual, n) - 1)
				);

	const tablaAmortizacion: FilaAmortizacion[] = [];
	let saldo = monto;

	for (let mes = 1; mes <= n; mes++) {
		const saldoInicial = saldo;
		let interes = Math.round(saldoInicial * iMensual);
		let capital = cuotaMensual - interes;
		let saldoFinal = saldoInicial - capital;

		// El último mes cierra el saldo exactamente en cero (ajuste de redondeo).
		if (mes === n) {
			capital = saldoInicial;
			interes = cuotaMensual - capital;
			saldoFinal = 0;
		}

		tablaAmortizacion.push({ mes, saldoInicial, interes, capital, saldoFinal });
		saldo = saldoFinal;
	}

	const interesTotal = tablaAmortizacion.reduce((acc, fila) => acc + fila.interes, 0);
	const capitalTotal = tablaAmortizacion.reduce((acc, fila) => acc + fila.capital, 0);
	const totalPagado = cuotaMensual * n;

	return { cuotaMensual, interesTotal, capitalTotal, totalPagado, tablaAmortizacion };
}
