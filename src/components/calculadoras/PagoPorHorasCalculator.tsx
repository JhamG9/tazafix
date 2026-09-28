import { useEffect, useMemo, useState } from 'react';
import { SMMLV_2026, HORAS_MENSUALES_JORNADA_2026 } from '../../data/parametrosLaborales2026';
import { nombreFestivo } from '../../data/festivosColombia2026';
import { currency, miles } from '../../lib/format';
import { calcularPagoPorHorasCalendario, generarDiasPeriodo, agruparPorSemanas, MAX_DIAS_PAGO_POR_HORAS, type DiaPagoPorHoras } from '../../lib/empresas';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

const HORA_ORDINARIA_MINIMA_2026 = SMMLV_2026 / HORAS_MENSUALES_JORNADA_2026;

// Los <input type="date"> dan "YYYY-MM-DD". `new Date(string)` lo interpreta como medianoche UTC,
// lo que en Bogotá (UTC-5) cae en el día local anterior. Se construye la fecha con componentes
// locales para evitar ese corrimiento de un día.
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

function formatoCorto(iso: string): string {
	return parseFechaLocal(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function formatoDiaSemana(iso: string): string {
	return parseFechaLocal(iso).toLocaleDateString('es-CO', { weekday: 'short' });
}

const hoy = formatoFechaLocal(new Date());

function parseMonto(value: string): number {
	return Number(value.replace(/\D/g, ''));
}

type CampoHoras = 'horasDiurnas' | 'horasExtraDiurnas' | 'horasNocturnas' | 'horasExtraNocturnas';

export default function PagoPorHorasCalculator() {
	const [horaTexto, setHoraTexto] = useState('');
	const [fechaInicio, setFechaInicio] = useState(hoy);
	const [fechaFin, setFechaFin] = useState(hoy);
	const [dias, setDias] = useState<DiaPagoPorHoras[]>(() => generarDiasPeriodo(hoy, hoy, (iso) => !!nombreFestivo(iso)));

	const horaOrdinaria = parseMonto(horaTexto);
	const inicio = parseFechaLocal(fechaInicio);
	const fin = parseFechaLocal(fechaFin);
	const rangoValido = Boolean(fechaInicio) && Boolean(fechaFin) && fin >= inicio;
	const totalDiasRango = rangoValido ? Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1 : 0;
	const rangoDemasiadoLargo = totalDiasRango > MAX_DIAS_PAGO_POR_HORAS;

	useEffect(() => {
		if (!rangoValido || rangoDemasiadoLargo) return;
		setDias(generarDiasPeriodo(fechaInicio, fechaFin, (iso) => !!nombreFestivo(iso)));
		// Regenera el calendario (y reinicia las horas) solo cuando cambia el rango de fechas elegido.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fechaInicio, fechaFin]);

	const actualizarDia = (fecha: string, campo: CampoHoras, valor: string) => {
		const numero = Math.max(Number(valor.replace(/\D/g, '')) || 0, 0);
		setDias((actual) => actual.map((dia) => (dia.fecha === fecha ? { ...dia, [campo]: numero } : dia)));
	};

	const semanasParaEditar = useMemo(() => agruparPorSemanas(dias), [dias]);

	const resultado = useMemo(
		() => (horaOrdinaria > 0 && !rangoDemasiadoLargo && dias.length > 0 ? calcularPagoPorHorasCalendario(horaOrdinaria, dias) : null),
		[horaOrdinaria, dias, rangoDemasiadoLargo]
	);

	const bajoMinimoLegal = horaOrdinaria > 0 && horaOrdinaria < HORA_ORDINARIA_MINIMA_2026;
	const algunaSemanaSuperaLimite = resultado?.semanas.some((semana) => semana.superaLimiteSemanal) ?? false;

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,32rem)_1fr]">
			<div className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10">
				<CalculatorHint>
					elige el periodo a liquidar y marca las horas trabajadas cada día. El calendario ya sabe
					qué días son domingo o festivo, así que aplica el recargo correcto automáticamente.
				</CalculatorHint>

				<div>
					<label htmlFor="horaOrdinaria" className="block text-sm font-medium text-ink">
						Valor de la hora ordinaria pactada
					</label>
					<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
						<span className="pl-3 text-ink/50">$</span>
						<input
							type="text"
							inputMode="numeric"
							id="horaOrdinaria"
							placeholder="8.500"
							className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
							value={horaTexto}
							onChange={(event) => {
								const digits = event.target.value.replace(/\D/g, '');
								setHoraTexto(digits ? miles.format(Number(digits)) : '');
							}}
						/>
					</div>
					<p className="mt-1 text-xs text-ink/50">
						Mínimo legal 2026: {currency.format(HORA_ORDINARIA_MINIMA_2026)} la hora (SMMLV ÷{' '}
						{HORAS_MENSUALES_JORNADA_2026} horas mensuales).
					</p>
					{bajoMinimoLegal && (
						<p className="mt-2 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
							Este valor está por debajo del mínimo legal por hora. Solo es válido en casos
							excepcionales previstos por la ley (por ejemplo, contratos de aprendizaje).
						</p>
					)}
				</div>

				<div className="mt-5 grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="fechaInicio" className="block text-sm font-medium text-ink">
							Desde
						</label>
						<input
							type="date"
							id="fechaInicio"
							className="mt-1 w-full rounded-lg px-3 py-2 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							value={fechaInicio}
							onChange={(event) => setFechaInicio(event.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="fechaFin" className="block text-sm font-medium text-ink">
							Hasta
						</label>
						<input
							type="date"
							id="fechaFin"
							className="mt-1 w-full rounded-lg px-3 py-2 text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
							value={fechaFin}
							onChange={(event) => setFechaFin(event.target.value)}
						/>
					</div>
				</div>

				{!rangoValido && (
					<p className="mt-2 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
						La fecha "Hasta" debe ser igual o posterior a la fecha "Desde".
					</p>
				)}
				{rangoValido && rangoDemasiadoLargo && (
					<p className="mt-2 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
						Elige un periodo de máximo {MAX_DIAS_PAGO_POR_HORAS} días.
					</p>
				)}

				{resultado && (
					<div className="mt-6 space-y-6">
						{semanasParaEditar.map((diasSemana) => (
							<div key={diasSemana[0].fecha} className="rounded-xl bg-base p-3 ring-1 ring-primary/10">
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
									Semana del {formatoCorto(diasSemana[0].fecha)} al {formatoCorto(diasSemana[diasSemana.length - 1].fecha)}
								</p>
								<div className="space-y-3">
									{diasSemana.map((dia) => (
										<div key={dia.fecha} className="rounded-lg bg-surface p-3 ring-1 ring-primary/10">
											<div className="flex items-center justify-between">
												<p className="text-sm font-medium capitalize text-ink">
													{formatoDiaSemana(dia.fecha)} {formatoCorto(dia.fecha)}
												</p>
												{dia.esDomingoOFestivo && (
													<span className="rounded-full bg-alert/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-alert">
														{nombreFestivo(dia.fecha) ?? 'Domingo'}
													</span>
												)}
											</div>
											<div className="mt-2 grid grid-cols-2 gap-2">
												<label className="text-xs text-ink/60">
													{dia.esDomingoOFestivo ? 'H. dominicales/festivas' : 'H. diurnas'}
													<input
														type="text"
														inputMode="numeric"
														className="mt-0.5 w-full rounded-lg px-2 py-1.5 text-right text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
														value={dia.horasDiurnas || ''}
														placeholder="0"
														onChange={(event) => actualizarDia(dia.fecha, 'horasDiurnas', event.target.value)}
													/>
												</label>
												<label className="text-xs text-ink/60">
													{dia.esDomingoOFestivo ? 'H. extra dom/fest' : 'H. extra diurnas'}
													<input
														type="text"
														inputMode="numeric"
														className="mt-0.5 w-full rounded-lg px-2 py-1.5 text-right text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
														value={dia.horasExtraDiurnas || ''}
														placeholder="0"
														onChange={(event) => actualizarDia(dia.fecha, 'horasExtraDiurnas', event.target.value)}
													/>
												</label>
												<label className="text-xs text-ink/60">
													{dia.esDomingoOFestivo ? 'H. noct. dom/fest' : 'H. nocturnas'}
													<input
														type="text"
														inputMode="numeric"
														className="mt-0.5 w-full rounded-lg px-2 py-1.5 text-right text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
														value={dia.horasNocturnas || ''}
														placeholder="0"
														onChange={(event) => actualizarDia(dia.fecha, 'horasNocturnas', event.target.value)}
													/>
												</label>
												<label className="text-xs text-ink/60">
													{dia.esDomingoOFestivo ? 'H. extra noct. dom/fest' : 'H. extra nocturnas'}
													<input
														type="text"
														inputMode="numeric"
														className="mt-0.5 w-full rounded-lg px-2 py-1.5 text-right text-ink outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
														value={dia.horasExtraNocturnas || ''}
														placeholder="0"
														onChange={(event) => actualizarDia(dia.fecha, 'horasExtraNocturnas', event.target.value)}
													/>
												</label>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{resultado && (
				<div id="resultado-pago-por-horas">
					<div className="rounded-2xl bg-primary p-6 sm:p-10">
						<p className="font-serif text-3xl font-semibold leading-tight text-surface sm:text-4xl lg:text-5xl">
							Total a pagar: {currency.format(resultado.total)}
						</p>
						<p className="mt-4 text-base text-surface/80">
							Del {formatoCorto(fechaInicio)} al {formatoCorto(fechaFin)}, hora ordinaria pactada:{' '}
							{currency.format(resultado.horaOrdinaria)}.
						</p>
					</div>
					<ExportButtons targetId="resultado-pago-por-horas" title="Resultado de pago por horas" />

					{algunaSemanaSuperaLimite && (
						<p className="mt-4 rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
							Al menos una semana supera el límite legal de 12 horas extra semanales (CST artículo
							22, Ley 50 de 1990).
						</p>
					)}

					{resultado.semanas.map((semana) => (
						<div key={semana.inicio} className="mt-6 overflow-hidden rounded-2xl ring-1 ring-primary/10">
							<div className="flex items-center justify-between bg-primary/5 px-4 py-2.5">
								<p className="text-sm font-semibold text-ink">
									Semana del {formatoCorto(semana.inicio)} al {formatoCorto(semana.fin)}
								</p>
								<p className="text-sm font-semibold text-ink">{currency.format(semana.total)}</p>
							</div>
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
									{semana.filas
										.filter((fila) => fila.cantidad > 0)
										.map((fila) => (
											<tr key={fila.label}>
												<td className="px-4 py-3 text-ink">{fila.label}</td>
												<td className="px-4 py-3 text-right text-ink/70">{currency.format(fila.valorHora)}</td>
												<td className="px-4 py-3 text-right text-ink/70">{fila.cantidad}</td>
												<td className="px-4 py-3 text-right font-semibold text-ink">
													{currency.format(fila.subtotal)}
												</td>
											</tr>
										))}
									{semana.filas.every((fila) => fila.cantidad === 0) && (
										<tr>
											<td className="px-4 py-3 text-ink/50" colSpan={4}>
												Sin horas registradas esta semana.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					))}

					<div className="mt-4 flex items-center justify-between rounded-2xl bg-base px-4 py-3 ring-1 ring-primary/10">
						<p className="font-semibold text-ink">Total del periodo</p>
						<p className="font-semibold text-ink">{currency.format(resultado.total)}</p>
					</div>

					<p className="mt-8 text-sm text-ink/60">
						La hora ordinaria diurna no puede pactarse por debajo del mínimo legal (CST, artículos
						145 y 146). Recargo nocturno del 35% desde las 7:00pm hasta las 6:00am (Ley 2101 de
						2021); recargo dominical y festivo del 90% del valor de la hora ordinaria desde el 1 de
						julio de 2026 (Ley 2466 de 2025). El límite legal de horas extra es 2 al día y 12 a la
						semana (CST artículo 22, Ley 50 de 1990). Un trabajador contratado por horas también
						causa prestaciones sociales proporcionales (cesantías, prima, vacaciones) y aportes a
						seguridad social, que esta calculadora no incluye. Valores orientativos, no reemplazan
						la liquidación de nómina.
					</p>
				</div>
			)}
		</div>
	);
}
