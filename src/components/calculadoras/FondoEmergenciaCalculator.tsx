import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { nivelesCobertura } from '../../data/nivelesCobertura';
import { currency, miles } from '../../lib/format';

interface FormValues {
	gastoMensual: string;
	nivelId: (typeof nivelesCobertura)[number]['id'];
	plazoMeses: number;
}

const plazosRapidos = [6, 12, 24];

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function FondoEmergenciaCalculator() {
	const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
		defaultValues: {
			gastoMensual: '',
			nivelId: 'recomendado',
			plazoMeses: 12,
		},
	});

	const nivelIdSeleccionado = watch('nivelId');

	const [montoObjetivo, setMontoObjetivo] = useState<number | null>(null);
	const [plazoMeses, setPlazoMeses] = useState(12);

	const ahorroMensual = useMemo(() => {
		if (montoObjetivo === null || !plazoMeses) return null;
		return montoObjetivo / plazoMeses;
	}, [montoObjetivo, plazoMeses]);

	const onSubmit = (data: FormValues) => {
		const gastoMensual = parseMonto(data.gastoMensual) || 0;
		const nivel = nivelesCobertura.find((item) => item.id === data.nivelId);
		if (!gastoMensual || !nivel || !data.plazoMeses) return;

		setMontoObjetivo(gastoMensual * nivel.meses);
		setPlazoMeses(data.plazoMeses);
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<div className="space-y-5">
					<div>
						<label htmlFor="gastoMensual" className="block text-sm font-medium text-ink">
							Gasto mensual fijo
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="gastoMensual"
								placeholder="2.500.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('gastoMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('gastoMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Incluye arriendo/cuota, servicios, alimentación, transporte y deudas — lo que
							necesitarías cubrir aunque dejaras de recibir ingresos.
						</p>
					</div>

					<div>
						<span className="block text-sm font-medium text-ink">Meses de cobertura</span>
						<div className="mt-2 space-y-2">
							{nivelesCobertura.map((nivel) => (
								<label
									key={nivel.id}
									className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors ${
										nivelIdSeleccionado === nivel.id
											? 'bg-primary/10 ring-primary'
											: 'ring-primary/15 hover:bg-primary/5'
									}`}
								>
									<input
										type="radio"
										value={nivel.id}
										className="mt-1 accent-primary"
										{...register('nivelId')}
									/>
									<span>
										<span className="block text-sm font-semibold text-ink">
											{nivel.label} · {nivel.mesesLabel}
										</span>
										<span className="mt-0.5 block text-xs text-ink/60">{nivel.descripcion}</span>
									</span>
								</label>
							))}
						</div>
					</div>

					<div>
						<label htmlFor="plazoMeses" className="block text-sm font-medium text-ink">
							¿En cuántos meses quieres lograrlo?
						</label>
						<input
							type="number"
							min="1"
							id="plazoMeses"
							placeholder="12"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('plazoMeses', { required: true, valueAsNumber: true })}
						/>
						<p className="mt-1 text-xs text-ink/50">
							Puedes ajustarlo según lo que puedas ahorrar cada mes.
						</p>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{montoObjetivo !== null && ahorroMensual !== null && (
				<div>
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Necesitas ahorrar {currency.format(montoObjetivo)} para tu fondo de emergencia
						</p>
						<p className="mt-4 text-base text-surface/80">
							Ahorrando {currency.format(ahorroMensual)} al mes, lo lograrías en {plazoMeses}{' '}
							meses.
						</p>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Monto objetivo
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-ink">
								{currency.format(montoObjetivo)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Ahorro mensual necesario
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-positive">
								{currency.format(ahorroMensual)}
							</p>
						</div>
					</div>

					<div className="mt-8">
						<p className="text-sm font-medium text-ink">¿Y si ajustas el plazo?</p>
						<div className="mt-3 flex flex-wrap gap-2">
							{plazosRapidos.map((meses) => (
								<button
									key={meses}
									type="button"
									onClick={() => setPlazoMeses(meses)}
									className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
										plazoMeses === meses
											? 'bg-primary text-surface'
											: 'bg-surface text-ink ring-1 ring-primary/20 hover:bg-primary/5'
									}`}
								>
									en {meses} meses
								</button>
							))}
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						¿Quieres llegar a tu meta más rápido? Simula cómo el interés compuesto puede ayudarte
						a que tu ahorro rinda mientras lo construyes:{' '}
						<a
							href="/calculadoras/interes-compuesto"
							className="font-medium text-primary hover:underline"
						>
							ir a la calculadora de interés compuesto →
						</a>
					</p>
				</div>
			)}
		</div>
	);
}
