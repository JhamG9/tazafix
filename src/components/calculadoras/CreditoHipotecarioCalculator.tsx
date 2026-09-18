import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { eaAMensual, mensualAEA } from '../../lib/credito';
import { currency, miles } from '../../lib/format';
import { modalidadesCredito } from '../../data/tasasUsura';
import {
	cuotaInicialMinimaRecomendada,
	seguroInmueblePorcentajeMensual,
	seguroVidaPorcentajeMensual,
} from '../../data/segurosHipotecario';
import { useCreditoConAbonos, type BaseCredito } from './useCreditoConAbonos';
import TablaAmortizacionAbonos from './TablaAmortizacionAbonos';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	valorVivienda: string;
	cuotaInicialValor: number;
	cuotaInicialTipo: 'monto' | 'porcentaje';
	plazoAnios: number;
	tasaValor: number;
	tasaTipo: 'EA' | 'MV';
	seguroVidaMensual: number;
	seguroInmuebleMensual: number;
}

interface Resumen {
	valorVivienda: number;
	cuotaInicialMonto: number;
	cuotaInicialPorcentaje: number;
	montoFinanciado: number;
	seguroVidaMensual: number;
	seguroInmuebleMensual: number;
}

const percent = new Intl.NumberFormat('es-CO', {
	style: 'percent',
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

const modalidadVivienda = modalidadesCredito.find((item) => item.id === 'vivienda');

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function CreditoHipotecarioCalculator() {
	const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
		defaultValues: {
			valorVivienda: '300.000.000',
			cuotaInicialValor: 20,
			cuotaInicialTipo: 'porcentaje',
			plazoAnios: 20,
			tasaValor: 12,
			tasaTipo: 'EA',
			seguroVidaMensual: 0,
			seguroInmuebleMensual: 0,
		},
	});

	const valorVivienda = watch('valorVivienda');
	const cuotaInicialValor = watch('cuotaInicialValor');
	const cuotaInicialTipo = watch('cuotaInicialTipo');

	// Sugiere los seguros según los porcentajes de referencia mientras el usuario no los edite manualmente.
	useEffect(() => {
		const valor = parseMonto(valorVivienda) || 0;
		const cuotaInicialMonto =
			cuotaInicialTipo === 'porcentaje'
				? (valor * (Number(cuotaInicialValor) || 0)) / 100
				: Number(cuotaInicialValor) || 0;
		const montoFinanciado = Math.max(valor - cuotaInicialMonto, 0);

		if (!formState.dirtyFields.seguroVidaMensual) {
			setValue('seguroVidaMensual', Math.round(montoFinanciado * seguroVidaPorcentajeMensual));
		}
		if (!formState.dirtyFields.seguroInmuebleMensual) {
			setValue('seguroInmuebleMensual', Math.round(valor * seguroInmueblePorcentajeMensual));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [valorVivienda, cuotaInicialValor, cuotaInicialTipo]);

	const [resumen, setResumen] = useState<Resumen | null>(null);
	const [baseCredito, setBaseCredito] = useState<BaseCredito | null>(null);
	const [alertaCuotaInicial, setAlertaCuotaInicial] = useState<string | null>(null);
	const [alertaUsura, setAlertaUsura] = useState<string | null>(null);
	const resultadosRef = useRef<HTMLDivElement>(null);

	const {
		abonos,
		modoAbono,
		setModoAbono,
		filaEditando,
		setFilaEditando,
		abonoInputValor,
		setAbonoInputValor,
		resultadoSinAbonos,
		resultadoConAbonos,
		ahorroIntereses,
		handleAgregarAbono,
		handleAplicarAbonoRango,
		handleQuitarAbono,
	} = useCreditoConAbonos(baseCredito);

	const onSubmit = (data: FormValues) => {
		const valor = parseMonto(data.valorVivienda);
		const cuotaInicialMonto =
			data.cuotaInicialTipo === 'porcentaje'
				? Math.round((valor * data.cuotaInicialValor) / 100)
				: data.cuotaInicialValor;
		const montoFinanciado = valor - cuotaInicialMonto;
		const n = data.plazoAnios * 12;
		const tasaValor = data.tasaValor / 100;

		if (!valor || montoFinanciado <= 0 || !n || !tasaValor) return;

		const iMensual = data.tasaTipo === 'EA' ? eaAMensual(tasaValor) : tasaValor;
		const eaEquivalente = data.tasaTipo === 'EA' ? tasaValor : mensualAEA(tasaValor);

		setBaseCredito({ monto: montoFinanciado, iMensual, n });
		setResumen({
			valorVivienda: valor,
			cuotaInicialMonto,
			cuotaInicialPorcentaje: cuotaInicialMonto / valor,
			montoFinanciado,
			seguroVidaMensual: data.seguroVidaMensual,
			seguroInmuebleMensual: data.seguroInmuebleMensual,
		});

		setAlertaCuotaInicial(
			cuotaInicialMonto / valor < cuotaInicialMinimaRecomendada
				? `Tu cuota inicial es del ${percent.format(cuotaInicialMonto / valor)}, por debajo del ${percent.format(cuotaInicialMinimaRecomendada)} que suelen pedir los bancos. La financiación máxima típica es del 70-80% del valor de la vivienda.`
				: null
		);

		setAlertaUsura(
			modalidadVivienda && eaEquivalente > modalidadVivienda.tasaUsuraEA
				? `⚠️ La tasa ingresada equivale a ${percent.format(eaEquivalente)} E.A., por encima de la tasa de usura vigente para vivienda (${percent.format(modalidadVivienda.tasaUsuraEA)} E.A.). Verifica las condiciones con tu entidad.`
				: null
		);

		requestAnimationFrame(() => {
			resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	useEffect(() => {
		onSubmit({
			valorVivienda: '300.000.000', cuotaInicialValor: 20, cuotaInicialTipo: 'porcentaje', plazoAnios: 20,
			tasaValor: 12, tasaTipo: 'EA', seguroVidaMensual: 0, seguroInmuebleMensual: 0,
		});
	}, []);

	const cuotaTotalConSeguros =
		resultadoConAbonos && resumen
			? resultadoConAbonos.cuotaMensualInicial + resumen.seguroVidaMensual + resumen.seguroInmuebleMensual
			: 0;


	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>empieza por el valor de la vivienda y tu cuota inicial. La cuota total incluye capital, intereses y seguros.</CalculatorHint>
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
						<span className="block text-sm font-medium text-ink">Cuota inicial</span>
						<div className="mt-1 flex gap-2">
							<input
								type="number"
								min="0"
								step="0.1"
								className="w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
								{...register('cuotaInicialValor', { required: true, valueAsNumber: true })}
							/>
							<select
								className="rounded-lg bg-base px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
								{...register('cuotaInicialTipo')}
							>
								<option value="porcentaje">% del valor</option>
								<option value="monto">$ COP</option>
							</select>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							El monto a financiar se calcula automáticamente: valor de la vivienda − cuota
							inicial.
						</p>
					</div>

					<div>
						<label htmlFor="plazoAnios" className="block text-sm font-medium text-ink">
							Plazo (años)
						</label>
						<input
							type="number"
							min="1"
							id="plazoAnios"
							placeholder="20"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('plazoAnios', { required: true, valueAsNumber: true })}
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
									placeholder="1.2"
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
							E.A. = efectiva anual · M.V. = mensual vencida (la tasa periódica que ya usas en el
							cálculo).
						</p>
					</div>

					<div>
						<label htmlFor="seguroVidaMensual" className="block text-sm font-medium text-ink">
							Seguro de vida deudor (mensual)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="number"
								min="0"
								id="seguroVidaMensual"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('seguroVidaMensual', { valueAsNumber: true })}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Sugerido: {percent.format(seguroVidaPorcentajeMensual)} mensual del saldo insoluto.
						</p>
					</div>

					<div>
						<label htmlFor="seguroInmuebleMensual" className="block text-sm font-medium text-ink">
							Seguro todo riesgo del inmueble (mensual)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="number"
								min="0"
								id="seguroInmuebleMensual"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('seguroInmuebleMensual', { valueAsNumber: true })}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Sugerido: {percent.format(seguroInmueblePorcentajeMensual)} mensual del valor de la
							vivienda.
						</p>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular cuota
					</button>
				</div>
			</form>

			{resultadoConAbonos && resumen && (
				<div id="resultado-credito-hipotecario" ref={resultadosRef}>
					{alertaCuotaInicial && (
						<div className="mb-4 rounded-xl bg-primary/5 p-4 text-sm text-ink ring-1 ring-primary/20">
							ℹ️ {alertaCuotaInicial}
						</div>
					)}
					{alertaUsura && (
						<div className="mb-6 rounded-xl bg-alert/10 p-4 text-sm text-alert ring-1 ring-alert/30">
							{alertaUsura}
						</div>
					)}

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="grid grid-cols-1 gap-3 sm:col-span-3 sm:grid-cols-2">
							<div className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10">
								<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
									Monto a financiar
								</p>
								<p className="mt-1 font-serif text-xl font-semibold text-ink">
									{currency.format(resumen.montoFinanciado)}
								</p>
								<p className="mt-1 text-xs text-ink/50">
									Valor vivienda {currency.format(resumen.valorVivienda)} − cuota inicial{' '}
									{currency.format(resumen.cuotaInicialMonto)} (
									{percent.format(resumen.cuotaInicialPorcentaje)})
								</p>
							</div>

							<div className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10">
								<p className="text-sm font-medium text-ink/60">Cuota de capital + interés</p>
								<p className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
									{currency.format(resultadoConAbonos.cuotaMensualInicial)}
								</p>
							</div>
						</div>

						<div className="rounded-2xl bg-primary p-4 sm:col-span-3 sm:p-5">
							<p className="text-sm font-medium text-surface/70">Cuota total con seguros</p>
							<p className="mt-1 font-serif text-3xl font-semibold text-surface sm:text-4xl">
								{currency.format(cuotaTotalConSeguros)}
							</p>
							<dl className="mt-2 space-y-0.5 text-xs text-surface/80 sm:text-sm">
								<div className="flex justify-between">
									<dt>Capital + interés</dt>
									<dd>{currency.format(resultadoConAbonos.cuotaMensualInicial)}</dd>
								</div>
								<div className="flex justify-between">
									<dt>Seguro de vida deudor</dt>
									<dd>{currency.format(resumen.seguroVidaMensual)}</dd>
								</div>
								<div className="flex justify-between">
									<dt>Seguro del inmueble</dt>
									<dd>{currency.format(resumen.seguroInmuebleMensual)}</dd>
								</div>
							</dl>
						</div>

						<div className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Interés total
							</p>
							<p className="mt-1 font-serif text-lg font-semibold text-alert">
								{currency.format(resultadoConAbonos.interesTotal)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">Capital</p>
							<p className="mt-1 font-serif text-lg font-semibold text-ink">
								{currency.format(resumen.montoFinanciado)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Total pagado (crédito)
							</p>
							<p className="mt-1 font-serif text-lg font-semibold text-ink">
								{currency.format(resultadoConAbonos.totalPagado)}
							</p>
						</div>
					</div>
					<ExportButtons targetId="resultado-credito-hipotecario" title="Resultado de crédito hipotecario" />

					<TablaAmortizacionAbonos
						resultadoConAbonos={resultadoConAbonos}
						resultadoSinAbonos={resultadoSinAbonos}
						abonos={abonos}
						modoAbono={modoAbono}
						onModoAbonoChange={setModoAbono}
						filaEditando={filaEditando}
						onFilaEditandoChange={setFilaEditando}
						abonoInputValor={abonoInputValor}
						onAbonoInputValorChange={setAbonoInputValor}
						onAgregarAbono={handleAgregarAbono}
						onAplicarAbonoRango={handleAplicarAbonoRango}
						onQuitarAbono={handleQuitarAbono}
						ahorroIntereses={ahorroIntereses}
						notaPie="Los seguros no afectan el saldo del crédito y no están incluidos en esta tabla."
					/>
				</div>
			)}
		</div>
	);
}

