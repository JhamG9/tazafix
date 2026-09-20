import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SMMLV_2026 } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import { calcularIncapacidad, type OrigenIncapacidad, type ResultadoIncapacidad } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	salario: string;
	origen: OrigenIncapacidad;
	dias: number;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function IncapacidadLaboralCalculator() {
	const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
		defaultValues: { salario: '', origen: 'comun', dias: 10 },
	});

	const origen = watch('origen');
	const [resultado, setResultado] = useState<ResultadoIncapacidad | null>(null);

	const onSubmit = (data: FormValues) => {
		const salario = parseMonto(data.salario);
		if (!salario || !data.dias) return;
		setResultado(calcularIncapacidad(salario, data.origen, data.dias, SMMLV_2026));
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					ingresa el salario, el origen de la incapacidad y los días. Calculamos cuánto paga el
					empleador y cuánto paga la EPS o la ARL.
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
						<label htmlFor="origen" className="block text-sm font-medium text-ink">
							Origen
						</label>
						<select
							id="origen"
							className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('origen')}
						>
							<option value="comun">Enfermedad o accidente común</option>
							<option value="laboral">Accidente o enfermedad laboral, ATEL</option>
						</select>
					</div>

					<div>
						<label htmlFor="dias" className="block text-sm font-medium text-ink">
							Días de incapacidad
						</label>
						<input
							type="number"
							min={1}
							id="dias"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('dias', { required: true, valueAsNumber: true })}
						/>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Calcular
					</button>
				</div>
			</form>

			{resultado && (
				<div id="resultado-incapacidad">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Total del periodo: {currency.format(resultado.total)}
						</p>
					</div>
					<ExportButtons targetId="resultado-incapacidad" title="Resultado de incapacidad laboral" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							{origen === 'comun' && (
								<div className="flex justify-between gap-2">
									<dt>A cargo del empleador (primeros 2 días)</dt>
									<dd className="text-right text-ink">{currency.format(resultado.aCargoEmpleador)}</dd>
								</div>
							)}
							<div className="flex justify-between gap-2">
								<dt>A cargo de {origen === 'laboral' ? 'la ARL' : 'la EPS'}</dt>
								<dd className="text-right text-ink">{currency.format(resultado.aCargoEntidad)}</dd>
							</div>
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total del periodo de incapacidad</span>
							<span>{currency.format(resultado.total)}</span>
						</div>
					</div>

					{resultado.superaTope180 && (
						<p className="mt-4 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
							El cálculo se topa en 180 días. Una incapacidad por enfermedad común más larga entra
							en el trámite de calificación de pérdida de capacidad laboral (posible pensión de
							invalidez), que esta calculadora no cubre.
						</p>
					)}

					<p className="mt-8 text-sm text-ink/60">
						Enfermedad común (Decreto 2943 de 2013, artículo 1; Decreto 019 de 2012, artículo 142):
						los dos primeros días los paga el empleador al 100% del salario. Del día 3 al 90 paga
						la EPS al 66.67%, y del 91 al 180 al 50%, sin que el pago diario baje de un salario
						mínimo legal diario ({currency.format(SMMLV_2026 / 30)} en 2026). Accidente o
						enfermedad laboral (CST, artículo 227): la ARL paga el 100% del salario desde el día
						siguiente a la incapacidad.
					</p>
				</div>
			)}
		</div>
	);
}
