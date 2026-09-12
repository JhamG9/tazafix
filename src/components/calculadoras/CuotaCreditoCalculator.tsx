import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { eaAMensual, mensualAEA } from '../../lib/credito';
import { currency } from '../../lib/format';
import { modalidadesCredito } from '../../data/tasasUsura';
import { useCreditoConAbonos, type BaseCredito } from './useCreditoConAbonos';
import TablaAmortizacionAbonos from './TablaAmortizacionAbonos';

interface FormValues {
	monto: string;
	plazoValor: number;
	plazoUnidad: 'meses' | 'anios';
	tasaValor: number;
	tasaTipo: 'EA' | 'MV';
	modalidad: string;
}

const percent = new Intl.NumberFormat('es-CO', {
	style: 'percent',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});
const miles = new Intl.NumberFormat('es-CO');

export default function CuotaCreditoCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: {
			monto: '',
			plazoValor: 60,
			plazoUnidad: 'meses',
			tasaValor: 12,
			tasaTipo: 'EA',
			modalidad: modalidadesCredito[0].id,
		},
	});

	const [baseCredito, setBaseCredito] = useState<BaseCredito | null>(null);
	const [alerta, setAlerta] = useState<string | null>(null);
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
		handleQuitarAbono,
	} = useCreditoConAbonos(baseCredito);

	const onSubmit = (data: FormValues) => {
		const monto = Number(data.monto.replace(/\D/g, ''));
		const n = data.plazoUnidad === 'anios' ? data.plazoValor * 12 : data.plazoValor;
		const tasaValor = Number(data.tasaValor) / 100;

		if (!monto || !n || !tasaValor) return;

		const iMensual = data.tasaTipo === 'EA' ? eaAMensual(tasaValor) : tasaValor;
		const eaEquivalente = data.tasaTipo === 'EA' ? tasaValor : mensualAEA(tasaValor);

		setBaseCredito({ monto, iMensual, n });

		const modalidad = modalidadesCredito.find((item) => item.id === data.modalidad);
		if (modalidad && eaEquivalente > modalidad.tasaUsuraEA) {
			setAlerta(
				`⚠️ La tasa ingresada equivale a ${percent.format(eaEquivalente)} E.A., por encima de la tasa de usura vigente para ${modalidad.label.toLowerCase()} (${percent.format(modalidad.tasaUsuraEA)} E.A.). Verifica las condiciones con tu entidad.`
			);
		} else {
			setAlerta(null);
		}

		requestAnimationFrame(() => {
			resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<div className="space-y-5">
					<div>
						<label htmlFor="monto" className="block text-sm font-medium text-ink">
							Monto del crédito
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="monto"
								placeholder="50.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('monto', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('monto', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<span className="block text-sm font-medium text-ink">Plazo</span>
						<div className="mt-1 flex gap-2">
							<input
								type="number"
								min="1"
								placeholder="60"
								className="w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
								{...register('plazoValor', { required: true, valueAsNumber: true })}
							/>
							<select
								className="rounded-lg bg-base px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
								{...register('plazoUnidad')}
							>
								<option value="meses">Meses</option>
								<option value="anios">Años</option>
							</select>
						</div>
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
							E.A. = efectiva anual · M.V. = mensual vencida (la tasa periódica que ya usas en el
							cálculo).
						</p>
					</div>

					<div>
						<label htmlFor="modalidad" className="block text-sm font-medium text-ink">
							Modalidad de crédito
						</label>
						<select
							id="modalidad"
							className="mt-1 w-full rounded-lg bg-base px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('modalidad')}
						>
							{modalidadesCredito.map((modalidad) => (
								<option key={modalidad.id} value={modalidad.id}>
									{modalidad.label}
								</option>
							))}
						</select>
						<p className="mt-1 text-xs text-ink/50">
							Se usa para validar tu tasa contra la tasa de usura vigente.
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

			{resultadoConAbonos && baseCredito && (
				<div ref={resultadosRef}>
					{alerta && (
						<div className="mb-6 rounded-xl bg-alert/10 p-4 text-sm text-alert ring-1 ring-alert/30">
							{alerta}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="rounded-2xl bg-primary p-6 sm:col-span-3">
							<p className="text-sm font-medium text-surface/70">Cuota mensual</p>
							<p className="mt-1 font-serif text-4xl font-semibold text-surface sm:text-5xl">
								{currency.format(resultadoConAbonos.cuotaMensualInicial)}
							</p>
						</div>

						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">Capital</p>
							<p className="mt-1 font-serif text-xl font-semibold text-ink">
								{currency.format(baseCredito.monto)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Interés total
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-alert">
								{currency.format(resultadoConAbonos.interesTotal)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Total pagado
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-ink">
								{currency.format(resultadoConAbonos.totalPagado)}
							</p>
						</div>
					</div>

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
						onQuitarAbono={handleQuitarAbono}
						ahorroIntereses={ahorroIntereses}
					/>
				</div>
			)}
		</div>
	);
}
