import { useMemo, useState } from 'react';
import { HORAS_MENSUALES_JORNADA_2026 } from '../../data/parametrosLaborales2026';
import { currency, miles } from '../../lib/format';
import { calcularPagoHorasExtra } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

export default function HorasExtraCalculator() {
	const [salarioTexto, setSalarioTexto] = useState('2.000.000');
	const [cantidades, setCantidades] = useState<number[]>(Array(7).fill(0));
	const salario = parseMonto(salarioTexto);

	const resultado = useMemo(
		() => (salario > 0 ? calcularPagoHorasExtra(salario, HORAS_MENSUALES_JORNADA_2026, cantidades) : null),
		[salario, cantidades]
	);

	const actualizarCantidad = (index: number, valor: string) => {
		const numero = Math.max(Number(valor.replace(/\D/g, '')) || 0, 0);
		setCantidades((actual) => actual.map((c, i) => (i === index ? numero : c)));
	};

	// Índices de los tipos que son "horas extra" (no recargos por trabajar de noche o en día de
	// descanso sin ser hora adicional): diurna, nocturna, dominical/festiva diurna y nocturna extra.
	const horasExtraSemanales = [0, 2, 4, 6].reduce((suma, i) => suma + (cantidades[i] || 0), 0);
	const superaLimiteSemanal = horasExtraSemanales > 12;

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<div className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10">
				<CalculatorHint>
					ingresa el salario mensual y cuántas horas de cada tipo trabajó. Calculamos el valor de
					cada una y el total a pagar.
				</CalculatorHint>
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
							value={salarioTexto}
							onChange={(event) => {
								const digits = event.target.value.replace(/\D/g, '');
								setSalarioTexto(digits ? miles.format(Number(digits)) : '');
							}}
						/>
					</div>
					<p className="mt-1 text-xs text-ink/50">
						Jornada de referencia: 42 horas semanales desde el 15 de julio de 2026 (Ley 2101 de
						2021), divisor de {HORAS_MENSUALES_JORNADA_2026} horas mensuales ((42 ÷ 6) × 30).
					</p>
				</div>

				{resultado && (
					<div className="mt-5 space-y-3">
						<p className="text-sm font-medium text-ink">¿Cuántas horas de cada tipo trabajó?</p>
						{resultado.filas.map((fila, index) => (
							<div key={fila.label} className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm text-ink">{fila.label}</p>
									<p className="text-xs text-ink/50">{currency.format(fila.valorHora)} / hora</p>
								</div>
								<input
									type="text"
									inputMode="numeric"
									className="w-20 shrink-0 rounded-lg px-2 py-1.5 text-right text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
									value={fila.cantidad || ''}
									placeholder="0"
									onChange={(event) => actualizarCantidad(index, event.target.value)}
								/>
							</div>
						))}
						{superaLimiteSemanal && (
							<p className="rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
								{horasExtraSemanales} horas extra superan el límite legal de 12 horas extra a la
								semana (CST artículo 22, Ley 50 de 1990). Verifica que estén repartidas en varias
								semanas.
							</p>
						)}
					</div>
				)}
			</div>

			{resultado && (
				<div id="resultado-horas-extra">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Total a pagar: {currency.format(resultado.total)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Hora ordinaria: {currency.format(resultado.horaOrdinaria)}, con un salario mensual de{' '}
							{currency.format(salario)}.
						</p>
					</div>
					<ExportButtons targetId="resultado-horas-extra" title="Valor de horas extra y recargos" />

					<div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-primary/10">
						<table className="w-full text-sm">
							<thead className="bg-primary/5 text-left text-xs font-semibold uppercase tracking-wide text-ink/60">
								<tr>
									<th className="px-4 py-3">Tipo</th>
									<th className="px-4 py-3 text-right">Valor hora</th>
									<th className="px-4 py-3 text-right">Horas</th>
									<th className="px-4 py-3 text-right">Subtotal</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-primary/10 bg-surface">
								{resultado.filas.map((fila) => (
									<tr key={fila.label}>
										<td className="px-4 py-3 text-ink">{fila.label}</td>
										<td className="px-4 py-3 text-right text-ink/70">{currency.format(fila.valorHora)}</td>
										<td className="px-4 py-3 text-right text-ink/70">{fila.cantidad}</td>
										<td className="px-4 py-3 text-right font-semibold text-ink">
											{currency.format(fila.subtotal)}
										</td>
									</tr>
								))}
							</tbody>
							<tfoot>
								<tr className="border-t border-primary/10 bg-primary/5">
									<td className="px-4 py-3 font-semibold text-ink" colSpan={3}>
										Total a pagar
									</td>
									<td className="px-4 py-3 text-right font-semibold text-ink">
										{currency.format(resultado.total)}
									</td>
								</tr>
							</tfoot>
						</table>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						Recargo nocturno desde las 7:00pm. Recargo dominical y festivo al 90% del valor de la
						hora ordinaria desde el 1 de julio de 2026 (Ley 2466 de 2025). El límite legal de horas
						extra es 2 al día y 12 a la semana (CST artículo 22). Valores orientativos, no
						reemplazan la liquidación de nómina.
					</p>
				</div>
			)}
		</div>
	);
}
