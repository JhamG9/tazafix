import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { currency, miles } from '../../lib/format';
import {
	calcularComprarVsArrendar,
	supuestosPorDefecto,
	type ResultadoComprarVsArrendar,
} from '../../lib/comprarVsArrendar';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	valorVivienda: string;
	cuotaInicial: string;
	arriendoMensual: string;
	aniosHorizonte: number;
	tasaCreditoEA: number;
	plazoCreditoAnios: number;
	valorizacionAnual: number;
	rentabilidadAnual: number;
	gastosMantenimientoPct: number;
	costosCompraPct: number;
}

const camposSupuestos = [
	'tasaCreditoEA',
	'plazoCreditoAnios',
	'valorizacionAnual',
	'rentabilidadAnual',
	'gastosMantenimientoPct',
	'costosCompraPct',
] as const;

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function CompararComprarArrendarCalculator() {
	const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
		defaultValues: {
			valorVivienda: '',
			cuotaInicial: '',
			arriendoMensual: '',
			aniosHorizonte: 10,
			tasaCreditoEA: supuestosPorDefecto.tasaCreditoEA * 100,
			plazoCreditoAnios: supuestosPorDefecto.plazoCreditoAnios,
			valorizacionAnual: supuestosPorDefecto.valorizacionAnual * 100,
			rentabilidadAnual: supuestosPorDefecto.rentabilidadAnual * 100,
			gastosMantenimientoPct: supuestosPorDefecto.gastosMantenimientoPct * 100,
			costosCompraPct: supuestosPorDefecto.costosCompraPct * 100,
		},
	});

	const [resultado, setResultado] = useState<ResultadoComprarVsArrendar | null>(null);
	const [aniosHorizonte, setAniosHorizonte] = useState(10);
	const [usoSupuestosPorDefecto, setUsoSupuestosPorDefecto] = useState(true);
	const resultadosRef = useRef<HTMLDivElement>(null);

	const onSubmit = (data: FormValues) => {
		const valorVivienda = parseMonto(data.valorVivienda);
		const cuotaInicial = parseMonto(data.cuotaInicial) || 0;
		const arriendoMensual = parseMonto(data.arriendoMensual);
		const anios = data.aniosHorizonte;

		if (!valorVivienda || !arriendoMensual || !anios || cuotaInicial >= valorVivienda) return;

		const resultadoCalculado = calcularComprarVsArrendar({
			valorVivienda,
			cuotaInicial,
			arriendoMensual,
			aniosHorizonte: anios,
			supuestos: {
				tasaCreditoEA: data.tasaCreditoEA / 100,
				plazoCreditoAnios: data.plazoCreditoAnios,
				valorizacionAnual: data.valorizacionAnual / 100,
				rentabilidadAnual: data.rentabilidadAnual / 100,
				gastosMantenimientoPct: data.gastosMantenimientoPct / 100,
				costosCompraPct: data.costosCompraPct / 100,
			},
		});

		const huboAjustes = camposSupuestos.some((campo) => formState.dirtyFields[campo]);

		setResultado(resultadoCalculado);
		setAniosHorizonte(anios);
		setUsoSupuestosPorDefecto(!huboAjustes);

		requestAnimationFrame(() => {
			resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	const mayorPatrimonio = resultado
		? Math.max(Math.abs(resultado.patrimonioComprando), Math.abs(resultado.patrimonioArrendando))
		: 0;
	const esNeutral =
		resultado && mayorPatrimonio > 0
			? Math.abs(resultado.diferenciaPatrimonio) < mayorPatrimonio * 0.05
			: false;

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>compara una vivienda similar: valor, cuota inicial y arriendo. Los supuestos avanzados ya tienen referencias editables.</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="valorVivienda" className="block text-sm font-medium text-ink">
							Valor de la vivienda
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="valorVivienda"
								placeholder="300.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('valorVivienda', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('valorVivienda', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="cuotaInicial" className="block text-sm font-medium text-ink">
							Cuota inicial disponible
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="cuotaInicial"
								placeholder="60.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('cuotaInicial', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('cuotaInicial', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="arriendoMensual" className="block text-sm font-medium text-ink">
							Arriendo mensual equivalente
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="arriendoMensual"
								placeholder="1.500.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('arriendoMensual', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('arriendoMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							De una vivienda similar a la que estás considerando comprar.
						</p>
					</div>

					<div>
						<label htmlFor="aniosHorizonte" className="block text-sm font-medium text-ink">
							Horizonte de comparación (años)
						</label>
						<input
							type="number"
							min="1"
							id="aniosHorizonte"
							placeholder="10"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('aniosHorizonte', { required: true, valueAsNumber: true })}
						/>
						<p className="mt-1 text-xs text-ink/50">
							Cuántos años planeas vivir ahí antes de comparar el patrimonio acumulado.
						</p>
					</div>

					<details className="group rounded-lg ring-1 ring-primary/20">
						<summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-ink marker:content-none">
							<span className="inline-flex w-full items-center justify-between">
								Ajustar supuestos
								<span className="text-ink/40 transition-transform group-open:rotate-180">▾</span>
							</span>
						</summary>
						<div className="space-y-4 border-t border-primary/10 px-3 py-4">
							<div>
								<label htmlFor="tasaCreditoEA" className="block text-xs font-medium text-ink">
									Tasa de interés del crédito (E.A.)
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.01"
										min="0"
										id="tasaCreditoEA"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('tasaCreditoEA', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
							</div>

							<div>
								<label htmlFor="plazoCreditoAnios" className="block text-xs font-medium text-ink">
									Plazo del crédito hipotecario (años)
								</label>
								<input
									type="number"
									min="1"
									id="plazoCreditoAnios"
									className="mt-1 w-full rounded-lg px-3 py-2 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('plazoCreditoAnios', { required: true, valueAsNumber: true })}
								/>
							</div>

							<div>
								<label htmlFor="valorizacionAnual" className="block text-xs font-medium text-ink">
									Valorización anual esperada de la vivienda
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.1"
										id="valorizacionAnual"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('valorizacionAnual', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
							</div>

							<div>
								<label htmlFor="rentabilidadAnual" className="block text-xs font-medium text-ink">
									Rentabilidad anual esperada si inviertes
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.1"
										id="rentabilidadAnual"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('rentabilidadAnual', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
							</div>

							<div>
								<label
									htmlFor="gastosMantenimientoPct"
									className="block text-xs font-medium text-ink"
								>
									Mantenimiento + administración + predial (anual)
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.1"
										id="gastosMantenimientoPct"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('gastosMantenimientoPct', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
								<p className="mt-1 text-xs text-ink/50">% del valor de la vivienda, cada año.</p>
							</div>

							<div>
								<label htmlFor="costosCompraPct" className="block text-xs font-medium text-ink">
									Costos de compra (notariales, registro, beneficencia)
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.1"
										id="costosCompraPct"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('costosCompraPct', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
								<p className="mt-1 text-xs text-ink/50">
									% del valor de la vivienda, se paga una sola vez al inicio.
								</p>
							</div>
						</div>
					</details>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Comparar
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-comprar-arrendar" ref={resultadosRef}>
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						{esNeutral ? (
							<p className="font-serif text-2xl font-semibold leading-tight text-surface sm:text-3xl lg:text-4xl">
								Ambos escenarios son financieramente muy similares en este plazo — la decisión
								depende más de tu situación personal.
							</p>
						) : resultado.diferenciaPatrimonio > 0 ? (
							<p className="font-serif text-2xl font-semibold leading-tight text-surface sm:text-3xl lg:text-4xl">
								Comprando tendrías {currency.format(resultado.diferenciaPatrimonio)} más de
								patrimonio en {aniosHorizonte} años
							</p>
						) : (
							<p className="font-serif text-2xl font-semibold leading-tight text-surface sm:text-3xl lg:text-4xl">
								Arrendando e invirtiendo la diferencia tendrías{' '}
								{currency.format(Math.abs(resultado.diferenciaPatrimonio))} más de patrimonio en{' '}
								{aniosHorizonte} años
							</p>
						)}

						{usoSupuestosPorDefecto && (
							<p className="mt-4 text-sm text-surface/70">
								Este resultado usa supuestos estándar de valorización y rentabilidad — ajústalos
								para tu caso en "Ajustar supuestos".
							</p>
						)}
					</div>
					<ExportButtons targetId="resultado-comprar-arrendar" title="Resultado de comprar versus arrendar" />

					<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="rounded-2xl bg-surface p-6 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Patrimonio comprando
							</p>
							<p className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
								{currency.format(resultado.patrimonioComprando)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-6 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Patrimonio arrendando e invirtiendo
							</p>
							<p className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
								{currency.format(resultado.patrimonioArrendando)}
							</p>
						</div>
					</div>

					<details className="mt-6 group rounded-2xl ring-1 ring-primary/10">
						<summary className="cursor-pointer list-none rounded-2xl bg-surface px-5 py-4 text-sm font-medium text-ink marker:content-none">
							<span className="inline-flex w-full items-center justify-between">
								Ver desglose del cálculo
								<span className="text-ink/40 transition-transform group-open:rotate-180">▾</span>
							</span>
						</summary>
						<div className="grid grid-cols-1 gap-6 border-t border-primary/10 bg-surface p-5 sm:grid-cols-2">
							<div>
								<p className="text-sm font-semibold text-ink">Comprar</p>
								<dl className="mt-3 space-y-2 text-sm text-ink/70">
									<div className="flex justify-between gap-2">
										<dt>Cuota mensual del crédito</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.cuotaMensual)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Valor futuro de la vivienda</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.valorViviendaFutura)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Saldo pendiente del crédito</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.saldoPendiente)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Costos de compra (una vez)</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.costoCompraInicial)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Mantenimiento acumulado ({aniosHorizonte} años)</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.gastosMantenimientoAcumulados)}
										</dd>
									</div>
								</dl>
							</div>

							<div>
								<p className="text-sm font-semibold text-ink">Arrendar e invertir</p>
								<dl className="mt-3 space-y-2 text-sm text-ink/70">
									<div className="flex justify-between gap-2">
										<dt>Aporte inicial invertido</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.aporteInicialInversion)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Diferencia mensual (cuota − arriendo)</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.diferenciaMensual)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Aportes mensuales acumulados</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.aportesMensualesAcumulados)}
										</dd>
									</div>
									<div className="flex justify-between gap-2">
										<dt>Rentabilidad acumulada</dt>
										<dd className="text-right text-ink">
											{currency.format(resultado.rentabilidadAcumulada)}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</details>
				</div>
			)}
		</div>
	);
}
