import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SMMLV_2026 } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import {
	aplicarFueroMaternidad,
	calcularIndemnizacionFijoPorFechas,
	calcularIndemnizacionIndefinidoPorFechas,
	type ResultadoIndemnizacion,
} from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

type TipoContrato = 'indefinido' | 'fijo';

interface FormValues {
	salario: string;
	tipo: TipoContrato;
	fechaInicio: string;
	fechaTerminacion: string;
	fechaVencimiento: string;
	fueroMaternidad: boolean;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

// Los <input type="date"> dan "YYYY-MM-DD". `new Date(string)` lo interpreta como medianoche UTC,
// lo que en husos horarios negativos (Bogotá, UTC-5) cae en el día local anterior. Se construye la
// fecha con el constructor de componentes locales para evitar ese corrimiento de un día.
function parseFechaLocal(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
}

function formatoFechaLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

const hoy = formatoFechaLocal(new Date());

export default function IndemnizacionDespidoCalculator() {
	const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
		defaultValues: {
			salario: '',
			tipo: 'indefinido',
			fechaInicio: '',
			fechaTerminacion: hoy,
			fechaVencimiento: '',
			fueroMaternidad: false,
		},
	});

	const tipo = watch('tipo');
	const [resultado, setResultado] = useState<ResultadoIndemnizacion | null>(null);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = (data: FormValues) => {
		const salario = parseMonto(data.salario);
		if (!salario) {
			setError('Ingresa el salario.');
			setResultado(null);
			return;
		}

		if (data.tipo === 'indefinido') {
			const inicio = parseFechaLocal(data.fechaInicio);
			const fin = parseFechaLocal(data.fechaTerminacion);
			if (!data.fechaInicio || !data.fechaTerminacion || fin < inicio) {
				setError('Verifica que la fecha de terminación sea posterior a la fecha de inicio.');
				setResultado(null);
				return;
			}
			setError(null);
			let resultadoCalculado = calcularIndemnizacionIndefinidoPorFechas(inicio, fin, salario, SMMLV_2026);
			if (data.fueroMaternidad) {
				resultadoCalculado = aplicarFueroMaternidad(resultadoCalculado, salario);
			}
			setResultado(resultadoCalculado);
		} else {
			const terminacion = parseFechaLocal(data.fechaTerminacion);
			const vencimiento = parseFechaLocal(data.fechaVencimiento);
			if (!data.fechaTerminacion || !data.fechaVencimiento || vencimiento < terminacion) {
				setError('Verifica que la fecha de vencimiento pactada sea posterior a la de terminación.');
				setResultado(null);
				return;
			}
			setError(null);
			let resultadoCalculado = calcularIndemnizacionFijoPorFechas(terminacion, vencimiento, salario);
			if (data.fueroMaternidad) {
				resultadoCalculado = aplicarFueroMaternidad(resultadoCalculado, salario);
			}
			setResultado(resultadoCalculado);
		}
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					elige el tipo de contrato, ingresa el salario y las fechas. Calculamos la indemnización
					por terminación sin justa causa.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="salario" className="block text-sm font-medium text-ink">
							Salario mensual
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="salario"
								placeholder="2.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('salario', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('salario', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="tipo" className="block text-sm font-medium text-ink">
							Tipo de contrato
						</label>
						<select
							id="tipo"
							className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('tipo')}
						>
							<option value="indefinido">Término indefinido</option>
							<option value="fijo">Término fijo</option>
						</select>
					</div>

					{tipo === 'indefinido' ? (
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="fechaInicio" className="block text-sm font-medium text-ink">
									Fecha de inicio
								</label>
								<input
									type="date"
									id="fechaInicio"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('fechaInicio', { required: tipo === 'indefinido' })}
								/>
							</div>
							<div>
								<label htmlFor="fechaTerminacion" className="block text-sm font-medium text-ink">
									Fecha de terminación
								</label>
								<input
									type="date"
									id="fechaTerminacion"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('fechaTerminacion', { required: true })}
								/>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="fechaTerminacionFijo" className="block text-sm font-medium text-ink">
									Fecha de terminación
								</label>
								<input
									type="date"
									id="fechaTerminacionFijo"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('fechaTerminacion', { required: true })}
								/>
							</div>
							<div>
								<label htmlFor="fechaVencimiento" className="block text-sm font-medium text-ink">
									Vencimiento pactado del contrato
								</label>
								<input
									type="date"
									id="fechaVencimiento"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('fechaVencimiento', { required: tipo === 'fijo' })}
								/>
							</div>
						</div>
					)}

					<label className="flex items-start gap-2 text-sm text-ink/70">
						<input
							type="checkbox"
							className="mt-0.5 accent-primary"
							{...register('fueroMaternidad')}
						/>
						<span>
							Trabajadora embarazada o dentro de las 18 semanas después del parto, despedida sin
							autorización previa del Ministerio del Trabajo (fuero de maternidad)
						</span>
					</label>

					{error && <p className="text-sm text-alert">{error}</p>}

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-indemnizacion">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Indemnización estimada: {currency.format(resultado.valor)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Equivalente a {resultado.dias.toFixed(1)} días de salario.
						</p>
					</div>
					<ExportButtons targetId="resultado-indemnizacion" title="Resultado de indemnización" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<p className="text-sm font-semibold text-ink">
							Desglose
							{resultado.tope10Smmlv && (
								<span className="ml-2 font-normal text-ink/50">(tarifa de 10 SMMLV o más)</span>
							)}
						</p>
						<dl className="mt-3 space-y-2 text-sm text-ink/70">
							{resultado.detalle.map((item) => (
								<div key={item.label} className="flex justify-between gap-2">
									<dt>{item.label}</dt>
									<dd className="text-right text-ink">{item.dias.toFixed(1)} días</dd>
								</div>
							))}
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total ({resultado.dias.toFixed(1)} días)</span>
							<span>{currency.format(resultado.valor)}</span>
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Basado en el artículo 64 del Código Sustantivo del Trabajo. Por debajo de 10 SMMLV (
						{currency.format(SMMLV_2026 * 10)} en 2026) son 30 días fijos si lleva menos de un año
						(sin prorratear), más 20 días por cada año adicional cumplido y su fracción; desde 10
						SMMLV son 20 días fijos el primer año y 15 por cada año adicional. El fuero de
						maternidad (artículo 239 del CST) suma 60 días fijos de salario, sin importar la
						antigüedad. Los años completos de servicio se cuentan por aniversario del contrato. No
						incluye salarios ni prestaciones causadas y no pagadas, otros fueros (sindical,
						discapacidad) ni el reintegro, que también son alternativas legales. Herramienta
						orientativa, no un cálculo legal certificado.
					</p>
				</div>
			)}
		</div>
	);
}
