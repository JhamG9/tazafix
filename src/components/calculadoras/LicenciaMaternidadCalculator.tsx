import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { currency, miles } from '../../lib/format';
import {
	calcularLicenciaMaternidad,
	calcularLicenciaPaternidad,
	type ResultadoLicencia,
} from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

type TipoLicencia = 'maternidad' | 'paternidad';

interface FormValues {
	salario: string;
	tipo: TipoLicencia;
	multiple: boolean;
	prematuro: number;
	compartidas: number;
}

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function LicenciaMaternidadCalculator() {
	const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
		defaultValues: { salario: '', tipo: 'maternidad', multiple: false, prematuro: 0, compartidas: 0 },
	});

	const tipo = watch('tipo');
	const [resultado, setResultado] = useState<ResultadoLicencia | null>(null);

	const onSubmit = (data: FormValues) => {
		const salario = parseMonto(data.salario);
		if (!salario) return;

		const compartidas = data.compartidas || 0;
		setResultado(
			data.tipo === 'maternidad'
				? calcularLicenciaMaternidad(salario, data.multiple, data.prematuro || 0, compartidas)
				: calcularLicenciaPaternidad(salario, compartidas)
		);
	};

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10"
			>
				<CalculatorHint>
					elige el tipo de licencia e ingresa el salario o IBC. Calculamos las semanas y el valor
					total a cargo de la EPS.
				</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="salario" className="block text-sm font-medium text-ink">
							Salario o IBC mensual
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
							Tipo de licencia
						</label>
						<select
							id="tipo"
							className="mt-1 w-full rounded-lg px-2 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('tipo')}
						>
							<option value="maternidad">Maternidad</option>
							<option value="paternidad">Paternidad</option>
						</select>
					</div>

					{tipo === 'maternidad' && (
						<div className="grid grid-cols-2 gap-3">
							<label className="flex items-start gap-2 pt-1 text-sm text-ink/70 col-span-2">
								<input type="checkbox" className="mt-0.5 accent-primary" {...register('multiple')} />
								<span>Parto múltiple o hijo con discapacidad diagnosticada</span>
							</label>
							<div className="col-span-2">
								<label htmlFor="prematuro" className="block text-sm font-medium text-ink">
									Semanas de adelanto si el parto fue prematuro
								</label>
								<input
									type="number"
									min={0}
									id="prematuro"
									className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									{...register('prematuro', { valueAsNumber: true })}
								/>
							</div>
						</div>
					)}

					<div>
						<label htmlFor="compartidas" className="block text-sm font-medium text-ink">
							{tipo === 'maternidad'
								? 'Semanas que la madre cede al otro padre'
								: 'Semanas que la madre le comparte'}
						</label>
						<input
							type="number"
							min={0}
							max={6}
							id="compartidas"
							className="mt-1 w-full rounded-lg px-3 py-2.5 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							{...register('compartidas', { valueAsNumber: true })}
						/>
						<p className="mt-1 text-xs text-ink/50">
							Licencia parental compartida (Ley 2114 de 2021): hasta 6 semanas, avisando a las EPS
							y empleadores con 30 días de anticipación.
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
				<div id="resultado-licencia">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Valor total: {currency.format(resultado.valor)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							{resultado.semanas} semanas ({resultado.dias} días) a cargo de la EPS.
						</p>
					</div>
					<ExportButtons targetId="resultado-licencia" title="Resultado de licencia de maternidad o paternidad" />

					<div className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<dl className="space-y-2 text-sm text-ink/70">
							{resultado.detalle.map((item) => (
								<div key={item.label} className="flex justify-between gap-2">
									<dt>{item.label}</dt>
									<dd className="text-right text-ink">{item.semanas} semanas</dd>
								</div>
							))}
						</dl>
						<div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-semibold text-ink">
							<span>Total ({resultado.dias} días)</span>
							<span>{currency.format(resultado.valor)}</span>
						</div>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Maternidad: 18 semanas base (CST artículo 236, Ley 2114 de 2021 y Ley 1822 de 2017),
						más 2 semanas por parto múltiple o discapacidad, más las semanas de adelanto por parto
						prematuro. Paternidad: 2 semanas fijas (Ley 2114 de 2021). Ambas las paga la EPS al
						100% del salario o IBC, aunque en la práctica el empleador suele adelantar el pago en
						la nómina y recobrarlo ante la EPS. Requiere cotización continua durante la gestación.
						Herramienta orientativa, no reemplaza el reconocimiento oficial de la EPS.
					</p>
				</div>
			)}
		</div>
	);
}
