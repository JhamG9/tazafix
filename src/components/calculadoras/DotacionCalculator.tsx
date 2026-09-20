import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SMMLV_2026 } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import { calcularDotacion, type ResultadoDotacion } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';

interface FormValues {
	salario: string;
	meses: number;
}

const TOPE_DOTACION_2026 = SMMLV_2026 * 2;

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function DotacionCalculator() {
	const { register, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: { salario: '', meses: 6 },
	});

	const [resultado, setResultado] = useState<ResultadoDotacion | null>(null);

	const onSubmit = (data: FormValues) => {
		const salario = parseMonto(data.salario);
		if (!salario) return;
		setResultado(calcularDotacion(salario, data.meses, TOPE_DOTACION_2026));
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					ingresa el salario del trabajador y su antigüedad continua. Verificamos si tiene derecho
					a dotación.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="salario" className="block text-sm font-medium text-ink">
							Salario mensual del trabajador
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="salario"
								placeholder="1.800.000"
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
						<label htmlFor="meses" className="block text-sm font-medium text-ink">
							Meses de antigüedad continua
						</label>
						<input
							type="number"
							min={0}
							id="meses"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('meses', { required: true, valueAsNumber: true })}
						/>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-surface transition-colors hover:bg-primary/90"
					>
						Verificar
					</button>
				</div>
			</form>

			{resultado && (
				<div>
					<div
						className={`rounded-2xl p-6 sm:p-10 ${resultado.tieneDerecho ? 'bg-primary' : 'bg-alert/10'}`}
					>
						<p
							className={`font-serif text-2xl font-semibold leading-tight sm:text-3xl ${
								resultado.tieneDerecho ? 'text-surface' : 'text-ink'
							}`}
						>
							{resultado.tieneDerecho ? 'Tiene derecho a dotación' : 'No tiene derecho a dotación'}
						</p>
					</div>

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							<div className="flex justify-between gap-2">
								<dt>Tope de salario para tener derecho (2 SMMLV)</dt>
								<dd className="text-right text-ink">{currency.format(TOPE_DOTACION_2026)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Cumple el requisito de salario</dt>
								<dd className="text-right text-ink">{resultado.cumpleSalario ? 'Sí' : 'No'}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt>Cumple el requisito de antigüedad (mínimo 3 meses)</dt>
								<dd className="text-right text-ink">{resultado.cumpleAntiguedad ? 'Sí' : 'No'}</dd>
							</div>
						</dl>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Obligatoria (artículos 230 a 233 del CST) para trabajadores que ganan hasta 2 SMMLV y
						llevan mínimo 3 meses continuos de servicio. Se entrega 3 veces al año, el 30 de abril,
						el 31 de agosto y el 20 de diciembre. Consiste en un vestido y un par de calzado
						adecuados a la labor.
					</p>
				</div>
			)}
		</div>
	);
}
