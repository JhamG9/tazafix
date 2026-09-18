import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { currency, currencyAbreviado, miles } from '../../lib/format';
import { calcularInteresCompuesto, type ResultadoInteresCompuesto } from '../../lib/interesCompuesto';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface FormValues {
	montoInicial: string;
	aporteMensual: string;
	tasaAnual: number;
	anios: number;
}

const percent = new Intl.NumberFormat('es-CO', {
	style: 'percent',
	maximumFractionDigits: 0,
});

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function InteresCompuestoCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: {
			montoInicial: '',
			aporteMensual: '',
			tasaAnual: 8,
			anios: 10,
		},
	});

	const [resultado, setResultado] = useState<ResultadoInteresCompuesto | null>(null);
	const [anios, setAnios] = useState(10);
	const resultadosRef = useRef<HTMLDivElement>(null);

	const onSubmit = (data: FormValues) => {
		const montoInicial = parseMonto(data.montoInicial) || 0;
		const aporteMensual = parseMonto(data.aporteMensual) || 0;
		const tasaAnual = Number(data.tasaAnual) / 100;

		if (!data.anios || !tasaAnual || (!montoInicial && !aporteMensual)) return;

		const calculado = calcularInteresCompuesto(montoInicial, aporteMensual, tasaAnual, data.anios);
		setResultado(calculado);
		setAnios(data.anios);

		requestAnimationFrame(() => {
			resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	// Si hay pocos años se muestra un punto por mes; si hay muchos, un punto por año para no
	// saturar el eje X del gráfico.
	const puntosGrafico = useMemo(() => {
		if (!resultado) return [];
		const usarAnios = anios > 5;
		if (!usarAnios) return resultado.tabla;
		return resultado.tabla.filter((fila) => fila.mes % 12 === 0);
	}, [resultado, anios]);

	const chartData = useMemo(() => {
		const usarAnios = anios > 5;
		return {
			labels: puntosGrafico.map((fila) =>
				usarAnios ? `Año ${fila.mes / 12}` : `Mes ${fila.mes}`
			),
			datasets: [
				{
					label: 'Total aportado',
					data: puntosGrafico.map((fila) => fila.totalAportadoAcumulado),
					borderColor: '#17213d',
					backgroundColor: 'rgba(23, 33, 61, 0.15)',
					fill: true,
					stack: 'total',
					tension: 0.3,
					pointRadius: 0,
				},
				{
					label: 'Interés generado',
					data: puntosGrafico.map((fila) => fila.interesGeneradoAcumulado),
					borderColor: '#5aa36a',
					backgroundColor: 'rgba(90, 163, 106, 0.35)',
					fill: true,
					stack: 'total',
					tension: 0.3,
					pointRadius: 0,
				},
			],
		};
	}, [puntosGrafico, anios]);

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: { mode: 'index' as const, intersect: false },
		plugins: {
			legend: {
				position: 'bottom' as const,
				labels: { color: '#17213d', usePointStyle: true, boxHeight: 8 },
			},
			tooltip: {
				callbacks: {
					label: (context: { dataset: { label?: string }; parsed: { y: number } }) =>
						`${context.dataset.label}: ${currency.format(context.parsed.y)}`,
				},
			},
		},
		scales: {
			x: { stacked: true, grid: { display: false }, ticks: { color: '#17213d99' } },
			y: {
				stacked: true,
				grid: { color: '#2947b815' },
				ticks: {
					color: '#17213d99',
					callback: (value: string | number) => currencyAbreviado(Number(value)),
				},
			},
		},
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>puedes empezar en cero: combina un monto inicial, aportes mensuales y una rentabilidad anual estimada.</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="montoInicial" className="block text-sm font-medium text-ink">
							Monto inicial
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="montoInicial"
								placeholder="0"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('montoInicial', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('montoInicial', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="aporteMensual" className="block text-sm font-medium text-ink">
							Aporte mensual
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="aporteMensual"
								placeholder="200.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('aporteMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('aporteMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="tasaAnual" className="block text-sm font-medium text-ink">
							Rentabilidad anual esperada
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<input
								type="number"
								step="0.1"
								min="0"
								id="tasaAnual"
								className="w-full rounded-lg bg-transparent px-3 py-2.5 text-ink outline-none"
								{...register('tasaAnual', { required: true, valueAsNumber: true })}
							/>
							<span className="pr-3 text-ink/50">%</span>
						</div>
						<p className="mt-1 text-xs text-ink/50">
							Referencia: un fondo de inversión conservador puede rondar 6-8% anual, uno más
							agresivo 10-12%.
						</p>
					</div>

					<div>
						<label htmlFor="anios" className="block text-sm font-medium text-ink">
							Años a proyectar
						</label>
						<input
							type="number"
							min="1"
							id="anios"
							placeholder="10"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('anios', { required: true, valueAsNumber: true })}
						/>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Simular
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-interes-compuesto" ref={resultadosRef}>
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							En {anios} años tendrías {currency.format(resultado.saldoFinal)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							De ese total, tú aportaste {currency.format(resultado.totalAportado)} y el interés
							generó {currency.format(resultado.interesGenerado)}, que representa el{' '}
							{percent.format(resultado.porcentajeInteres)} de tu resultado final.
						</p>
					</div>
					<ExportButtons targetId="resultado-interes-compuesto" title="Resultado de interés compuesto" />

					<div className="mt-8 rounded-2xl bg-surface p-4 ring-1 ring-primary/10 sm:p-6">
						<div className="h-72 sm:h-80">
							<Line data={chartData} options={chartOptions} />
						</div>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Total aportado
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-ink">
								{currency.format(resultado.totalAportado)}
							</p>
						</div>
						<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
							<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
								Interés generado
							</p>
							<p className="mt-1 font-serif text-xl font-semibold text-positive">
								{currency.format(resultado.interesGenerado)}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
