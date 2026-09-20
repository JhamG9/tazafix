import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SMMLV_2026, clasesRiesgoArl } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import { calcularAportesIndependiente, type ResultadoAportesIndependiente } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

interface FormValues {
	ingreso: string;
	claseRiesgo: string;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function AportesIndependienteCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: { ingreso: '', claseRiesgo: clasesRiesgoArl[0].tasa.toString() },
	});

	const [resultado, setResultado] = useState<ResultadoAportesIndependiente | null>(null);

	const onSubmit = (data: FormValues) => {
		const ingreso = parseMonto(data.ingreso);
		if (!ingreso) return;
		setResultado(calcularAportesIndependiente(ingreso, Number(data.claseRiesgo), SMMLV_2026));
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					ingresa los ingresos mensuales por honorarios y la clase de riesgo. Calculamos el ingreso
					base de cotización y los aportes a seguridad social.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="ingreso" className="block text-sm font-medium text-ink">
							Ingresos mensuales por honorarios
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="ingreso"
								placeholder="4.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								{...register('ingreso', {
									onChange: (event) => {
										const digits = event.target.value.replace(/\D/g, '');
										setValue('ingreso', digits ? miles.format(Number(digits)) : '');
									},
								})}
							/>
						</div>
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
						<p className="mt-1 text-xs text-ink/50">
							La afiliación a ARL es obligatoria cuando el contrato supera un mes y el riesgo es IV
							o V.
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

			{resultado && (
				<div id="resultado-aportes-independiente">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Total aportes mensuales: {currency.format(resultado.total)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Sobre un ingreso base de cotización de {currency.format(resultado.ibc)}.
						</p>
					</div>
					<ExportButtons targetId="resultado-aportes-independiente" title="Aportes de contratista independiente" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Ingreso base de cotización, IBC</dt>
								<dd className="text-right text-ink">{currency.format(resultado.ibc)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Salud (12.5%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.salud)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Pensión (16%)</dt>
								<dd className="text-right text-ink">{currency.format(resultado.pension)}</dd>
							</div>
							{resultado.fondoSolidaridad > 0 && (
								<div className="flex justify-between gap-2">
									<dt>Fondo de solidaridad pensional</dt>
									<dd className="text-right text-ink">{currency.format(resultado.fondoSolidaridad)}</dd>
								</div>
							)}
							<div className="flex justify-between gap-2">
								<dt>ARL</dt>
								<dd className="text-right text-ink">{currency.format(resultado.arl)}</dd>
							</div>
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total aportes mensuales</span>
							<span>{currency.format(resultado.total)}</span>
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						El ingreso base de cotización es el 40% de los ingresos mensuales por contrato de
						prestación de servicios (Ley 1955 de 2019, artículo 244), con un piso de un SMMLV (
						{currency.format(SMMLV_2026)} en 2026). Tarifas de ARL según la clase de riesgo,
						Decreto 1772 de 1994. Fondo de solidaridad pensional (Ley 797 de 2003, artículo 8): 1%
						desde 4 SMMLV, creciendo hasta 2% desde 20 SMMLV.
					</p>
				</div>
			)}
		</div>
	);
}
