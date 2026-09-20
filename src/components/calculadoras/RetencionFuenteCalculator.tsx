import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UVT_2026 } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import {
	CONCEPTOS_RETENCION,
	calcularRetencionFuente,
	calcularRetencionPorConcepto,
	type ConceptoRetencion,
	type ResultadoRetencion,
	type ResultadoRetencionConcepto,
} from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

type Concepto = 'salarios' | ConceptoRetencion;

interface FormValues {
	concepto: Concepto;
	ingreso: string;
	declarante: boolean;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

const opcionesConcepto: { value: Concepto; label: string }[] = [
	{ value: 'salarios', label: 'Salarios' },
	...(Object.entries(CONCEPTOS_RETENCION) as [ConceptoRetencion, (typeof CONCEPTOS_RETENCION)[ConceptoRetencion]][]).map(
		([value, config]) => ({ value, label: config.label })
	),
];

export default function RetencionFuenteCalculator() {
	const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
		defaultValues: { concepto: 'salarios', ingreso: '', declarante: true },
	});

	const concepto = watch('concepto');
	const [resultadoSalarios, setResultadoSalarios] = useState<ResultadoRetencion | null>(null);
	const [resultadoConcepto, setResultadoConcepto] = useState<ResultadoRetencionConcepto | null>(null);

	const onSubmit = (data: FormValues) => {
		const ingreso = parseMonto(data.ingreso);
		if (!ingreso) return;

		if (data.concepto === 'salarios') {
			setResultadoConcepto(null);
			setResultadoSalarios(calcularRetencionFuente(ingreso, UVT_2026));
		} else {
			setResultadoSalarios(null);
			setResultadoConcepto(calcularRetencionPorConcepto(data.concepto, ingreso, data.declarante, UVT_2026));
		}
	};

	const configConcepto = concepto !== 'salarios' ? CONCEPTOS_RETENCION[concepto] : null;

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					elige el concepto del pago (salarios, compras, servicios, honorarios, arrendamientos...)
					e ingresa el valor. Calculamos si aplica retención y cuánto.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="concepto" className="block text-sm font-medium text-ink">
							Concepto del pago
						</label>
						<select
							id="concepto"
							className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('concepto')}
						>
							{opcionesConcepto.map((opcion) => (
								<option key={opcion.value} value={opcion.value}>
									{opcion.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label htmlFor="ingreso" className="block text-sm font-medium text-ink">
							{concepto === 'salarios' ? 'Ingreso laboral gravable mensual' : 'Valor del pago'}
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="ingreso"
								placeholder="6.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('ingreso', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('ingreso', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
						{concepto === 'salarios' && (
							<p className="mt-1 text-xs text-ink/50">
								El salario total antes de descontar aportes a salud y pensión.
							</p>
						)}
					</div>

					{configConcepto?.permiteDeclarante && (
						<div>
							<label htmlFor="declarante" className="block text-sm font-medium text-ink">
								¿Quién recibe el pago es declarante de renta?
							</label>
							<select
								id="declarante"
								className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
								{...register('declarante', {
									setValueAs: (v) => v === 'true' || v === true,
								})}
							>
								<option value="true">Sí, es declarante</option>
								<option value="false">No es declarante</option>
							</select>
						</div>
					)}

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{resultadoSalarios && (
				<div id="resultado-retencion">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Retención mensual: {currency.format(resultadoSalarios.retencionPesos)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Base gravable de {currency.format(resultadoSalarios.baseGravable)} (
							{resultadoSalarios.baseGravableUVT.toFixed(1)} UVT).
						</p>
					</div>
					<ExportButtons targetId="resultado-retencion" title="Resultado de retención en la fuente" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Aportes obligatorios (8%)</dt>
								<dd className="text-right text-ink">{currency.format(resultadoSalarios.aportesObligatorios)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Renta exenta (25%, topada)</dt>
								<dd className="text-right text-ink">{currency.format(resultadoSalarios.rentaExenta)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Base gravable</dt>
								<dd className="text-right text-ink">
									{currency.format(resultadoSalarios.baseGravable)} ({resultadoSalarios.baseGravableUVT.toFixed(1)} UVT)
								</dd>
							</div>
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Retención en la fuente mensual</span>
							<span>{currency.format(resultadoSalarios.retencionPesos)}</span>
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Tabla de tarifas del artículo 383 del Estatuto Tributario (procedimiento 1), depurada
						según el artículo 206. UVT 2026: {currency.format(UVT_2026)} (Resolución DIAN 000238 de
						2025). El umbral mínimo para retener es 95 UVT mensuales ({currency.format(95 * UVT_2026)}
						). No incluye deducciones adicionales por dependientes, intereses de vivienda o aportes
						voluntarios, que reducirían aún más la base.
					</p>
				</div>
			)}

			{resultadoConcepto && configConcepto && (
				<div id="resultado-retencion">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							{resultadoConcepto.aplica
								? `Retención: ${currency.format(resultadoConcepto.retencionPesos)}`
								: 'No aplica retención'}
						</p>
						<p className="mt-4 text-base text-surface/80">
							{configConcepto.label} · tarifa {(resultadoConcepto.tarifa * 100).toFixed(1)}%
						</p>
					</div>
					<ExportButtons targetId="resultado-retencion" title={`Retención por ${configConcepto.label.toLowerCase()}`} />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Base mínima para que aplique</dt>
								<dd className="text-right text-ink">{currency.format(resultadoConcepto.baseMinima)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Tarifa</dt>
								<dd className="text-right text-ink">{(resultadoConcepto.tarifa * 100).toFixed(1)}%</dd>
							</div>
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Retención a practicar</span>
							<span>{currency.format(resultadoConcepto.retencionPesos)}</span>
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Tarifas y bases mínimas en UVT según el Decreto 572 de 2025, vigentes desde el 1 de
						julio de 2026 tras la revocatoria de su suspensión provisional (Consejo de Estado,
						auto del 2 de junio de 2026, expediente 30229). UVT 2026: {currency.format(UVT_2026)}{' '}
						(Resolución DIAN 000238 de 2025). Este concepto ha cambiado más de una vez en el año
						por decisiones judiciales: verifica la tabla vigente con tu contador antes de aplicarla.
					</p>
				</div>
			)}
		</div>
	);
}
