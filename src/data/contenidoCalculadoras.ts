// Contenido explicativo (cómo se calcula, ejemplo y preguntas frecuentes) que se muestra debajo de
// cada calculadora. Los ejemplos numéricos se calculan con las mismas funciones de `src/lib` que usa
// la calculadora, para que el texto nunca se desincronice del resultado que ve el usuario.
// TODO: revisar cada enero junto con los parámetros de `src/data` (el texto menciona el año vigente).
import { calcularCredito, eaAMensual } from '../lib/credito';
import {
	calcularAportesIndependiente,
	calcularLicenciaMaternidad,
	calcularLicenciaPaternidad,
	calcularPagoHorasExtra,
	calcularRetencionFuente,
} from '../lib/empresas';
import { currency } from '../lib/format';
import { calcularInteresCompuesto } from '../lib/interesCompuesto';
import { calcularLiquidacionEmpleado, calcularLiquidacionEmpleador } from '../lib/liquidacion';
import { AUX_TRANSPORTE_2026, TOPE_AUX_TRANSPORTE_2026, TOPE_EXONERACION_2026 } from './liquidacionLaboral';
import { HORAS_MENSUALES_JORNADA_2026, SMMLV_2026, UVT_2026, clasesRiesgoArl } from './parametrosLaborales2026';

export interface PreguntaFrecuente {
	question: string;
	answer: string;
}

export interface ContenidoCalculadora {
	// Nombre corto de la herramienta, usado en datos estructurados, migas de pan y enlaces internos.
	nombre: string;
	// Resumen de una línea que acompaña el enlace cuando otra calculadora la muestra como relacionada.
	descripcion: string;
	// Ícono (ver OptionIcon.astro) y color de fondo de la tarjeta, los mismos que usa el inicio.
	icono: string;
	color: string;
	comoSeCalcula: string[];
	puntos?: string[];
	ejemplo: string;
	faqs: PreguntaFrecuente[];
	// Ordenadas por cercanía de uso: la primera es el paso más probable después de esta calculadora.
	relacionadas: string[];
}

const $ = (valor: number) => currency.format(Math.round(valor));

// --- Ejemplos calculados con las funciones reales ---

const liq = calcularLiquidacionEmpleado(new Date(2026, 0, 1), new Date(2026, 5, 30), 2_000_000, AUX_TRANSPORTE_2026);

const empleador = calcularLiquidacionEmpleador(
	new Date(2025, 6, 1),
	new Date(2026, 5, 30),
	SMMLV_2026,
	AUX_TRANSPORTE_2026,
	clasesRiesgoArl[0].tasa,
	TOPE_EXONERACION_2026
);

const horas = calcularPagoHorasExtra(SMMLV_2026, HORAS_MENSUALES_JORNADA_2026, [0, 0, 0, 0, 0, 0, 0]);
const [extraDiurna, nocturna, extraNocturna, dominical] = horas.filas.map((fila) => fila.valorHora);

const credito = calcularCredito(20_000_000, eaAMensual(0.22), 48);
const hipotecario = calcularCredito(210_000_000, eaAMensual(0.12), 240);
const independiente = calcularAportesIndependiente(5_000_000, clasesRiesgoArl[0].tasa, SMMLV_2026);
const retencion = calcularRetencionFuente(10_000_000, UVT_2026);
const inversion = calcularInteresCompuesto(1_000_000, 300_000, 0.1, 10);
const maternidad = calcularLicenciaMaternidad(2_000_000, false, 0, 0);
const paternidad = calcularLicenciaPaternidad(2_000_000, 0);

export const contenidoCalculadoras: Record<string, ContenidoCalculadora> = {
	'liquidacion-laboral': {
		nombre: 'Calculadora de liquidación laboral',
		descripcion: 'Cesantías, intereses, prima y vacaciones al terminar el contrato.',
		icono: 'work',
		color: 'bg-[#e8d4b8]',
		comoSeCalcula: [
			'La liquidación laboral en Colombia suma las prestaciones sociales que el empleador debe al trabajador cuando termina el contrato. Se liquida con el año comercial de 360 días (meses de 30 días) y el último salario.',
		],
		puntos: [
			'Cesantías: (salario + auxilio de transporte) × días trabajados ÷ 360.',
			'Intereses de cesantías: cesantías × días trabajados × 12 % ÷ 360.',
			'Prima de servicios: (salario + auxilio de transporte) × días del semestre ÷ 360.',
			'Vacaciones: salario × días trabajados ÷ 720 (el auxilio de transporte no se incluye).',
		],
		ejemplo: `Un trabajador con salario de ${$(2_000_000)} más auxilio de transporte que laboró del 1 de enero al 30 de junio de 2026 (${liq.dias} días) recibe ${$(liq.cesantias)} de cesantías, ${$(liq.interesesCesantias)} de intereses, ${$(liq.prima)} de prima y ${$(liq.vacaciones)} de vacaciones: ${$(liq.total)} en total.`,
		faqs: [
			{
				question: '¿Cuánto tiempo tiene el empleador para pagar la liquidación?',
				answer:
					'Debe pagarla al terminar el contrato. Si se retrasa sin justificación, el artículo 65 del Código Sustantivo del Trabajo prevé una indemnización moratoria de un día de salario por cada día de retardo.',
			},
			{
				question: '¿El auxilio de transporte se incluye en la liquidación?',
				answer: `Sí en cesantías y prima de servicios, no en vacaciones. En 2026 el auxilio es de ${$(AUX_TRANSPORTE_2026)} y aplica a quienes ganan hasta dos salarios mínimos (${$(TOPE_AUX_TRANSPORTE_2026)}).`,
			},
			{
				question: '¿Si renuncio tengo derecho a liquidación?',
				answer:
					'Sí. Cesantías, intereses, prima y vacaciones se pagan sin importar la causa de terminación. Lo que no aplica al renunciar es la indemnización por despido sin justa causa.',
			},
			{
				question: '¿Debo liquidar todo el contrato o solo el último periodo?',
				answer:
					'Solo lo que no se haya pagado. Si las cesantías de años anteriores ya se consignaron al fondo y las primas se pagaron cada semestre, usa como fecha de inicio el comienzo del periodo pendiente (normalmente el 1 de enero o el inicio del semestre).',
			},
		],
		relacionadas: ['indemnizacion-despido', 'costo-liquidacion-empleador', 'horas-extra', 'fondo-emergencia'],
	},

	'costo-liquidacion-empleador': {
		nombre: 'Calculadora del costo de un empleado para la empresa',
		descripcion: 'Prestaciones y aportes patronales que asume la empresa por un trabajador.',
		icono: 'work',
		color: 'bg-[#e8d4b8]',
		comoSeCalcula: [
			'El costo real de un trabajador para la empresa va más allá del salario: incluye las prestaciones sociales que se le pagan a él y los aportes que el empleador hace a seguridad social y parafiscales durante el periodo.',
		],
		puntos: [
			'Prestaciones: cesantías, intereses de cesantías, prima de servicios y vacaciones.',
			'Pensión: 12 % del salario a cargo del empleador.',
			'ARL: entre 0,522 % y 6,96 % según la clase de riesgo.',
			'Caja de compensación: 4 % del salario.',
			'Salud (8,5 %), SENA (2 %) e ICBF (3 %): solo si el trabajador gana 10 salarios mínimos o más; por debajo de ese tope el empleador está exonerado.',
		],
		ejemplo: `Por un trabajador con salario mínimo (${$(SMMLV_2026)}) y riesgo I durante un año (${empleador.empleado.dias} días), la empresa paga ${$(empleador.empleado.total)} en prestaciones y ${$(empleador.totalAportesConExoneracion)} en aportes patronales: ${$(empleador.costoTotal)} adicionales al salario y al auxilio de transporte.`,
		faqs: [
			{
				question: '¿Cuánto le cuesta a una empresa un empleado con salario mínimo en 2026?',
				answer: `Además del salario (${$(SMMLV_2026)}) y el auxilio de transporte (${$(AUX_TRANSPORTE_2026)}), el empleador asume pensión, ARL, caja de compensación y la provisión de cesantías, intereses, prima y vacaciones. En un año eso suma cerca de ${$(empleador.costoTotal)} con riesgo I.`,
			},
			{
				question: '¿Qué empleadores están exonerados de salud, SENA e ICBF?',
				answer:
					'Las sociedades y las personas naturales con dos o más trabajadores, por los empleados que devenguen menos de 10 salarios mínimos (artículo 114-1 del Estatuto Tributario). La exoneración no cubre pensión, ARL ni caja de compensación.',
			},
			{
				question: '¿Qué porcentaje de seguridad social paga el empleador y cuál el trabajador?',
				answer:
					'En pensión el empleador aporta 12 % y el trabajador 4 %. En salud el empleador aporta 8,5 % (si no está exonerado) y el trabajador 4 %. La ARL la paga completa el empleador.',
			},
		],
		relacionadas: ['liquidacion-laboral', 'indemnizacion-despido', 'horas-extra', 'dotacion'],
	},

	'indemnizacion-despido': {
		nombre: 'Calculadora de indemnización por despido sin justa causa',
		descripcion: 'Cuánto corresponde si el contrato termina sin justa causa.',
		icono: 'balance',
		color: 'bg-[#a8d8d8]',
		comoSeCalcula: [
			'La indemnización por despido sin justa causa está en el artículo 64 del Código Sustantivo del Trabajo y depende del tipo de contrato, del salario y del tiempo de servicio.',
		],
		puntos: [
			'Término indefinido, salario inferior a 10 salarios mínimos: 30 días de salario por el primer año y 20 días por cada año adicional, proporcional por fracción.',
			'Término indefinido, salario de 10 salarios mínimos o más: 20 días por el primer año y 15 días por cada año adicional, proporcional por fracción.',
			'Término fijo: los salarios del tiempo que faltaba para terminar el plazo pactado.',
		],
		ejemplo: `Un trabajador con contrato indefinido, salario de ${$(2_500_000)} y 3 años de servicio tiene derecho a 30 + 20 × 2 = 70 días de salario, es decir ${$((2_500_000 / 30) * 70)}.`,
		faqs: [
			{
				question: '¿Hay indemnización si renuncio o me despiden con justa causa?',
				answer:
					'No. La indemnización solo aplica cuando el empleador termina el contrato sin justa causa, o cuando el trabajador renuncia por causas imputables al empleador (despido indirecto).',
			},
			{
				question: '¿La indemnización reemplaza la liquidación?',
				answer:
					'No, se suma. Además de la indemnización, el empleador debe pagar cesantías, intereses, prima y vacaciones pendientes.',
			},
			{
				question: '¿Qué pasa si despiden a una trabajadora embarazada?',
				answer:
					'El despido durante el embarazo o la licencia requiere autorización del Ministerio del Trabajo. Sin ella, el artículo 239 del Código Sustantivo del Trabajo ordena una indemnización adicional de 60 días de salario, además de las demás que correspondan.',
			},
		],
		relacionadas: ['liquidacion-laboral', 'costo-liquidacion-empleador', 'fondo-emergencia'],
	},

	'horas-extra': {
		nombre: 'Calculadora de horas extras y recargos',
		descripcion: 'Valor de la hora extra, el recargo nocturno y el dominical o festivo.',
		icono: 'clock',
		color: 'bg-[#f6e1a0]',
		comoSeCalcula: [
			`El valor de la hora ordinaria se obtiene dividiendo el salario mensual entre ${HORAS_MENSUALES_JORNADA_2026} horas, el divisor que corresponde a la jornada máxima de 42 horas semanales vigente desde el 15 de julio de 2026 (Ley 2101 de 2021). Sobre esa hora se aplica el recargo de cada tipo:`,
		],
		puntos: [
			'Hora extra diurna: 25 % de recargo.',
			'Recargo nocturno (hora ordinaria de noche): 35 %.',
			'Hora extra nocturna: 75 %.',
			'Dominical o festivo: 90 % desde el 1 de julio de 2026 (Ley 2466 de 2025).',
		],
		ejemplo: `Con el salario mínimo de 2026 (${$(SMMLV_2026)}) la hora ordinaria vale ${$(horas.horaOrdinaria)}. La hora extra diurna queda en ${$(extraDiurna)}, la hora nocturna en ${$(nocturna)}, la extra nocturna en ${$(extraNocturna)} y la hora dominical o festiva en ${$(dominical)}.`,
		faqs: [
			{
				question: '¿Cuántas horas extras se pueden trabajar en Colombia?',
				answer: 'Máximo 2 horas extras diarias y 12 a la semana.',
			},
			{
				question: '¿Cuánto es el recargo dominical y festivo en 2026?',
				answer:
					'La Ley 2466 de 2025 lo sube por etapas: 80 % desde el 1 de julio de 2025, 90 % desde el 1 de julio de 2026 y 100 % desde el 1 de julio de 2027.',
			},
			{
				question: '¿Desde qué hora se paga recargo nocturno?',
				answer:
					'Con la reforma laboral (Ley 2466 de 2025) la jornada nocturna va de 7:00 p. m. a 6:00 a. m. El trabajo ordinario en ese horario tiene un recargo del 35 %.',
			},
		],
		relacionadas: ['pago-por-horas', 'liquidacion-laboral', 'costo-liquidacion-empleador', 'retencion-fuente'],
	},

	'pago-por-horas': {
		nombre: 'Calculadora de pago por horas',
		descripcion: 'Pago de un trabajador por horas, día por día, con recargos.',
		icono: 'clock',
		color: 'bg-[#d7eff1]',
		comoSeCalcula: [
			`Cuando se contrata por horas, cada hora ordinaria se paga al valor pactado, que no puede ser inferior al mínimo legal: salario mínimo ÷ ${HORAS_MENSUALES_JORNADA_2026} horas = ${$(horas.horaOrdinaria)} en 2026. A las horas nocturnas, extras, dominicales y festivas se les suma el recargo correspondiente.`,
			'La calculadora arma un calendario con el periodo que elijas, marca automáticamente domingos y festivos, y agrupa por semana para avisarte si se supera el límite de 12 horas extras semanales.',
		],
		ejemplo: `Con la hora al mínimo legal (${$(horas.horaOrdinaria)}), una jornada de 6 horas diurnas en día hábil se paga a ${$(horas.horaOrdinaria * 6)}; las mismas 6 horas en domingo o festivo valen ${$(dominical * 6)}.`,
		faqs: [
			{
				question: '¿Cuánto vale la hora de trabajo con salario mínimo en 2026?',
				answer: `${$(horas.horaOrdinaria)} la hora ordinaria diurna: el salario mínimo de ${$(SMMLV_2026)} dividido entre ${HORAS_MENSUALES_JORNADA_2026} horas mensuales.`,
			},
			{
				question: '¿Un trabajador por horas tiene derecho a prestaciones sociales?',
				answer:
					'Sí. Cesantías, intereses, prima y vacaciones se causan en proporción al tiempo trabajado, y el empleador debe afiliarlo a seguridad social.',
			},
			{
				question: '¿Se pagan recargos si se trabaja por horas?',
				answer:
					'Sí. El trabajo nocturno, dominical, festivo y las horas extras tienen los mismos recargos que para un trabajador de tiempo completo.',
			},
		],
		relacionadas: ['horas-extra', 'costo-liquidacion-empleador', 'liquidacion-laboral', 'dotacion'],
	},

	'retencion-fuente': {
		nombre: 'Calculadora de retención en la fuente',
		descripcion: 'Retención sobre salarios, honorarios, servicios, compras y arriendos.',
		icono: 'tax',
		color: 'bg-[#d7eff1]',
		comoSeCalcula: [
			`Para salarios se usa el procedimiento 1: al ingreso mensual se le restan los aportes obligatorios a salud y pensión, luego el 25 % de renta exenta laboral (con tope de 790 UVT al año) y el resultado se convierte a UVT (${$(UVT_2026)} en 2026) para ubicarlo en la tabla del artículo 383 del Estatuto Tributario.`,
			'Para compras, servicios, honorarios y arrendamientos, la retención es el valor del pago multiplicado por la tarifa del concepto, siempre que el pago alcance la base mínima en UVT.',
		],
		ejemplo: `Un salario de ${$(10_000_000)} tiene ${$(retencion.aportesObligatorios)} de aportes obligatorios y ${$(retencion.rentaExenta)} de renta exenta. La base gravable queda en ${$(retencion.baseGravable)} y la retención mensual en ${$(retencion.retencionPesos)}.`,
		faqs: [
			{
				question: '¿Desde qué salario se aplica retención en la fuente en 2026?',
				answer: `Desde que la base gravable mensual, después de aportes y renta exenta, supera 95 UVT (${$(95 * UVT_2026)}). Por debajo de ese valor la retención es cero.`,
			},
			{
				question: '¿Cuánto vale la UVT en 2026?',
				answer: `${$(UVT_2026)}, fijada por la DIAN.`,
			},
			{
				question: '¿Cómo puedo disminuir la retención sobre mi salario?',
				answer:
					'Con deducciones y rentas exentas que esta calculadora no incluye: dependientes económicos, intereses de crédito de vivienda, medicina prepagada y aportes voluntarios a pensión o cuentas AFC, dentro de los límites legales.',
			},
		],
		relacionadas: ['aportes-independientes', 'costo-liquidacion-empleador', '4x1000'],
	},

	'aportes-independientes': {
		nombre: 'Calculadora de seguridad social para independientes',
		descripcion: 'Salud, pensión y ARL que paga un contratista independiente.',
		icono: 'work',
		color: 'bg-[#d7c0e8]',
		comoSeCalcula: [
			'Un contratista por prestación de servicios cotiza sobre un ingreso base de cotización (IBC) equivalente al 40 % de sus ingresos mensuales, sin que pueda ser inferior a un salario mínimo. Sobre ese IBC se aplican las tarifas:',
		],
		puntos: [
			'Salud: 12,5 %.',
			'Pensión: 16 %.',
			'ARL: según la clase de riesgo, desde 0,522 % (riesgo I).',
			'Fondo de solidaridad pensional: 1 % adicional si el IBC es de 4 salarios mínimos o más.',
		],
		ejemplo: `Con honorarios de ${$(5_000_000)} el IBC es ${$(independiente.ibc)}. Se pagan ${$(independiente.salud)} de salud, ${$(independiente.pension)} de pensión y ${$(independiente.arl)} de ARL en riesgo I: ${$(independiente.total)} al mes.`,
		faqs: [
			{
				question: '¿Cuánto paga de seguridad social un independiente que gana el mínimo?',
				answer: `Cotiza sobre un salario mínimo (${$(SMMLV_2026)}): ${$(SMMLV_2026 * 0.125)} de salud y ${$(SMMLV_2026 * 0.16)} de pensión, más la ARL según su riesgo.`,
			},
			{
				question: '¿El independiente paga la planilla mes vencido?',
				answer:
					'Sí. Los independientes cotizan mes vencido: en la planilla PILA de cada mes se pagan los aportes correspondientes a los ingresos del mes anterior.',
			},
			{
				question: '¿Quién paga la ARL de un contratista?',
				answer:
					'En riesgos I, II y III la paga el contratista. En riesgos IV y V la asume el contratante.',
			},
		],
		relacionadas: ['retencion-fuente', 'incapacidad-laboral', 'licencia-maternidad-paternidad', 'fondo-emergencia'],
	},

	'incapacidad-laboral': {
		nombre: 'Calculadora de incapacidad médica laboral',
		descripcion: 'Cuánto pagan por una incapacidad y quién paga cada día.',
		icono: 'medical',
		color: 'bg-[#f9d1ce]',
		comoSeCalcula: [
			'El pago de una incapacidad depende de su origen y de cuántos días dure.',
		],
		puntos: [
			'Enfermedad general, días 1 y 2: a cargo del empleador.',
			'Enfermedad general, días 3 a 90: la EPS paga el 66,67 % del salario.',
			'Enfermedad general, días 91 a 180: la EPS paga el 50 % del salario.',
			'Accidente o enfermedad laboral: la ARL paga el 100 % desde el día siguiente al accidente.',
			'En ningún caso el auxilio diario puede ser inferior al salario mínimo diario.',
		],
		ejemplo: `Con un salario de ${$(3_000_000)} (${$(100_000)} diarios), una incapacidad de 10 días por enfermedad general deja 2 días a cargo del empleador y 8 a cargo de la EPS, que paga ${$(100_000 * 0.6667)} por día: ${$(100_000 * 0.6667 * 8)}.`,
		faqs: [
			{
				question: '¿Quién paga los dos primeros días de incapacidad?',
				answer:
					'El empleador, cuando la incapacidad es por enfermedad general. Desde el tercer día el pago le corresponde a la EPS.',
			},
			{
				question: '¿Qué pasa después de 180 días de incapacidad?',
				answer:
					'El pago pasa al fondo de pensiones, que puede reconocer un subsidio mientras se define la calificación de pérdida de capacidad laboral. Esta calculadora solo cubre hasta el día 180.',
			},
			{
				question: '¿Durante la incapacidad se siguen pagando salud y pensión?',
				answer:
					'Sí. El contrato sigue vigente y se continúa cotizando a seguridad social durante la incapacidad.',
			},
		],
		relacionadas: ['licencia-maternidad-paternidad', 'aportes-independientes', 'costo-liquidacion-empleador', 'liquidacion-laboral'],
	},

	'licencia-maternidad-paternidad': {
		nombre: 'Calculadora de licencia de maternidad y paternidad',
		descripcion: 'Semanas y valor de la licencia a cargo de la EPS.',
		icono: 'medical',
		color: 'bg-[#f0cadb]',
		comoSeCalcula: [
			'La licencia la paga la EPS al 100 % del salario o del ingreso base de cotización. El valor es el salario diario (salario ÷ 30) multiplicado por los días de licencia.',
		],
		puntos: [
			'Maternidad: 18 semanas (126 días).',
			'Parto múltiple o hijo con discapacidad: 2 semanas adicionales.',
			'Parto prematuro: se suman las semanas que faltaban para el término.',
			'Paternidad: 2 semanas.',
			'Licencia parental compartida: la madre puede ceder hasta 6 semanas al padre.',
		],
		ejemplo: `Con un salario de ${$(2_000_000)}, la licencia de maternidad de ${maternidad.semanas} semanas (${maternidad.dias} días) vale ${$(maternidad.valor)}, y la de paternidad de ${paternidad.semanas} semanas (${paternidad.dias} días) vale ${$(paternidad.valor)}.`,
		faqs: [
			{
				question: '¿Cuántas semanas dura la licencia de maternidad en Colombia?',
				answer:
					'18 semanas remuneradas. Se amplía 2 semanas por parto múltiple o hijo con discapacidad, y en parto prematuro se suma la diferencia entre la fecha del parto y la fecha a término.',
			},
			{
				question: '¿Quién paga la licencia de maternidad?',
				answer:
					'La EPS. En la práctica el empleador suele pagarla en la nómina y luego recobrarla a la EPS.',
			},
			{
				question: '¿Una trabajadora independiente tiene licencia de maternidad?',
				answer:
					'Sí, si cotiza a salud como independiente. La EPS la liquida sobre el ingreso base con el que cotizó.',
			},
		],
		relacionadas: ['incapacidad-laboral', 'indemnizacion-despido', 'aportes-independientes', 'fondo-emergencia'],
	},

	dotacion: {
		nombre: 'Calculadora de dotación laboral',
		descripcion: 'Verifica si un trabajador tiene derecho a dotación.',
		icono: 'save',
		color: 'bg-[#d5e8bd]',
		comoSeCalcula: [
			`Según los artículos 230 a 234 del Código Sustantivo del Trabajo, el empleador debe entregar calzado y vestido de labor a los trabajadores que ganan hasta dos salarios mínimos (${$(SMMLV_2026 * 2)} en 2026) y llevan más de tres meses de servicio en la fecha de cada entrega.`,
			'Se entrega tres veces al año: el 30 de abril, el 31 de agosto y el 20 de diciembre.',
		],
		ejemplo: `Un trabajador que gana ${$(2_500_000)} y lleva 6 meses en la empresa sí tiene derecho. Uno que gana ${$(4_000_000)} no, porque supera el tope de dos salarios mínimos.`,
		faqs: [
			{
				question: '¿La dotación se puede pagar en dinero?',
				answer:
					'No mientras el contrato esté vigente: la ley prohíbe compensarla en dinero. Solo al terminar el contrato se puede reclamar el valor de la dotación que no se entregó.',
			},
			{
				question: '¿Cada cuánto se entrega la dotación?',
				answer: 'Tres veces al año: 30 de abril, 31 de agosto y 20 de diciembre.',
			},
			{
				question: '¿Qué incluye la dotación?',
				answer:
					'Un par de zapatos y un vestido de labor adecuados para el trabajo que se realiza. Los elementos de protección personal son una obligación aparte.',
			},
		],
		relacionadas: ['costo-liquidacion-empleador', 'horas-extra', 'pago-por-horas', 'liquidacion-laboral'],
	},

	'cuota-credito': {
		nombre: 'Simulador de crédito',
		descripcion: 'Cuota mensual, intereses y tabla de amortización de un crédito.',
		icono: 'loan',
		color: 'bg-[#b9dfea]',
		comoSeCalcula: [
			'El simulador usa el sistema de cuota fija (amortización francesa), el más común en créditos de consumo y libre inversión en Colombia. Primero convierte la tasa efectiva anual a mensual con (1 + E.A.)^(1/12) − 1, no dividiendo entre 12, y luego calcula la cuota con el monto, la tasa mensual y el número de meses.',
			'En cada cuota una parte paga intereses sobre el saldo y el resto abona a capital. Con la tabla de amortización puedes simular abonos extra para reducir el plazo o la cuota.',
		],
		ejemplo: `Un crédito de ${$(20_000_000)} a 48 meses con tasa del 22 % E.A. tiene una cuota de ${$(credito.cuotaMensual)} y paga ${$(credito.interesTotal)} de intereses en total.`,
		faqs: [
			{
				question: '¿Qué diferencia hay entre tasa efectiva anual y mensual vencida?',
				answer:
					'La efectiva anual (E.A.) es el costo del crédito en un año con capitalización. La mensual vencida (M.V.) es la tasa que se aplica cada mes al saldo. Una tasa de 1,5 % M.V. equivale a 19,56 % E.A.',
			},
			{
				question: '¿Conviene abonar a capital para reducir plazo o cuota?',
				answer:
					'Reducir plazo ahorra más intereses porque la deuda se termina antes. Reducir cuota libera flujo de caja mensual. El simulador te muestra el ahorro en ambos casos.',
			},
			{
				question: '¿Qué es la tasa de usura?',
				answer:
					'Es el interés máximo que se puede cobrar legalmente, certificado por la Superintendencia Financiera. Ninguna entidad puede cobrar por encima de ese límite.',
			},
		],
		relacionadas: ['capacidad-endeudamiento', 'costo-carro', 'credito-hipotecario', '4x1000'],
	},

	'credito-hipotecario': {
		nombre: 'Simulador de crédito hipotecario',
		descripcion: 'Cuota de un crédito de vivienda en pesos, con seguros y abonos.',
		icono: 'home',
		color: 'bg-[#d5e8bd]',
		comoSeCalcula: [
			'El simulador calcula un crédito de vivienda en pesos a tasa fija con cuota constante. El monto financiado es el valor de la vivienda menos la cuota inicial; sobre ese monto se calcula la cuota con la tasa mensual equivalente y el plazo en meses.',
			'A la cuota de capital e intereses se suman los seguros obligatorios: vida deudores, sobre el saldo del crédito, e incendio y terremoto, sobre el valor del inmueble. Los valores sugeridos son de referencia y puedes editarlos.',
		],
		ejemplo: `Para una vivienda de ${$(300_000_000)} con cuota inicial del 30 % se financian ${$(210_000_000)}. A 20 años y 12 % E.A., la cuota de capital e intereses es de ${$(hipotecario.cuotaMensual)}, antes de seguros.`,
		faqs: [
			{
				question: '¿Cuánto es la cuota inicial de una vivienda en Colombia?',
				answer:
					'Normalmente el 30 % del valor, porque los bancos financian hasta el 70 % en vivienda no VIS. En vivienda de interés social la financiación puede llegar al 80 %.',
			},
			{
				question: '¿Cuánto debo ganar para que me aprueben el crédito?',
				answer:
					'La primera cuota no puede superar el 30 % de los ingresos familiares (Ley 546 de 1999). Para una cuota de 2 millones se necesitan ingresos de al menos 6,7 millones aproximadamente.',
			},
			{
				question: '¿Es mejor un crédito en pesos o en UVR?',
				answer:
					'En pesos la cuota es fija y predecible. En UVR la cuota inicial es más baja pero sube con la inflación. Este simulador calcula créditos en pesos.',
			},
		],
		relacionadas: ['capacidad-endeudamiento', 'comprar-vs-arrendar', 'cuota-credito'],
	},

	'capacidad-endeudamiento': {
		nombre: 'Calculadora de capacidad de endeudamiento',
		descripcion: 'Cuota máxima que puedes asumir según tus ingresos y deudas.',
		icono: 'balance',
		color: 'bg-[#f6e1a0]',
		comoSeCalcula: [
			'La capacidad de endeudamiento es la parte de tus ingresos que puedes destinar a cuotas de deuda sin comprometer el resto de tus gastos. Se calcula como un porcentaje de los ingresos netos menos las cuotas que ya pagas.',
			'La calculadora muestra tres niveles de referencia: conservador (30 %), estándar (35 %) y máximo bancario (40 %). No son límites legales sino referencias de mercado.',
		],
		ejemplo: `Con ingresos netos de ${$(4_000_000)} y cuotas actuales de ${$(600_000)}, te quedan ${$(4_000_000 * 0.3 - 600_000)} disponibles en el nivel conservador, ${$(4_000_000 * 0.35 - 600_000)} en el estándar y ${$(4_000_000 * 0.4 - 600_000)} en el máximo.`,
		faqs: [
			{
				question: '¿Qué porcentaje del salario puedo destinar a deudas?',
				answer:
					'Como referencia, entre el 30 % y el 40 % de los ingresos netos. Por encima del 40 % es difícil que una entidad apruebe un nuevo crédito y el presupuesto queda muy ajustado.',
			},
			{
				question: '¿Qué deudas debo incluir?',
				answer:
					'Todas las cuotas fijas mensuales: créditos de consumo, vehículo, vivienda, libranzas y el pago habitual de tarjetas de crédito.',
			},
			{
				question: '¿Cómo mejorar mi capacidad de endeudamiento?',
				answer:
					'Pagando o unificando deudas para bajar las cuotas actuales, aumentando ingresos demostrables o ampliando el plazo del nuevo crédito para reducir su cuota.',
			},
		],
		relacionadas: ['cuota-credito', 'credito-hipotecario', 'costo-carro', 'fondo-emergencia'],
	},

	'comprar-vs-arrendar': {
		nombre: 'Calculadora de comprar o arrendar vivienda',
		descripcion: 'Compara el patrimonio de comprar vivienda frente a arrendar e invertir.',
		icono: 'home',
		color: 'bg-[#d7c0e8]',
		comoSeCalcula: [
			'La calculadora compara el patrimonio que tendrías al final del horizonte que elijas en dos escenarios. Si compras: el valor futuro de la vivienda (con la valorización anual que supongas) menos el saldo que aún debas del crédito. Si arriendas: lo que acumularías invirtiendo la cuota inicial y la diferencia mensual entre la cuota del crédito y el arriendo, a la rentabilidad que definas.',
			'Los supuestos de valorización, rentabilidad, tasa del crédito y plazo son editables, porque el resultado depende sobre todo de ellos.',
		],
		ejemplo:
			'Si la cuota del crédito es mucho mayor que el arriendo de una vivienda equivalente y la rentabilidad esperada de invertir supera la valorización del inmueble, arrendar e invertir tiende a ganar. Si la diferencia es pequeña y la vivienda se valoriza bien, comprar toma ventaja.',
		faqs: [
			{
				question: '¿Qué es mejor, comprar o arrendar vivienda?',
				answer:
					'Depende de la relación entre arriendo y precio de la vivienda, la tasa del crédito, cuánto tiempo piensas vivir allí y si realmente invertirías la diferencia. No hay una respuesta única; por eso conviene simularlo con tus cifras.',
			},
			{
				question: '¿Qué gastos adicionales tiene comprar vivienda?',
				answer:
					'Gastos notariales, de registro y beneficencia al comprar, y luego predial, administración, seguros y mantenimiento. Al arrendar no asumes esos costos, pero el canon sube cada año.',
			},
			{
				question: '¿Cuánto puede subir el arriendo cada año?',
				answer:
					'En vivienda urbana, el incremento anual no puede superar la inflación (IPC) del año anterior, según la Ley 820 de 2003.',
			},
		],
		relacionadas: ['credito-hipotecario', 'capacidad-endeudamiento', 'interes-compuesto'],
	},

	'costo-carro': {
		nombre: 'Calculadora del costo de mantener un carro',
		descripcion: 'Costo mensual real de tener carro, con todos los gastos.',
		icono: 'car',
		color: 'bg-[#f6e1a0]',
		comoSeCalcula: [
			'El costo real de tener carro es la suma mensual de todo lo que pagas por él, no solo la cuota. La calculadora lleva a valor mensual los gastos anuales y agrega la depreciación, que es el valor que el carro pierde cada año aunque no salga de tu bolsillo mes a mes.',
		],
		puntos: [
			'Cuota del crédito, si lo financias.',
			'Seguro todo riesgo.',
			'Gasolina o carga eléctrica.',
			'Mantenimiento.',
			'SOAT y revisión tecnomecánica, divididos entre 12.',
			'Depreciación anual, dividida entre 12.',
		],
		ejemplo: `En un carro de ${$(80_000_000)} con depreciación del 12 % anual, solo la pérdida de valor equivale a ${$((80_000_000 * 0.12) / 12)} al mes, a lo que se suman combustible, seguro, mantenimiento y la cuota.`,
		faqs: [
			{
				question: '¿Cuánto cuesta mantener un carro al mes en Colombia?',
				answer:
					'Depende del valor del carro y de cuánto lo uses, pero al sumar seguro, combustible, mantenimiento, SOAT y depreciación suele estar entre 1 y 2 millones de pesos mensuales para un carro de gama media, sin contar la cuota del crédito.',
			},
			{
				question: '¿Qué gastos no incluye la calculadora?',
				answer:
					'El impuesto vehicular anual, parqueaderos, peajes, lavadas y comparendos. Si los conoces, súmalos al resultado.',
			},
			{
				question: '¿Sale más barato un carro eléctrico?',
				answer:
					'En operación sí: la carga eléctrica y el mantenimiento cuestan menos que en un carro a gasolina. El precio de compra y el seguro suelen ser más altos, por eso conviene comparar el costo total.',
			},
		],
		relacionadas: ['cuota-credito', 'capacidad-endeudamiento', 'fondo-emergencia'],
	},

	'fondo-emergencia': {
		nombre: 'Calculadora de fondo de emergencia',
		descripcion: 'Cuánto ahorrar para imprevistos y en cuánto tiempo lograrlo.',
		icono: 'save',
		color: 'bg-[#d7c0e8]',
		comoSeCalcula: [
			'El fondo de emergencia es el dinero que te permite cubrir tus gastos esenciales si pierdes tus ingresos. La meta es tu gasto mensual fijo multiplicado por los meses que quieres cubrir: 3 si tienes ingresos estables, 6 si son variables o tienes personas a cargo.',
			'El ahorro mensual necesario es la meta dividida entre el plazo en que quieras completarla.',
		],
		ejemplo: `Con gastos fijos de ${$(2_500_000)} y una cobertura de 4,5 meses, la meta es ${$(2_500_000 * 4.5)}. Para reunirla en 12 meses hay que ahorrar ${$((2_500_000 * 4.5) / 12)} cada mes.`,
		faqs: [
			{
				question: '¿De cuánto debe ser un fondo de emergencia?',
				answer:
					'Entre 3 y 6 meses de gastos esenciales: arriendo o cuota de vivienda, servicios, alimentación, transporte y deudas.',
			},
			{
				question: '¿Dónde guardar el fondo de emergencia?',
				answer:
					'En un producto de bajo riesgo y disponibilidad inmediata, como una cuenta de ahorros de alta rentabilidad o un fondo de inversión a la vista. No debe estar en inversiones que puedan perder valor o tengan permanencia.',
			},
			{
				question: '¿Primero pago deudas o armo el fondo?',
				answer:
					'Lo usual es reunir un fondo mínimo de un mes de gastos, luego pagar las deudas más costosas (como tarjetas de crédito) y después completar el fondo.',
			},
		],
		relacionadas: ['interes-compuesto', 'capacidad-endeudamiento', '4x1000'],
	},

	'interes-compuesto': {
		nombre: 'Calculadora de interés compuesto',
		descripcion: 'Cómo crece tu ahorro o inversión con aportes mensuales.',
		icono: 'invest',
		color: 'bg-[#efa9a4]',
		comoSeCalcula: [
			'Con interés compuesto, los rendimientos de cada periodo se suman al capital y generan nuevos rendimientos. La calculadora convierte la tasa efectiva anual a mensual y, mes a mes, aplica: saldo = saldo × (1 + tasa mensual) + aporte.',
			'El resultado separa cuánto aportaste tú y cuánto generó el interés, en pesos nominales (sin descontar inflación ni impuestos).',
		],
		ejemplo: `Con ${$(1_000_000)} iniciales y aportes de ${$(300_000)} mensuales al 10 % E.A. durante 10 años, acumulas ${$(inversion.saldoFinal)}: ${$(inversion.totalAportado)} son tus aportes y ${$(inversion.interesGenerado)} son intereses.`,
		faqs: [
			{
				question: '¿Qué diferencia hay entre interés simple y compuesto?',
				answer:
					'En el simple los intereses se calculan siempre sobre el capital inicial. En el compuesto se calculan sobre el capital más los intereses acumulados, por eso el crecimiento se acelera con el tiempo.',
			},
			{
				question: '¿Qué tasa debo usar en la simulación?',
				answer:
					'La rentabilidad efectiva anual que esperas del producto: la tasa de un CDT o cuenta de ahorro, o el rendimiento histórico de un fondo. Las rentabilidades pasadas no garantizan las futuras.',
			},
			{
				question: '¿El resultado tiene en cuenta la inflación?',
				answer:
					'No. Para estimar el crecimiento real, resta la inflación esperada a la tasa: con 10 % E.A. e inflación del 5 %, usa cerca de 5 %.',
			},
		],
		relacionadas: ['fondo-emergencia', 'comprar-vs-arrendar', '4x1000'],
	},

	'4x1000': {
		nombre: 'Calculadora del 4x1000',
		descripcion: 'Impuesto que pagas por un retiro o transferencia.',
		icono: 'tax',
		color: 'bg-[#d7eff1]',
		comoSeCalcula: [
			'El 4x1000 o gravamen a los movimientos financieros (GMF) es un impuesto de 4 pesos por cada 1.000 que salen de una cuenta bancaria. Se calcula multiplicando el monto del retiro o transferencia por 0,4 %.',
			`Cada persona puede tener movimientos exentos hasta por 350 UVT al mes (${$(350 * UVT_2026)} en 2026) en su cuenta de ahorros marcada como exenta.`,
		],
		ejemplo: `Por una transferencia de ${$(1_000_000)} se pagan ${$(4_000)} de 4x1000; por una de ${$(10_000_000)}, ${$(40_000)}.`,
		faqs: [
			{
				question: '¿Cómo evitar el 4x1000?',
				answer:
					'Marcando tu cuenta de ahorros como exenta ante el banco y moviendo el dinero entre cuentas del mismo titular en la misma entidad, que no causa el impuesto.',
			},
			{
				question: '¿Las transferencias entre mis propias cuentas pagan 4x1000?',
				answer:
					'No si ambas cuentas son tuyas y están en el mismo banco. Entre bancos distintos sí se cobra, salvo que la cuenta de origen esté exenta y no superes el tope.',
			},
			{
				question: '¿El 4x1000 se puede descontar en la declaración de renta?',
				answer:
					'Sí. El 50 % del gravamen pagado durante el año es deducible, siempre que esté certificado por la entidad financiera.',
			},
		],
		relacionadas: ['cuota-credito', 'retencion-fuente', 'interes-compuesto'],
	},
};
