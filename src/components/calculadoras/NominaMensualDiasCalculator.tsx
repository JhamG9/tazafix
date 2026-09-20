import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AUX_TRANSPORTE_2026, TOPE_AUX_TRANSPORTE_2026, TOPE_EXONERACION_2026 } from '../../data/liquidacionLaboral';
import { clasesRiesgoArl } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import { calcularNominaMensualPorDias, type ResultadoNominaMensual } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	salarioMensual: string;
	dias: number;
	auxilio: boolean;
	claseRiesgo: string;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function NominaMensualDiasCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: { salarioMensual: '', dias: 30, auxilio: true, claseRiesgo: clasesRiesgoArl[0].tasa.toString() },
	});

	const [resultado, setResultado] = useState<ResultadoNominaMensual | null>(null);

	const onSubmit = (data: FormValues) => {
		const salarioMensual = parseMonto(data.salarioMensual);
		if (!salarioMensual || !data.dias) return;
		const salarioDiario = salarioMensual / 30;
		setResultado(
			calcularNominaMensualPorDias(
				salarioDiario,
				data.dias,
				data.auxilio,
				AUX_TRANSPORTE_2026,
				Number(data.claseRiesgo),
				TOPE_EXONERACION_2026
			)
		);
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					ingresa el salario mensual del trabajador. Por defecto calculamos un mes completo (30
					días); ajusta los días solo si trabajó una parte del mes.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="salarioMensual" className="block text-sm font-medium text-ink">
							Salario mensual
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="salarioMensual"
								placeholder="8.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('salarioMensual', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('salarioMensual', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
					</div>

					<div>
						<label htmlFor="dias" className="block text-sm font-medium text-ink">
							Días trabajados en el mes
						</label>
						<input
							type="number"
							min={1}
							max={30}
							id="dias"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('dias', { required: true, valueAsNumber: true })}
						/>
						<p className="mt-1 text-xs text-ink/50">
							Déjalo en 30 para un mes completo. Cámbialo solo si el trabajador laboró por días
							sueltos.
						</p>
					</div>

					<div>
						<label htmlFor="claseRiesgo" className="block text-sm font-medium text-ink">
							Clase de riesgo ARL
						</label>
						<select
							id="claseRiesgo"
							className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('claseRiesgo')}
						>
							{clasesRiesgoArl.map((clase) => (
								<option key={clase.id} value={clase.tasa}>
									{clase.label}
								</option>
							))}
						</select>
					</div>

					<label className="flex items-start gap-2 text-sm text-ink/70">
						<input type="checkbox" className="mt-0.5 accent-primary" {...register('auxilio')} />
						<span>
							Con derecho a auxilio de transporte proporcional (aplica hasta 2 SMMLV,{' '}
							{currency.format(TOPE_AUX_TRANSPORTE_2026)} en 2026)
						</span>
					</label>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-nomina-mensual">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Costo total del mes: {currency.format(resultado.totalConExoneracion)}
						</p>
					</div>
					<ExportButtons targetId="resultado-nomina-mensual" title="Resultado de nómina mensual por días" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Salario devengado</dt>
								<dd className="text-right text-ink">{currency.format(resultado.salarioDevengado)}</dd>
							</div>
							{resultado.auxilioProporcional > 0 && (
								<div className="flex justify-between gap-2">
									<dt>Auxilio de transporte proporcional</dt>
									<dd className="text-right text-ink">{currency.format(resultado.auxilioProporcional)}</dd>
								</div>
							)}
						</dl>

						<p className="mt-4 text-sm font-semibold text-ink">Prestaciones sociales</p>
						<dl className="mt-2 space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Provisión cesantías</dt>
								<dd className="text-right text-ink">{currency.format(resultado.provisionCesantias)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Provisión intereses sobre cesantías</dt>
								<dd className="text-right text-ink">
									{currency.format(resultado.provisionInteresesCesantias)}
								</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Provisión prima</dt>
								<dd className="text-right text-ink">{currency.format(resultado.provisionPrima)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Provisión vacaciones</dt>
								<dd className="text-right text-ink">{currency.format(resultado.provisionVacaciones)}</dd>
							</div>
						</dl>

						<p className="mt-4 text-sm font-semibold text-ink">Aportes a la seguridad social</p>
						<dl className="mt-2 space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Pensión (12%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.pension)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Salud (8.5%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.salud)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Riesgos laborales, ARL</dt>
								<dd className="text-right text-ink">{currency.format(resultado.arl)}</dd>
							</div>
						</dl>

						<p className="mt-4 text-sm font-semibold text-ink">Parafiscales</p>
						<dl className="mt-2 space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Caja de compensación familiar (4%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.cajaCompensacion)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>ICBF (3%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.icbf)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>SENA (2%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.sena)}</dd>
							</div>
						</dl>

						<div className="mt-4 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total sin exonerar</span>
							<span>{currency.format(resultado.totalSinExonerar)}</span>
						</div>
						<div className="mt-2 flex justify-between text-sm font-semibold text-primary">
							<span>Total con exoneración Ley 1819 de 2016</span>
							<span>{currency.format(resultado.totalConExoneracion)}</span>
						</div>
						{!resultado.exonerado && (
							<p className="mt-3 text-xs text-ink/50">
								No aplica exoneración: el salario mensual equivalente supera los 10 SMMLV.
							</p>
						)}
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Esta calculadora liquida la nómina corriente de un trabajador que labora por días
						dentro de un mes, no la liquidación final de un contrato. Auxilio de transporte 2026:
						{' '}{currency.format(AUX_TRANSPORTE_2026)} (Decreto 1470 de 2025), aplica solo a quienes
						ganan hasta 2 SMMLV. Provisión de cesantías e intereses según la Ley 52 de 1975 y
						prima de servicios según el artículo 306 del CST, prorrateadas a un mes. La
						exoneración de salud, SENA e ICBF (Ley 1819 de 2016, artículo 65) aplica cuando el
						salario mensual equivalente es menor a 10 SMMLV.
					</p>
				</div>
			)}
		</div>
	);
}
