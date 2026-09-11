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

export interface AbonoExtra {
	mes: number;
	monto: number;
}

export type ModoAbono = 'reducir-plazo' | 'reducir-cuota';

export interface FilaAmortizacionConAbono extends FilaAmortizacion {
	abono: number;
	cuota: number;
}

export interface ResultadoCreditoConAbonos {
	cuotaMensualInicial: number;
	mesesFinales: number;
	interesTotal: number;
	capitalTotal: number;
	totalPagado: number;
	tablaAmortizacion: FilaAmortizacionConAbono[];
}

function calcularCuotaFrancesa(monto: number, iMensual: number, n: number): number {
	return iMensual === 0
		? Math.round(monto / n)
		: Math.round(
				(monto * (iMensual * Math.pow(1 + iMensual, n))) / (Math.pow(1 + iMensual, n) - 1)
			);
}

// Amortización francesa con abonos extra a capital. En "reducir-plazo" la cuota no cambia y el
// crédito termina antes; en "reducir-cuota" se recalcula la cuota con el saldo y plazo restantes.
export function calcularCreditoConAbonos(
	monto: number,
	iMensual: number,
	nOriginal: number,
	abonos: AbonoExtra[],
	modo: ModoAbono
): ResultadoCreditoConAbonos {
	const abonoPorMes = new Map<number, number>();
	for (const abono of abonos) {
		abonoPorMes.set(abono.mes, (abonoPorMes.get(abono.mes) ?? 0) + abono.monto);
	}

	const cuotaInicial = calcularCuotaFrancesa(monto, iMensual, nOriginal);
	let cuotaVigente = cuotaInicial;

	const tablaAmortizacion: FilaAmortizacionConAbono[] = [];
	let saldo = monto;
	let mes = 0;

	while (saldo > 0 && mes < nOriginal) {
		mes += 1;
		const saldoInicial = saldo;
		const interes = Math.round(saldoInicial * iMensual);
		let capital = cuotaVigente - interes;
		let saldoTrasCuota = saldoInicial - capital;

		// Cierre natural (fin del plazo o saldo ya casi pagado): no dejar saldo colgando.
		if (saldoTrasCuota <= 0) {
			capital = saldoInicial;
			saldoTrasCuota = 0;
		}

		let abono = abonoPorMes.get(mes) ?? 0;
		if (abono > saldoTrasCuota) {
			abono = saldoTrasCuota;
		}
		const saldoFinal = saldoTrasCuota - abono;

		tablaAmortizacion.push({ mes, saldoInicial, interes, capital, saldoFinal, abono, cuota: cuotaVigente });
		saldo = saldoFinal;

		if (abono > 0 && saldo > 0 && modo === 'reducir-cuota') {
			const mesesRestantes = nOriginal - mes;
			if (mesesRestantes > 0) {
				cuotaVigente = calcularCuotaFrancesa(saldo, iMensual, mesesRestantes);
			}
		}
	}

	const interesTotal = tablaAmortizacion.reduce((acc, fila) => acc + fila.interes, 0);
	const capitalTotal = tablaAmortizacion.reduce((acc, fila) => acc + fila.capital, 0);
	const totalPagado = tablaAmortizacion.reduce(
		(acc, fila) => acc + fila.capital + fila.interes + fila.abono,
		0
	);

	return {
		cuotaMensualInicial: cuotaInicial,
		mesesFinales: tablaAmortizacion.length,
		interesTotal,
		capitalTotal,
		totalPagado,
		tablaAmortizacion,
	};
}

