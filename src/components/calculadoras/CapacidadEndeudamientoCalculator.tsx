import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { currency, miles } from '../../lib/format';
import { nivelesEndeudamiento, type NivelEndeudamiento } from '../../data/nivelesEndeudamiento';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	ingresos: string;
	deudas: string;
}

interface ResultadoNivel {
	nivel: NivelEndeudamiento;
	cupoTotal: number;
	cupoDisponible: number;
}

interface Resultado {
	ingresos: number;
	deudas: number;
	porNivel: ResultadoNivel[];
}

const percent = new Intl.NumberFormat('es-CO', {
	style: 'percent',
	maximumFractionDigits: 0,
});

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function CapacidadEndeudamientoCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: {
			ingresos: '',
			deudas: '',
		},
	});

	const [resultado, setResultado] = useState<Resultado | null>(null);
	const resultadosRef = useRef<HTMLDivElement>(null);

	const onSubmit = (data: FormValues) => {
		const ingresos = parseMonto(data.ingresos);
		const deudas = parseMonto(data.deudas) || 0;

		if (!ingresos) return;

		const porNivel = nivelesEndeudamiento.map((nivel) => {
			const cupoTotal = Math.round(ingresos * (nivel.porcentaje / 100));
			return { nivel, cupoTotal, cupoDisponible: cupoTotal - deudas };
		});

		setResultado({ ingresos, deudas, porNivel });

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
				<CalculatorHint>usa tus ingresos netos y la suma de las cuotas que ya pagas. Te mostraremos tres niveles de referencia.</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="ingresos" className="block text-sm font-medium text-ink">
							Ingresos mensuales netos
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="ingresos"
								placeholder="3.500.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('ingresos', {
									required: true,
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('ingresos', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="deudas" className="block text-sm font-medium text-ink">
							Deudas actuales (suma de cuotas mensuales)
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="deudas"
								placeholder="0"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('deudas', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('deudas', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Incluye tarjetas de crédito, otros créditos y cualquier cuota fija que ya pagues.
						</p>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular capacidad
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-capacidad" ref={resultadosRef}>
					<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
									Ingresos mensuales netos
								</p>
								<p className="mt-1 font-serif text-xl font-semibold text-ink">
									{currency.format(resultado.ingresos)}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
									Deudas actuales
								</p>
								<p className="mt-1 font-serif text-xl font-semibold text-alert">
									{currency.format(resultado.deudas)}
								</p>
							</div>
						</div>
					</div>
					<ExportButtons targetId="resultado-capacidad" title="Resultado de capacidad de endeudamiento" />

					<div className="mt-6 grid grid-cols-1 gap-6">
						{resultado.porNivel.map(({ nivel, cupoDisponible }) => {
							const ocupadoRatio =
								nivel.porcentaje > 0 ? resultado.deudas / (resultado.ingresos * (nivel.porcentaje / 100)) : 1;

							return (
								<div
									key={nivel.id}
									className="flex flex-col overflow-hidden rounded-2xl ring-1 ring-primary/10"
								>
									{cupoDisponible <= 0 ? (
										<div className="flex h-full flex-col bg-alert/10 p-6">
											<p className="text-sm font-medium text-ink">
												{nivel.label} · {percent.format(nivel.porcentaje / 100)}
											</p>
											<p className="mt-3 font-serif text-2xl font-semibold text-alert sm:text-3xl">
												No tienes capacidad de endeudamiento disponible en este nivel.
											</p>
											<p className="mt-2 text-sm text-ink/70">
												Tus deudas actuales ya superan este límite. Con un nivel más alto o menos
												deudas podrías tener margen para una nueva cuota.
											</p>
										</div>
									) : (
										<div className="flex h-full flex-col bg-primary p-6">
											<p className="text-sm font-medium text-surface/70">
												{nivel.label} · {percent.format(nivel.porcentaje / 100)}
											</p>
											<p className="mt-3 font-serif text-2xl font-semibold text-surface sm:text-3xl">
												Actualmente ocupas el {percent.format(ocupadoRatio)} de tu capacidad de
												endeudamiento.
											</p>
											<p className="mt-2 text-sm text-surface/70">
												Te queda cupo para una cuota nueva de hasta {currency.format(cupoDisponible)}{' '}
												al mes.
											</p>
										</div>
									)}
									<p className="bg-surface p-4 text-xs text-ink/60">{nivel.descripcion}</p>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
