import { calcularCredito, eaAMensual } from './credito';

export interface SupuestosComprarVsArrendar {
	// Tasa de interés del crédito hipotecario, efectiva anual (ej. 0.12 = 12%).
	tasaCreditoEA: number;
	// Plazo del crédito hipotecario en años.
	plazoCreditoAnios: number;
	// Valorización anual esperada de la vivienda (ej. 0.04 = 4%).
	valorizacionAnual: number;
	// Rentabilidad anual esperada si se invierte en vez de comprar (ej. 0.09 = 9%).
	rentabilidadAnual: number;
	// Mantenimiento + administración + predial anual, como % del valor de la vivienda.
	gastosMantenimientoPct: number;
	// Costos de compra (notariales, registro, beneficencia), como % del valor de la vivienda,
	// pagados una sola vez al inicio.
	costosCompraPct: number;
}

export const supuestosPorDefecto: SupuestosComprarVsArrendar = {
	tasaCreditoEA: 0.12,
	plazoCreditoAnios: 20,
	valorizacionAnual: 0.04,
	rentabilidadAnual: 0.09,
	gastosMantenimientoPct: 0.015,
	costosCompraPct: 0.03,
};

export interface ResultadoComprarVsArrendar {
	// Escenario comprar.
	cuotaMensual: number;
	montoFinanciado: number;
	saldoPendiente: number;
	valorViviendaFutura: number;
	costoCompraInicial: number;
	gastosMantenimientoAcumulados: number;
	patrimonioComprando: number;

	// Escenario arrendar + invertir.
	aporteInicialInversion: number;
	diferenciaMensual: number;
	aportesMensualesAcumulados: number;
	rentabilidadAcumulada: number;
	patrimonioArrendando: number;

	// Comparación.
	diferenciaPatrimonio: number;
}

// Valor futuro de una inversión con aporte inicial y aportes mensuales constantes (pueden ser
// negativos), a una tasa periódica mensual, usando interés compuesto con aportes al final de
// cada periodo (anualidad ordinaria).
export function calcularValorFuturoConAportes(
	aporteInicial: number,
	aporteMensual: number,
	iMensual: number,
	n: number
): number {
	if (iMensual === 0) {
		return aporteInicial + aporteMensual * n;
	}
	const factor = Math.pow(1 + iMensual, n);
	return aporteInicial * factor + aporteMensual * ((factor - 1) / iMensual);
}

export interface ParametrosComprarVsArrendar {
	valorVivienda: number;
	cuotaInicial: number;
	arriendoMensual: number;
	aniosHorizonte: number;
	supuestos: SupuestosComprarVsArrendar;
}

export function calcularComprarVsArrendar({
	valorVivienda,
	cuotaInicial,
	arriendoMensual,
	aniosHorizonte,
	supuestos,
}: ParametrosComprarVsArrendar): ResultadoComprarVsArrendar {
	const montoFinanciado = valorVivienda - cuotaInicial;
	const iMensualCredito = eaAMensual(supuestos.tasaCreditoEA);
	const nCredito = Math.round(supuestos.plazoCreditoAnios * 12);
	const { cuotaMensual, tablaAmortizacion } = calcularCredito(montoFinanciado, iMensualCredito, nCredito);

	const mesHorizonte = Math.min(aniosHorizonte * 12, nCredito);
	const saldoPendiente = mesHorizonte > 0 ? tablaAmortizacion[mesHorizonte - 1].saldoFinal : montoFinanciado;

	const valorViviendaFutura = valorVivienda * Math.pow(1 + supuestos.valorizacionAnual, aniosHorizonte);
	const costoCompraInicial = Math.round(valorVivienda * supuestos.costosCompraPct);
	const gastosMantenimientoAcumulados = Math.round(
		valorVivienda * supuestos.gastosMantenimientoPct * aniosHorizonte
	);
	const patrimonioComprando = valorViviendaFutura - saldoPendiente;

	const diferenciaMensual = cuotaMensual - arriendoMensual;
	const iMensualInversion = eaAMensual(supuestos.rentabilidadAnual);
	const nMesesHorizonte = aniosHorizonte * 12;
	const patrimonioArrendando = calcularValorFuturoConAportes(
		cuotaInicial,
		diferenciaMensual,
		iMensualInversion,
		nMesesHorizonte
	);
	const aportesMensualesAcumulados = diferenciaMensual * nMesesHorizonte;
	const rentabilidadAcumulada = patrimonioArrendando - cuotaInicial - aportesMensualesAcumulados;

	const diferenciaPatrimonio = patrimonioComprando - patrimonioArrendando;

	return {
		cuotaMensual,
		montoFinanciado,
		saldoPendiente,
		valorViviendaFutura,
		costoCompraInicial,
		gastosMantenimientoAcumulados,
		patrimonioComprando,
		aporteInicialInversion: cuotaInicial,
		diferenciaMensual,
		aportesMensualesAcumulados,
		rentabilidadAcumulada,
		patrimonioArrendando,
		diferenciaPatrimonio,
	};
}
