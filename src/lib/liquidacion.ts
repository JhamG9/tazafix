export interface SegmentoPrima {
	label: string;
	dias: number;
	monto: number;
}

export interface ResultadoLiquidacionEmpleado {
	dias: number;
	cesantias: number;
	interesesCesantias: number;
	prima: number;
	primaPorSemestre: SegmentoPrima[];
	vacaciones: number;
	total: number;
}

export interface ResultadoLiquidacionEmpleador {
	empleado: ResultadoLiquidacionEmpleado;
	pension: number;
	salud: number;
	arl: number;
	cajaCompensacion: number;
	icbf: number;
	sena: number;
	totalAportesPatronales: number;
	totalAportesConExoneracion: number;
	exonerado: boolean;
	costoTotal: number;
}

// Convención de año comercial (360 días, meses de 30 días) usada por el Código Sustantivo del
// Trabajo para liquidar prestaciones sociales. El día final se cuenta como trabajado (+1).
export function diasAno360(inicio: Date, fin: Date): number {
	let diaInicio = inicio.getDate();
	let diaFin = fin.getDate();

	if (diaInicio === 31) diaInicio = 30;
	if (diaFin === 31 && diaInicio === 30) diaFin = 30;

	const anios = fin.getFullYear() - inicio.getFullYear();
	const meses = fin.getMonth() - inicio.getMonth();
	const dias = diaFin - diaInicio;

	return anios * 360 + meses * 30 + dias + 1;
}

// 52 semanas ÷ 12 meses, redondeado a 2 decimales: así mensualiza un valor diario la calculadora
// oficial "Mi Calculadora" del Ministerio del Trabajo (y la generalidad de las guías de nómina para
// trabajadores por días), en vez de usar la fracción exacta 52/12 = 4.3333...
const SEMANAS_POR_MES = 4.33;

// Mensualiza el salario de un trabajador que gana por día: salario diario × días trabajados por
// semana × 4.33 semanas al mes.
export function salarioMensualizado(salarioDiario: number, diasPorSemana: number): number {
	return salarioDiario * diasPorSemana * SEMANAS_POR_MES;
}

interface Segmento {
	fin: Date;
	dias: number;
}

// Parte [inicio, fin] en tramos delimitados por `fronteras` (fechas de corte dentro del rango). El
// tamaño de cada tramo se obtiene por diferencia de una cuenta acumulada de días desde `inicio`
// (no llamando diasAno360 de forma independiente en cada tramo), para que la suma de los tramos
// siempre dé exactamente el total del periodo, sin importar cuántas fronteras se crucen. Calcular
// cada tramo de forma independiente sobrecuenta un día por cada frontera cruzada, porque cada tramo
// aplicaría su propio "+1" de conteo inclusivo.
function segmentar(inicio: Date, fin: Date, fronteras: Date[]): Segmento[] {
	const cortes = fronteras.filter((f) => f > inicio && f < fin).sort((a, b) => a.getTime() - b.getTime());
	const puntos = [...cortes, fin];

	const segmentos: Segmento[] = [];
	let diasAcumulados = 0;
	for (const punto of puntos) {
		const diasHastaAqui = diasAno360(inicio, punto);
		segmentos.push({ fin: punto, dias: diasHastaAqui - diasAcumulados });
		diasAcumulados = diasHastaAqui;
	}
	return segmentos;
}

// 30 de junio y 31 de diciembre de cada año que toca el periodo: fin de cada semestre para la
// prima de servicios.
function fronterasSemestrales(inicio: Date, fin: Date): Date[] {
	const fronteras: Date[] = [];
	for (let anio = inicio.getFullYear(); anio <= fin.getFullYear(); anio++) {
		fronteras.push(new Date(anio, 5, 30), new Date(anio, 11, 31));
	}
	return fronteras;
}

// 31 de diciembre de cada año que toca el periodo: los intereses de cesantías (Ley 52 de 1975) se
// liquidan por año calendario, 12% sobre las cesantías causadas ESE año.
function fronterasAnuales(inicio: Date, fin: Date): Date[] {
	const fronteras: Date[] = [];
	for (let anio = inicio.getFullYear(); anio < fin.getFullYear(); anio++) {
		fronteras.push(new Date(anio, 11, 31));
	}
	return fronteras;
}

// Divide la prima en los semestres reales que cubre el periodo (30 de junio y 31 de diciembre),
// en vez de partir el total en dos mitades iguales, que solo es correcto si el periodo dura
// exactamente un año.
function calcularPrimaPorSemestre(inicio: Date, fin: Date, base: number): SegmentoPrima[] {
	const segmentos = segmentar(inicio, fin, fronterasSemestrales(inicio, fin));
	const mismoAnio = inicio.getFullYear() === fin.getFullYear();

	return segmentos.map((segmento) => {
		const esPrimerSemestre = segmento.fin.getMonth() <= 5;
		const nombre = esPrimerSemestre ? 'Prima primer semestre' : 'Prima segundo semestre';
		return {
			label: mismoAnio ? nombre : `${nombre} ${segmento.fin.getFullYear()}`,
			dias: segmento.dias,
			monto: (base * segmento.dias) / 360,
		};
	});
}

// La fórmula "cesantías × días × 12% / 360" ya incorpora los días una vez dentro de "cesantías":
// aplicarla directamente sobre el total de un contrato de varios años la eleva al cuadrado (un
// contrato de 2 años pagaría 4 veces el interés de uno de 1 año, en vez de 2 veces). Por eso se
// calcula año calendario por año calendario y se suma.
function calcularInteresesCesantias(inicio: Date, fin: Date, base: number): number {
	const segmentos = segmentar(inicio, fin, fronterasAnuales(inicio, fin));

	return segmentos.reduce((total, segmento) => {
		const cesantiasSegmento = (base * segmento.dias) / 360;
		return total + (cesantiasSegmento * segmento.dias * 0.12) / 360;
	}, 0);
}

// Liquida cesantías, intereses de cesantías, prima de servicios y vacaciones para un contrato que
// termina de forma ordinaria. No incluye indemnización por despido sin justa causa.
export function calcularLiquidacionEmpleado(
	inicio: Date,
	fin: Date,
	salarioBase: number,
	auxilioTransporte: number
): ResultadoLiquidacionEmpleado {
	const dias = Math.max(diasAno360(inicio, fin), 0);
	const baseCesantiasYPrima = salarioBase + auxilioTransporte;

	const cesantias = (baseCesantiasYPrima * dias) / 360;
	const interesesCesantias = calcularInteresesCesantias(inicio, fin, baseCesantiasYPrima);
	const primaPorSemestre = calcularPrimaPorSemestre(inicio, fin, baseCesantiasYPrima);
	const prima = primaPorSemestre.reduce((suma, segmento) => suma + segmento.monto, 0);
	const vacaciones = (salarioBase * dias) / 720;
	const total = cesantias + interesesCesantias + prima + vacaciones;

	return { dias, cesantias, interesesCesantias, prima, primaPorSemestre, vacaciones, total };
}

// Costo total para el empleador de liquidar a un trabajador: lo que le debe pagar (mismo cálculo
// que calcularLiquidacionEmpleado) más los aportes patronales a seguridad social y parafiscales
// causados durante ese mismo período. A diferencia de cesantías/prima (que acumulan 1 mes de
// salario por cada 360 días trabajados, un ritmo anual), pensión, salud, ARL y parafiscales son
// tarifas MENSUALES que se pagan cada mes sin importar la antigüedad: por eso se prorratean sobre
// 30 días (número de meses del período), no sobre 360.
export function calcularLiquidacionEmpleador(
	inicio: Date,
	fin: Date,
	salarioBase: number,
	auxilioTransporte: number,
	tasaArl: number,
	topeExoneracion: number
): ResultadoLiquidacionEmpleador {
	const empleado = calcularLiquidacionEmpleado(inicio, fin, salarioBase, auxilioTransporte);
	const dias = empleado.dias;

	const pension = (salarioBase * dias * 0.12) / 30;
	const salud = (salarioBase * dias * 0.085) / 30;
	const arl = (salarioBase * dias * tasaArl) / 30;
	const cajaCompensacion = (salarioBase * dias * 0.04) / 30;
	const icbf = (salarioBase * dias * 0.03) / 30;
	const sena = (salarioBase * dias * 0.02) / 30;

	const totalAportesPatronales = pension + salud + arl + cajaCompensacion + icbf + sena;

	// Ley 1819 de 2016, artículo 65: exonera al empleador de salud, SENA e ICBF para trabajadores
	// que ganan menos del tope (10 SMMLV). No exonera pensión ni ARL.
	const exonerado = salarioBase < topeExoneracion;
	const totalAportesConExoneracion = exonerado
		? totalAportesPatronales - salud - icbf - sena
		: totalAportesPatronales;

	return {
		empleado,
		pension,
		salud,
		arl,
		cajaCompensacion,
		icbf,
		sena,
		totalAportesPatronales,
		totalAportesConExoneracion,
		exonerado,
		costoTotal: empleado.total + totalAportesConExoneracion,
	};
}

// --- Trabajador por días con remuneración inferior a 1 SMMLV (Decreto 2616 de 2013) ---

export interface ResultadoLiquidacionPorDiasEmpleado {
	dias: number;
	diasLaboradosMensualizados: number;
	salarioMensualizado: number;
	transporteMensualizado: number;
	empleado: ResultadoLiquidacionEmpleado;
	semanasCotizadas: number;
	ibcPension: number;
	pensionEmpleador: number;
	pensionTrabajador: number;
}

export interface ResultadoLiquidacionPorDiasEmpleador extends ResultadoLiquidacionPorDiasEmpleado {
	arl: number;
	cajaCompensacion: number;
	totalAportesPatronales: number;
	costoTotal: number;
}

// El Decreto 2616 de 2013 (compilado en el Decreto 1072 de 2015, artículo 2.2.1.6.4.1 y siguientes)
// permite afiliar a seguridad social, cotizando por semanas, a trabajadores dependientes que laboran
// por periodos inferiores a un mes y cuya remuneración es inferior a un SMMLV. Las semanas cotizadas
// dependen de los días laborados en el mes: 1 a 7 días = 1 semana, 8 a 14 = 2, 15 a 21 = 3, 22 o más
// = 4 (el máximo).
export function calcularSemanasCotizadasDecreto2616(diasLaboradosMensuales: number): number {
	const dias = Math.round(diasLaboradosMensuales);
	if (dias <= 7) return 1;
	if (dias <= 14) return 2;
	if (dias <= 21) return 3;
	return 4;
}

// Liquidación (cesantías, intereses, prima, vacaciones) y aporte a pensión de un trabajador que gana
// por días, por debajo de un SMMLV. El auxilio de transporte también se mensualiza en proporción a
// los días trabajados a la semana, igual que el salario: un trabajador de 3 días a la semana no tiene
// derecho al auxilio completo de un trabajador de tiempo completo.
export function calcularLiquidacionPorDiasEmpleado(
	inicio: Date,
	fin: Date,
	salarioDiario: number,
	diasPorSemana: number,
	auxilioDiario: number,
	smmlv: number
): ResultadoLiquidacionPorDiasEmpleado {
	const dias = Math.max(diasAno360(inicio, fin), 0);
	const diasLaboradosMensualizados = diasPorSemana * SEMANAS_POR_MES;
	const salarioBase = salarioMensualizado(salarioDiario, diasPorSemana);
	const transporteMensualizado = salarioMensualizado(auxilioDiario, diasPorSemana);
	const empleado = calcularLiquidacionEmpleado(inicio, fin, salarioBase, transporteMensualizado);

	// Base mínima de cotización semanal: 1/4 del SMMLV (Decreto 2616 de 2013, artículo 1).
	const semanasCotizadas = calcularSemanasCotizadasDecreto2616(diasLaboradosMensualizados);
	const ibcPension = semanasCotizadas * (smmlv / 4);

	return {
		dias,
		diasLaboradosMensualizados,
		salarioMensualizado: salarioBase,
		transporteMensualizado,
		empleado,
		semanasCotizadas,
		ibcPension,
		pensionEmpleador: ibcPension * 0.12,
		pensionTrabajador: ibcPension * 0.04,
	};
}

// Igual que calcularLiquidacionPorDiasEmpleado, más los aportes patronales a cargo de la empresa: ARL
// (sobre 1 SMMLV completo, no sobre el IBC por semanas) y caja de compensación familiar (4% sobre el
// mismo IBC de pensión). A diferencia de un trabajador de tiempo completo, este régimen no exige
// aportes a salud, SENA ni ICBF a cargo del empleador: la salud del trabajador queda a cargo del
// régimen subsidiado mientras gane menos de un SMMLV.
export function calcularLiquidacionPorDiasEmpleador(
	inicio: Date,
	fin: Date,
	salarioDiario: number,
	diasPorSemana: number,
	auxilioDiario: number,
	smmlv: number,
	tasaArl: number
): ResultadoLiquidacionPorDiasEmpleador {
	const base = calcularLiquidacionPorDiasEmpleado(inicio, fin, salarioDiario, diasPorSemana, auxilioDiario, smmlv);

	const arl = smmlv * tasaArl;
	const cajaCompensacion = base.ibcPension * 0.04;
	const totalAportesPatronales = base.pensionEmpleador + arl + cajaCompensacion;

	return {
		...base,
		arl,
		cajaCompensacion,
		totalAportesPatronales,
		costoTotal: base.empleado.total + totalAportesPatronales,
	};
}
