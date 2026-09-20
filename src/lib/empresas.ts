import { diasAno360 } from './liquidacion';

// --- Horas extra y recargos ---

export interface FilaHorasExtra {
	label: string;
	valorHora: number;
	cantidad: number;
	subtotal: number;
}

export interface ResultadoHorasExtra {
	horaOrdinaria: number;
	filas: FilaHorasExtra[];
	total: number;
}

// El recargo dominical/festivo ordinario subió de 80% a 90% desde el 1 de julio de 2026 (Ley 2466
// de 2025). Los tipos combinados con dominical/festivo suman ese 90% con el recargo respectivo:
// diurna extra (25%) → 115%, nocturna ordinaria (35%) → 125%, nocturna extra (75%) → 165%.
const RECARGOS_HORA: { label: string; factor: number }[] = [
	{ label: 'Hora extra diurna', factor: 0.25 },
	{ label: 'Hora ordinaria nocturna', factor: 0.35 },
	{ label: 'Hora extra nocturna', factor: 0.75 },
	{ label: 'Hora dominical o festiva diurna', factor: 0.9 },
	{ label: 'Hora extra dominical o festiva diurna', factor: 1.15 },
	{ label: 'Hora dominical o festiva nocturna', factor: 1.25 },
	{ label: 'Hora extra dominical o festiva nocturna', factor: 1.65 },
];

// A cuántas horas de cada tipo respondió el usuario, en el mismo orden que RECARGOS_HORA.
export function calcularPagoHorasExtra(
	salarioMensual: number,
	horasMensualesJornada: number,
	cantidades: number[]
): ResultadoHorasExtra {
	const horaOrdinaria = salarioMensual / horasMensualesJornada;
	const filas = RECARGOS_HORA.map(({ label, factor }, index) => {
		const valorHora = horaOrdinaria * (1 + factor);
		const cantidad = cantidades[index] || 0;
		return { label, valorHora, cantidad, subtotal: valorHora * cantidad };
	});

	return { horaOrdinaria, filas, total: filas.reduce((suma, fila) => suma + fila.subtotal, 0) };
}

// --- Indemnización por despido sin justa causa ---

export interface ItemIndemnizacion {
	label: string;
	dias: number;
}

export interface ResultadoIndemnizacion {
	dias: number;
	detalle: ItemIndemnizacion[];
	valor: number;
	tope10Smmlv: boolean;
}

// Artículo 64 del CST, numeral 4: contrato a término indefinido. Por debajo de 10 SMMLV, 30 días
// FIJOS de salario si el trabajador lleva menos de un año de servicio (sin prorratear, sin importar
// si llevaba 10 días o 359), más 20 días por cada año adicional cumplido, con la fracción del año
// en curso proporcional sobre 360 días — pero esa proporcionalidad solo aplica a los años
// posteriores al primero, nunca al primer año. Desde 10 SMMLV el CST reduce la tarifa a 20 días el
// primer año y 15 días por cada año adicional, con la misma regla.
export function calcularIndemnizacionIndefinido(
	salarioMensual: number,
	aniosCompletos: number,
	diasAnioEnCurso: number,
	smmlv: number
): ResultadoIndemnizacion {
	const tope10Smmlv = salarioMensual >= smmlv * 10;
	const diasPrimerAnio = tope10Smmlv ? 20 : 30;
	const diasPorAnioAdicional = tope10Smmlv ? 15 : 20;

	const salarioDiario = salarioMensual / 30;
	const aniosAdicionales = Math.max(aniosCompletos - 1, 0);
	const diasAniosAdicionales = aniosAdicionales * diasPorAnioAdicional;
	const diasFraccion = aniosCompletos >= 1 ? (diasAnioEnCurso / 360) * diasPorAnioAdicional : 0;
	const dias = diasPrimerAnio + diasAniosAdicionales + diasFraccion;

	const detalle: ItemIndemnizacion[] = [{ label: 'Primer año (fijo)', dias: diasPrimerAnio }];
	if (aniosCompletos >= 1) {
		detalle.push({ label: `Años adicionales cumplidos (${aniosAdicionales})`, dias: diasAniosAdicionales });
	}
	if (aniosCompletos >= 1 && diasAnioEnCurso > 0) {
		detalle.push({ label: 'Fracción del año en curso', dias: diasFraccion });
	}

	return { dias, detalle, valor: dias * salarioDiario, tope10Smmlv };
}

// Igual que calcularIndemnizacionIndefinido, pero a partir de la fecha de inicio y de terminación
// del contrato en vez de pedirle al usuario que cuente los años y días a mano. Los años completos
// de servicio se cuentan desde el aniversario del contrato (cada 360 días desde `inicio`), tal como
// lo entiende el artículo 64 del CST, no por año calendario.
export function calcularIndemnizacionIndefinidoPorFechas(
	inicio: Date,
	fin: Date,
	salarioMensual: number,
	smmlv: number
): ResultadoIndemnizacion {
	const dias = Math.max(diasAno360(inicio, fin), 0);
	const aniosCompletos = Math.floor(dias / 360);
	const diasAnioEnCurso = dias % 360;

	return calcularIndemnizacionIndefinido(salarioMensual, aniosCompletos, diasAnioEnCurso, smmlv);
}

// Artículo 64 del CST: contrato a término fijo. Salario correspondiente al tiempo que faltaba para
// vencer el contrato, con un mínimo de 15 días.
export function calcularIndemnizacionFijo(salarioMensual: number, diasFaltantes: number): ResultadoIndemnizacion {
	const salarioDiario = salarioMensual / 30;
	const dias = Math.max(diasFaltantes, 15);

	return {
		dias,
		detalle: [{ label: 'Días que faltaban para vencer el contrato', dias }],
		valor: dias * salarioDiario,
		tope10Smmlv: false,
	};
}

// Igual que calcularIndemnizacionFijo, pero a partir de la fecha real de terminación y la fecha en
// que estaba pactado que venciera el contrato.
export function calcularIndemnizacionFijoPorFechas(
	fechaTerminacion: Date,
	fechaVencimientoPactada: Date,
	salarioMensual: number
): ResultadoIndemnizacion {
	const diasFaltantes = Math.max(diasAno360(fechaTerminacion, fechaVencimientoPactada) - 1, 0);
	return calcularIndemnizacionFijo(salarioMensual, diasFaltantes);
}

// Artículo 239 del CST: si se despide a una trabajadora en embarazo o dentro de las 18 semanas
// siguientes al parto sin autorización previa del Ministerio del Trabajo, se debe pagar una
// indemnización adicional FIJA de 60 días de salario, sin importar la antigüedad ni el tipo de
// contrato, sumada a la indemnización ordinaria que ya le corresponda.
export function aplicarFueroMaternidad(resultado: ResultadoIndemnizacion, salarioMensual: number): ResultadoIndemnizacion {
	const salarioDiario = salarioMensual / 30;
	const diasFuero = 60;

	return {
		...resultado,
		dias: resultado.dias + diasFuero,
		detalle: [
			...resultado.detalle,
			{ label: 'Fuero de maternidad, sin autorización del Mintrabajo (fijo)', dias: diasFuero },
		],
		valor: resultado.valor + diasFuero * salarioDiario,
	};
}

// --- Retención en la fuente sobre salarios (procedimiento 1) ---

export interface ResultadoRetencion {
	aportesObligatorios: number;
	rentaExenta: number;
	baseGravable: number;
	baseGravableUVT: number;
	retencionPesos: number;
}

export function calcularRetencionFuente(ingresoMensual: number, uvt: number): ResultadoRetencion {
	const aportesObligatorios = ingresoMensual * 0.08;
	const subtotal = ingresoMensual - aportesObligatorios;

	const topeRentaExentaUVT = 790;
	const rentaExentaTope = (topeRentaExentaUVT / 12) * uvt;
	const rentaExenta = Math.min(subtotal * 0.25, rentaExentaTope);

	const baseGravable = subtotal - rentaExenta;
	const baseGravableUVT = baseGravable / uvt;

	let retencionUVT = 0;
	if (baseGravableUVT > 2300) retencionUVT = (baseGravableUVT - 2300) * 0.39 + 770;
	else if (baseGravableUVT > 945) retencionUVT = (baseGravableUVT - 945) * 0.37 + 268;
	else if (baseGravableUVT > 640) retencionUVT = (baseGravableUVT - 640) * 0.35 + 162;
	else if (baseGravableUVT > 360) retencionUVT = (baseGravableUVT - 360) * 0.33 + 69;
	else if (baseGravableUVT > 150) retencionUVT = (baseGravableUVT - 150) * 0.28 + 10;
	else if (baseGravableUVT > 95) retencionUVT = (baseGravableUVT - 95) * 0.19;

	return { aportesObligatorios, rentaExenta, baseGravable, baseGravableUVT, retencionPesos: retencionUVT * uvt };
}

// --- Retención en la fuente por otros conceptos (compras, servicios, honorarios, arriendos) ---

export type ConceptoRetencion =
	| 'compras'
	| 'servicios'
	| 'honorarios'
	| 'arrendamientoMueble'
	| 'arrendamientoInmueble'
	| 'transporteCarga'
	| 'construccion';

export interface ConfigConceptoRetencion {
	label: string;
	tarifaDeclarante: number;
	tarifaNoDeclarante: number;
	baseUvt: number;
	permiteDeclarante: boolean;
}

// Tarifas y bases del Decreto 572 de 2025, vigentes desde el 1 de julio de 2026 tras la revocatoria
// de su suspensión provisional (Consejo de Estado, auto del 2 de junio de 2026, expediente 30229).
export const CONCEPTOS_RETENCION: Record<ConceptoRetencion, ConfigConceptoRetencion> = {
	compras: { label: 'Compras generales', tarifaDeclarante: 0.025, tarifaNoDeclarante: 0.035, baseUvt: 10, permiteDeclarante: true },
	servicios: { label: 'Servicios generales', tarifaDeclarante: 0.04, tarifaNoDeclarante: 0.06, baseUvt: 4, permiteDeclarante: true },
	honorarios: { label: 'Honorarios y comisiones', tarifaDeclarante: 0.11, tarifaNoDeclarante: 0.1, baseUvt: 0, permiteDeclarante: true },
	arrendamientoMueble: { label: 'Arrendamiento de bienes muebles', tarifaDeclarante: 0.04, tarifaNoDeclarante: 0.04, baseUvt: 0, permiteDeclarante: false },
	arrendamientoInmueble: { label: 'Arrendamiento de bienes inmuebles', tarifaDeclarante: 0.035, tarifaNoDeclarante: 0.035, baseUvt: 10, permiteDeclarante: false },
	transporteCarga: { label: 'Transporte de carga', tarifaDeclarante: 0.01, tarifaNoDeclarante: 0.01, baseUvt: 4, permiteDeclarante: false },
	construccion: { label: 'Contratos de construcción y urbanización', tarifaDeclarante: 0.02, tarifaNoDeclarante: 0.02, baseUvt: 10, permiteDeclarante: false },
};

export interface ResultadoRetencionConcepto {
	baseMinima: number;
	tarifa: number;
	aplica: boolean;
	retencionPesos: number;
}

export function calcularRetencionPorConcepto(
	concepto: ConceptoRetencion,
	pago: number,
	declarante: boolean,
	uvt: number
): ResultadoRetencionConcepto {
	const config = CONCEPTOS_RETENCION[concepto];
	const baseMinima = config.baseUvt * uvt;
	const tarifa = declarante ? config.tarifaDeclarante : config.tarifaNoDeclarante;
	const aplica = pago >= baseMinima;

	return { baseMinima, tarifa, aplica, retencionPesos: aplica ? pago * tarifa : 0 };
}

// --- Aportes de contratistas independientes ---

export interface ResultadoAportesIndependiente {
	ibc: number;
	salud: number;
	pension: number;
	fondoSolidaridad: number;
	arl: number;
	total: number;
}

// Ley 797 de 2003, artículo 8: aporte adicional al Fondo de Solidaridad Pensional para quienes
// cotizan sobre un IBC de 4 SMMLV o más, en tramos crecientes por cada SMMLV adicional a partir de
// 16 SMMLV (subcuenta de subsistencia).
function tasaFondoSolidaridad(ibcEnSmmlv: number): number {
	if (ibcEnSmmlv < 4) return 0;
	if (ibcEnSmmlv < 16) return 0.01;
	if (ibcEnSmmlv < 17) return 0.012;
	if (ibcEnSmmlv < 18) return 0.014;
	if (ibcEnSmmlv < 19) return 0.016;
	if (ibcEnSmmlv < 20) return 0.018;
	return 0.02;
}

// Ley 1955 de 2019, artículo 244: el ingreso base de cotización es el 40% de los ingresos
// mensuales por contrato de prestación de servicios, con un piso de un SMMLV.
export function calcularAportesIndependiente(
	ingresoMensual: number,
	tasaArl: number,
	smmlv: number
): ResultadoAportesIndependiente {
	const ibc = Math.max(ingresoMensual * 0.4, smmlv);
	const salud = ibc * 0.125;
	const pension = ibc * 0.16;
	const fondoSolidaridad = ibc * tasaFondoSolidaridad(ibc / smmlv);
	const arl = ibc * tasaArl;

	return { ibc, salud, pension, fondoSolidaridad, arl, total: salud + pension + fondoSolidaridad + arl };
}

// --- Incapacidad laboral ---

export type OrigenIncapacidad = 'comun' | 'laboral';

export interface ResultadoIncapacidad {
	aCargoEmpleador: number;
	aCargoEntidad: number;
	total: number;
	superaTope180: boolean;
}

// Enfermedad o accidente común (Decreto 2943 de 2013, artículo 1; Decreto 019 de 2012, artículo
// 142): los 2 primeros días los paga el empleador al 100%. Del día 3 al 90 paga la EPS al 66.67%,
// del 91 al 180 al 50%, sin que el pago diario de la EPS sea inferior a un salario mínimo legal
// diario vigente (SMLDV). La incapacidad por enfermedad común solo se paga así hasta el día 180;
// de ahí en adelante entra un régimen distinto (posible calificación de invalidez y pensión), que
// esta calculadora no calcula. Accidente o enfermedad laboral: la ARL paga el 100% desde el día
// siguiente al accidente (CST, artículo 227).
export function calcularIncapacidad(
	salarioMensual: number,
	origen: OrigenIncapacidad,
	dias: number,
	smmlv: number
): ResultadoIncapacidad {
	const salarioDiario = salarioMensual / 30;
	const smldv = smmlv / 30;

	if (origen === 'laboral') {
		const aCargoEntidad = salarioDiario * dias;
		return { aCargoEmpleador: 0, aCargoEntidad, total: aCargoEntidad, superaTope180: false };
	}

	const diasEmpleador = Math.min(dias, 2);
	const aCargoEmpleador = salarioDiario * diasEmpleador;

	const diasAl90 = Math.max(Math.min(dias, 90) - 2, 0);
	const diasAl180 = Math.max(Math.min(dias, 180) - 90, 0);
	const tarifaAl90 = Math.max(salarioDiario * 0.6667, smldv);
	const tarifaAl180 = Math.max(salarioDiario * 0.5, smldv);
	const aCargoEntidad = tarifaAl90 * diasAl90 + tarifaAl180 * diasAl180;

	return { aCargoEmpleador, aCargoEntidad, total: aCargoEmpleador + aCargoEntidad, superaTope180: dias > 180 };
}

// --- Licencia de maternidad y paternidad ---

export interface ItemLicencia {
	label: string;
	semanas: number;
}

export interface ResultadoLicencia {
	semanas: number;
	dias: number;
	detalle: ItemLicencia[];
	valor: number;
}

// CST artículo 236, modificado por la Ley 2114 de 2021 y la Ley 1822 de 2017: 18 semanas base, más
// 2 semanas si el parto es múltiple o el hijo tiene discapacidad diagnosticada, más una semana por
// cada semana de adelanto si el parto fue prematuro. La paga la EPS al 100% del salario o IBC. La
// Ley 2114 de 2021 también permite ceder hasta 6 de esas semanas al otro padre (licencia parental
// compartida), siempre que ambos coticen y se avise a las EPS y empleadores con 30 días de
// anticipación.
export function calcularLicenciaMaternidad(
	salarioOIbc: number,
	partoMultiple: boolean,
	semanasPrematuro: number,
	semanasCompartidas: number
): ResultadoLicencia {
	const detalle: ItemLicencia[] = [{ label: 'Semanas base', semanas: 18 }];
	let semanas = 18;

	if (partoMultiple) {
		semanas += 2;
		detalle.push({ label: 'Parto múltiple o discapacidad', semanas: 2 });
	}
	if (semanasPrematuro > 0) {
		semanas += semanasPrematuro;
		detalle.push({ label: 'Adelanto por parto prematuro', semanas: semanasPrematuro });
	}

	const cedidas = Math.min(Math.max(semanasCompartidas, 0), 6);
	if (cedidas > 0) {
		semanas -= cedidas;
		detalle.push({ label: 'Semanas cedidas al otro padre', semanas: -cedidas });
	}

	const dias = semanas * 7;
	return { semanas, dias, detalle, valor: (salarioOIbc / 30) * dias };
}

// Ley 2114 de 2021: 2 semanas fijas, pagadas por la EPS al 100% del salario o IBC, más hasta 6
// semanas que la madre le puede ceder (licencia parental compartida).
export function calcularLicenciaPaternidad(salarioOIbc: number, semanasCompartidas: number): ResultadoLicencia {
	const recibidas = Math.min(Math.max(semanasCompartidas, 0), 6);
	const semanas = 2 + recibidas;
	const dias = semanas * 7;
	const detalle: ItemLicencia[] = [{ label: 'Licencia de paternidad', semanas: 2 }];
	if (recibidas > 0) {
		detalle.push({ label: 'Semanas compartidas por la madre', semanas: recibidas });
	}

	return { semanas, dias, detalle, valor: (salarioOIbc / 30) * dias };
}

// --- Nómina mensual por días ---

export interface ResultadoNominaMensual {
	salarioDevengado: number;
	auxilioProporcional: number;
	provisionCesantias: number;
	provisionInteresesCesantias: number;
	provisionPrima: number;
	provisionVacaciones: number;
	pension: number;
	salud: number;
	arl: number;
	cajaCompensacion: number;
	icbf: number;
	sena: number;
	totalSinExonerar: number;
	totalConExoneracion: number;
	exonerado: boolean;
}

// Liquida la nómina corriente de un trabajador que labora por días dentro de un mes (no la
// liquidación final de un contrato): salario devengado según los días trabajados, auxilio de
// transporte proporcional si aplica, la provisión proporcional de cesantías, intereses, prima y
// vacaciones, y los aportes patronales a seguridad social y parafiscales sobre lo devengado en el
// periodo. La exoneración de salud, SENA e ICBF (Ley 1819 de 2016, artículo 65) se evalúa sobre el
// salario mensual equivalente del trabajador, no sobre lo devengado en días.
export function calcularNominaMensualPorDias(
	salarioDiario: number,
	diasTrabajados: number,
	auxilioAplica: boolean,
	auxilioMensual: number,
	tasaArl: number,
	topeExoneracion: number
): ResultadoNominaMensual {
	const auxilioDiario = auxilioMensual / 30;
	const salarioDevengado = salarioDiario * diasTrabajados;
	const auxilioProporcional = auxilioAplica ? auxilioDiario * diasTrabajados : 0;

	const baseCesantiasYPrima = salarioDevengado + auxilioProporcional;
	const provisionCesantias = baseCesantiasYPrima / 12;
	const provisionInteresesCesantias = provisionCesantias * 0.12;
	const provisionPrima = baseCesantiasYPrima / 12;
	const provisionVacaciones = salarioDevengado / 24;

	const pension = salarioDevengado * 0.12;
	const salud = salarioDevengado * 0.085;
	const arl = salarioDevengado * tasaArl;
	const cajaCompensacion = salarioDevengado * 0.04;
	const icbf = salarioDevengado * 0.03;
	const sena = salarioDevengado * 0.02;

	const totalSinExonerar =
		salarioDevengado +
		auxilioProporcional +
		provisionCesantias +
		provisionInteresesCesantias +
		provisionPrima +
		provisionVacaciones +
		pension +
		salud +
		arl +
		cajaCompensacion +
		icbf +
		sena;

	const salarioMensualEquivalente = salarioDiario * 30;
	const exonerado = salarioMensualEquivalente < topeExoneracion;
	const totalConExoneracion = exonerado ? totalSinExonerar - salud - icbf - sena : totalSinExonerar;

	return {
		salarioDevengado,
		auxilioProporcional,
		provisionCesantias,
		provisionInteresesCesantias,
		provisionPrima,
		provisionVacaciones,
		pension,
		salud,
		arl,
		cajaCompensacion,
		icbf,
		sena,
		totalSinExonerar,
		totalConExoneracion,
		exonerado,
	};
}

// --- Dotación ---

export interface ResultadoDotacion {
	cumpleSalario: boolean;
	cumpleAntiguedad: boolean;
	tieneDerecho: boolean;
}

// Artículos 230 a 233 del CST: obligatoria para trabajadores que ganan hasta 2 SMMLV y llevan
// mínimo 3 meses continuos de servicio.
export function calcularDotacion(salarioMensual: number, mesesAntiguedad: number, tope: number): ResultadoDotacion {
	const cumpleSalario = salarioMensual <= tope;
	const cumpleAntiguedad = mesesAntiguedad >= 3;

	return { cumpleSalario, cumpleAntiguedad, tieneDerecho: cumpleSalario && cumpleAntiguedad };
}
