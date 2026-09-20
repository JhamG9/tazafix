import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
	AUX_TRANSPORTE_2026,
	TOPE_AUX_TRANSPORTE_2026,
	TOPE_FONDO_SOLIDARIDAD_2026,
} from '../../data/liquidacionLaboral';
import { currency, miles } from '../../lib/format';
import {
	calcularLiquidacionEmpleado,
	salarioMensualizado,
	type ResultadoLiquidacionEmpleado,
} from '../../lib/liquidacion';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

type Modo = 'tiempoCompleto' | 'porDias';

interface FormValues {
	tcInicio: string;
	tcFin: string;
	tcSalario: string;
	pdInicio: string;
	pdFin: string;
	pdSalario: string;
	pdDias: number;
	auxilioTransporte: boolean;
}

interface Resultado {
	salarioBase: number;
	empleado: ResultadoLiquidacionEmpleado;
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

export default function LiquidacionLaboralCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: {
			tcInicio: '',
			tcFin: hoy,
			tcSalario: '',
			pdInicio: '',
			pdFin: hoy,
			pdSalario: '',
			pdDias: 5,
			auxilioTransporte: true,
		},
	});

	const [modo, setModo] = useState<Modo>('tiempoCompleto');
	const [resultado, setResultado] = useState<Resultado | null>(null);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = (data: FormValues) => {
		const inicio = parseFechaLocal(modo === 'tiempoCompleto' ? data.tcInicio : data.pdInicio);
		const fin = parseFechaLocal(modo === 'tiempoCompleto' ? data.tcFin : data.pdFin);

		if (
			(modo === 'tiempoCompleto' && (!data.tcInicio || !data.tcFin)) ||
			(modo === 'porDias' && (!data.pdInicio || !data.pdFin)) ||
			fin < inicio
		) {
			setError('Verifica que la fecha de fin sea posterior a la fecha de inicio.');
			setResultado(null);
			return;
		}

		const salarioBase =
			modo === 'tiempoCompleto'
				? parseMonto(data.tcSalario)
				: salarioMensualizado(parseMonto(data.pdSalario), data.pdDias);

		if (!salarioBase) {
			setError('Ingresa el salario.');
			setResultado(null);
			return;
		}

		setError(null);
		const auxilio = data.auxilioTransporte ? AUX_TRANSPORTE_2026 : 0;

		setResultado({
			salarioBase,
			empleado: calcularLiquidacionEmpleado(inicio, fin, salarioBase, auxilio),
		});
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					elige si el trabajador es de tiempo completo o le pagan por día, ingresa las fechas del
					contrato y el salario. Calculamos cuánto le corresponde al terminar el contrato.
				</CalculatorHint>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setModo('tiempoCompleto')}
						className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
							modo === 'tiempoCompleto'
								? 'bg-primary text-surface'
								: 'bg-base text-ink/70 ring-1 ring-primary/20 hover:bg-primary/5'
						}`}
					>
						Tiempo completo
					</button>
					<button
						type="button"
						onClick={() => setModo('porDias')}
						className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
							modo === 'porDias'
								? 'bg-primary text-surface'
								: 'bg-base text-ink/70 ring-1 ring-primary/20 hover:bg-primary/5'
						}`}
					>
						Por días
					</button>
				</div>

				<div className="mt-5 space-y-5">
					{modo === 'tiempoCompleto' ? (
						<>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label htmlFor="tcInicio" className="block text-sm font-medium text-ink">
										Fecha inicio
									</label>
									<input
										type="date"
										id="tcInicio"
										className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('tcInicio', { required: modo === 'tiempoCompleto' })}
									/>
								</div>
								<div>
									<label htmlFor="tcFin" className="block text-sm font-medium text-ink">
										Fecha fin
									</label>
									<input
										type="date"
										id="tcFin"
										className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('tcFin', { required: modo === 'tiempoCompleto' })}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="tcSalario" className="block text-sm font-medium text-ink">
									Salario mensual
								</label>
								<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
									<span className="pl-3 text-ink/50">$</span>
									<input
										type="text"
										inputMode="numeric"
										id="tcSalario"
										placeholder="2.000.000"
										className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
										{...register('tcSalario', {
											onChange: (event) => {
												const digits = event.target.value.replace(/\D/g, '');
												setValue('tcSalario', digits ? miles.format(Number(digits)) : '');
												setValue('auxilioTransporte', Number(digits) <= TOPE_AUX_TRANSPORTE_2026);
											},
										})}
									/>
								</div>
							</div>
						</>
					) : (
						<>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label htmlFor="pdInicio" className="block text-sm font-medium text-ink">
										Fecha inicio
									</label>
									<input
										type="date"
										id="pdInicio"
										className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('pdInicio', { required: modo === 'porDias' })}
									/>
								</div>
								<div>
									<label htmlFor="pdFin" className="block text-sm font-medium text-ink">
										Fecha fin
									</label>
									<input
										type="date"
										id="pdFin"
										className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('pdFin', { required: modo === 'porDias' })}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label htmlFor="pdSalario" className="block text-sm font-medium text-ink">
										Salario diario
									</label>
									<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
										<span className="pl-3 text-ink/50">$</span>
										<input
											type="text"
											inputMode="numeric"
											id="pdSalario"
											placeholder="70.000"
											className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
											{...register('pdSalario', {
												onChange: (event) => {
													const digits = event.target.value.replace(/\D/g, '');
													setValue('pdSalario', digits ? miles.format(Number(digits)) : '');
												},
											})}
										/>
									</div>
								</div>
								<div>
									<label htmlFor="pdDias" className="block text-sm font-medium text-ink">
										Días por semana
									</label>
									<input
										type="number"
										min={1}
										max={6}
										id="pdDias"
										className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
										{...register('pdDias', { required: modo === 'porDias', valueAsNumber: true })}
									/>
								</div>
							</div>
						</>
					)}

					<label className="flex items-start gap-2 text-sm text-ink/70">
						<input
							type="checkbox"
							className="mt-0.5 accent-primary"
							{...register('auxilioTransporte')}
						/>
						<span>
							Auxilio de transporte (aplica hasta 2 SMMLV, {currency.format(TOPE_AUX_TRANSPORTE_2026)} en
							2026)
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
				<div id="resultado-liquidacion-laboral">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Liquidación estimada: {currency.format(resultado.empleado.total)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Por {resultado.empleado.dias} días de contrato, con un salario base de{' '}
							{currency.format(resultado.salarioBase)}.
						</p>
					</div>
					<ExportButtons targetId="resultado-liquidacion-laboral" title="Resultado de liquidación laboral" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<p className="text-sm font-semibold text-ink">Liquidación para el empleado</p>
						<dl className="mt-3 space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Cesantías</dt>
								<dd className="text-right text-ink">{currency.format(resultado.empleado.cesantias)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Intereses de cesantías</dt>
								<dd className="text-right text-ink">
									{currency.format(resultado.empleado.interesesCesantias)}
								</dd>
							</div>
							{resultado.empleado.primaPorSemestre.map((segmento) => (
								<div key={segmento.label} className="flex justify-between gap-2">
									<dt>{segmento.label}</dt>
									<dd className="text-right text-ink">{currency.format(segmento.monto)}</dd>
								</div>
							))}
							<div className="flex justify-between gap-2">
								<dt>Vacaciones</dt>
								<dd className="text-right text-ink">{currency.format(resultado.empleado.vacaciones)}</dd>
							</div>
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total liquidación empleado</span>
							<span>{currency.format(resultado.empleado.total)}</span>
						</div>
						<p className="mt-3 text-xs text-ink/50">
							Aportes mensuales del empleado: pensión 4%
							{resultado.salarioBase >= TOPE_FONDO_SOLIDARIDAD_2026
								? ' + fondo de solidaridad 1%'
								: ''}
							, salud 4%.
						</p>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Esta calculadora estima cesantías, intereses, prima y vacaciones al terminar el
						contrato. Cesantías e intereses están exentos de retención en la fuente (artículo 206
						del Estatuto Tributario); la prima y las vacaciones sí pueden quedar sujetas a
						retención según el caso, lo que esta calculadora no descuenta. No incluye indemnización
						por despido sin justa causa ni reemplaza los sistemas contables del empleador ni
						certifica ningún derecho ante la autoridad laboral.
					</p>
				</div>
			)}
		</div>
	);
}
