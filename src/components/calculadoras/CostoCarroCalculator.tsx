import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { calcularCredito, eaAMensual } from '../../lib/credito';
import { currency, miles } from '../../lib/format';
import { supuestosCostoCarro } from '../../data/costoCarro';

interface FormValues {
	valorCarro: string;
	formaPago: 'credito' | 'contado';
	cuotaInicial: string;
	plazoMeses: number;
	tasaValor: number;
	tasaTipo: 'EA' | 'MV';
	seguroMensual: string;
	combustibleMensual: string;
	mantenimientoMensual: string;
	tieneMasDeSeisAnios: boolean;
	soatAnual: number;
	tecnomecanicaAnual: number;
	depreciacionAnualPct: number;
}

interface ItemDesglose {
	label: string;
	valor: number;
}

interface Resultado {
	formaPago: 'credito' | 'contado';
	valorCarro: number;
	cuotaMensualCredito: number;
	costoMensualTotal: number;
	items: ItemDesglose[];
	usoSupuestosPorDefecto: boolean;
}

const camposSupuestos = ['soatAnual', 'tecnomecanicaAnual', 'depreciacionAnualPct'] as const;

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function CostoCarroCalculator() {
	const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
		defaultValues: {
			valorCarro: '',
			formaPago: 'credito',
			cuotaInicial: '',
			plazoMeses: 60,
			tasaValor: 18,
			tasaTipo: 'EA',
			seguroMensual: '',
			combustibleMensual: '',
			mantenimientoMensual: '',
			tieneMasDeSeisAnios: false,
			soatAnual: supuestosCostoCarro.soatAnual,
			tecnomecanicaAnual: supuestosCostoCarro.tecnomecanicaAnual,
			depreciacionAnualPct: supuestosCostoCarro.depreciacionAnualPct * 100,
		},
	});

	const formaPago = watch('formaPago');

	const [resultado, setResultado] = useState<Resultado | null>(null);
	const resultadosRef = useRef<HTMLDivElement>(null);

	const onSubmit = (data: FormValues) => {
		const valorCarro = parseMonto(data.valorCarro);
		const seguroMensual = parseMonto(data.seguroMensual) || 0;
		const combustibleMensual = parseMonto(data.combustibleMensual) || 0;
		const mantenimientoMensual = parseMonto(data.mantenimientoMensual) || 0;

		if (!valorCarro) return;

		let cuotaMensualCredito = 0;

		if (data.formaPago === 'credito') {
			const cuotaInicial = parseMonto(data.cuotaInicial) || 0;
			const montoFinanciado = valorCarro - cuotaInicial;
			const n = data.plazoMeses;
			const tasaValor = data.tasaValor / 100;

			if (montoFinanciado <= 0 || !n || !tasaValor) return;

			const iMensual = data.tasaTipo === 'EA' ? eaAMensual(tasaValor) : tasaValor;
			cuotaMensualCredito = calcularCredito(montoFinanciado, iMensual, n).cuotaMensual;
		}

		const soatMensualizado = data.soatAnual / 12;
		const tecnomecanicaMensualizada = data.tieneMasDeSeisAnios ? data.tecnomecanicaAnual / 12 : 0;
		const depreciacionMensualizada = (valorCarro * (data.depreciacionAnualPct / 100)) / 12;

		const costoMensualTotal =
			cuotaMensualCredito +
			seguroMensual +
			combustibleMensual +
			mantenimientoMensual +
			soatMensualizado +
			tecnomecanicaMensualizada +
			depreciacionMensualizada;

		const items: ItemDesglose[] = [
			{ label: 'Cuota del crédito', valor: cuotaMensualCredito },
			{ label: 'Seguro todo riesgo', valor: seguroMensual },
			{ label: 'Combustible', valor: combustibleMensual },
			{ label: 'Mantenimiento', valor: mantenimientoMensual },
			{ label: 'SOAT (mensualizado)', valor: soatMensualizado },
			{ label: 'Tecnomecánica (mensualizada)', valor: tecnomecanicaMensualizada },
			{ label: 'Depreciación (mensualizada)', valor: depreciacionMensualizada },
		].filter((item) => item.valor > 0);

		items.sort((a, b) => b.valor - a.valor);

		const huboAjustes = camposSupuestos.some((campo) => formState.dirtyFields[campo]);

		setResultado({
			formaPago: data.formaPago,
			valorCarro,
			cuotaMensualCredito,
			costoMensualTotal,
			items,
			usoSupuestosPorDefecto: !huboAjustes,
		});

		requestAnimationFrame(() => {
			resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	const maxItemValor = useMemo(
		() => (resultado ? Math.max(...resultado.items.map((item) => item.valor)) : 0),
		[resultado]
	);

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<div className="space-y-5">
					<div>
						<label htmlFor="valorCarro" className="block text-sm font-medium text-ink">
							Valor del carro
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="valorCarro"
								placeholder="80.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('valorCarro', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('valorCarro', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<span className="block text-sm font-medium text-ink">Forma de pago</span>
						<div className="mt-1 grid grid-cols-2 gap-2">
							<label
								className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-medium ring-1 transition-colors ${
									formaPago === 'credito'
										? 'bg-primary/10 text-ink ring-primary'
										: 'text-ink/70 ring-primary/20 hover:bg-primary/5'
								}`}
							>
								<input type="radio" value="credito" className="hidden" {...register('formaPago')} />
								Crédito
							</label>
							<label
								className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-medium ring-1 transition-colors ${
									formaPago === 'contado'
										? 'bg-primary/10 text-ink ring-primary'
										: 'text-ink/70 ring-primary/20 hover:bg-primary/5'
								}`}
							>
								<input type="radio" value="contado" className="hidden" {...register('formaPago')} />
								Contado
							</label>
						</div>
					</div>

					{formaPago === 'credito' && (
						<>
							<div>
								<label htmlFor="cuotaInicial" className="block text-sm font-medium text-ink">
									Cuota inicial
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<span className="pl-3 text-ink/50">$</span>
									<input
										type="text"
										inputMode="numeric"
										id="cuotaInicial"
										placeholder="20.000.000"
										className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
										{...register('cuotaInicial', {
											onChange: (event) => {
												const digits = event.target.value.replace(/\D/g, '');
												setValue('cuotaInicial', digits ? miles.format(Number(digits)) : '');
											},
										})}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="plazoMeses" className="block text-sm font-medium text-ink">
									Plazo (meses)
								</label>
								<input
									type="number"
									min="1"
									id="plazoMeses"
									placeholder="60"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('plazoMeses', { required: true, valueAsNumber: true })}
								/>
							</div>

							<div>
								<span className="block text-sm font-medium text-ink">Tasa de interés</span>
								<div className="mt-1 flex gap-2">
									<div className="flex w-full items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
										<input
											type="number"
											step="0.01"
											min="0"
											placeholder="1.5"
											className="w-full rounded-lg bg-transparent px-3 py-2.5 text-ink outline-none"
											{...register('tasaValor', { required: true, valueAsNumber: true })}
										/>
										<span className="pr-3 text-ink/50">%</span>
									</div>
									<select
										className="rounded-lg bg-base px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('tasaTipo')}
									>
										<option value="EA">E.A.</option>
										<option value="MV">M.V.</option>
									</select>
								</div>
								<p className="mt-1 text-xs text-ink/50">
									E.A. = efectiva anual · M.V. = mensual vencida.
								</p>
							</div>
						</>
					)}

					<div>
						<label htmlFor="seguroMensual" className="block text-sm font-medium text-ink">
							Seguro todo riesgo (mensual)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="seguroMensual"
								placeholder="150.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('seguroMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('seguroMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="combustibleMensual" className="block text-sm font-medium text-ink">
							Combustible (mensual)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="combustibleMensual"
								placeholder="300.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('combustibleMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('combustibleMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="mantenimientoMensual" className="block text-sm font-medium text-ink">
							Mantenimiento (mensual)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="mantenimientoMensual"
								placeholder="100.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('mantenimientoMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('mantenimientoMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Promedia cambios de aceite, llantas, revisiones periódicas repartidos en el año.
						</p>
					</div>

					<label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
						<input type="checkbox" className="accent-primary" {...register('tieneMasDeSeisAnios')} />
						El carro tiene más de 6 años (aplica tecnomecánica)
					</label>

					<details className="group rounded-lg ring-1 ring-primary/20">
						<summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-ink marker:content-none">
							<span className="inline-flex w-full items-center justify-between">
								Ajustar supuestos
								<span className="text-ink/40 transition-transform group-open:rotate-180">▾</span>
							</span>
						</summary>
						<div className="space-y-4 border-t border-primary/10 px-3 py-4">
							<div>
								<label htmlFor="soatAnual" className="block text-xs font-medium text-ink">
									SOAT anual
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<span className="pl-3 text-ink/50">$</span>
									<input
										type="number"
										min="0"
										id="soatAnual"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('soatAnual', { required: true, valueAsNumber: true })}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="tecnomecanicaAnual" className="block text-xs font-medium text-ink">
									Revisión tecnomecánica anual
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<span className="pl-3 text-ink/50">$</span>
									<input
										type="number"
										min="0"
										id="tecnomecanicaAnual"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('tecnomecanicaAnual', { required: true, valueAsNumber: true })}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="depreciacionAnualPct" className="block text-xs font-medium text-ink">
									Depreciación anual esperada
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<input
										type="number"
										step="0.1"
										min="0"
										id="depreciacionAnualPct"
										className="w-full rounded-lg bg-transparent px-3 py-2 text-ink outline-none"
										{...register('depreciacionAnualPct', { required: true, valueAsNumber: true })}
									/>
									<span className="pr-3 text-ink/50">%</span>
								</div>
								<p className="mt-1 text-xs text-ink/50">% del valor del carro, promedio anual.</p>
							</div>
						</div>
					</details>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{resultado && (
				<div ref={resultadosRef}>
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Tu carro te cuesta realmente {currency.format(resultado.costoMensualTotal)} al mes
						</p>
						{resultado.formaPago === 'credito' ? (
							<p className="mt-4 text-base text-surface/80">
								Eso es{' '}
								{currency.format(resultado.costoMensualTotal - resultado.cuotaMensualCredito)} más
								de lo que ves en tu cuota mensual del crédito.
							</p>
						) : (
							<p className="mt-4 text-base text-surface/80">
								Sin contar el pago inicial de {currency.format(resultado.valorCarro)}, este es tu
								costo mensual de mantenerlo.
							</p>
						)}
					</div>

					<div className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-primary/10">
						<p className="text-sm font-medium text-ink">Desglose del costo mensual</p>
						<div className="mt-4 space-y-3">
							{resultado.items.map((item) => (
								<div key={item.label}>
									<div className="flex items-baseline justify-between text-sm">
										<span className="text-ink/70">{item.label}</span>
										<span className="font-medium text-ink">{currency.format(item.valor)}</span>
									</div>
									<div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-primary/10">
										<div
											className="h-full rounded-full bg-primary"
											style={{
												width: `${maxItemValor > 0 ? (item.valor / maxItemValor) * 100 : 0}%`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{resultado.usoSupuestosPorDefecto && (
						<p className="mt-4 text-xs text-ink/50">
							Este resultado usa valores de referencia para SOAT, tecnomecánica y depreciación —
							ajústalos en "Ajustar supuestos" para tu caso.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
