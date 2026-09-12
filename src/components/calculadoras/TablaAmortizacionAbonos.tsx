import type { AbonoExtra, ModoAbono, ResultadoCreditoConAbonos } from '../../lib/credito';
import { currency, miles } from '../../lib/format';

interface TablaAmortizacionAbonosProps {
	resultadoConAbonos: ResultadoCreditoConAbonos;
	resultadoSinAbonos: ResultadoCreditoConAbonos | null;
	abonos: AbonoExtra[];
	modoAbono: ModoAbono;
	onModoAbonoChange: (modo: ModoAbono) => void;
	filaEditando: number | null;
	onFilaEditandoChange: (mes: number | null) => void;
	abonoInputValor: string;
	onAbonoInputValorChange: (valor: string) => void;
	onAgregarAbono: (mes: number) => void;
	onQuitarAbono: (mes: number) => void;
	ahorroIntereses: number;
	notaPie?: string;
}

// Tabla de amortización interactiva compartida entre las calculadoras de crédito: permite
// simular abonos extra a capital haciendo clic en cualquier mes y compara el resultado con y
// sin abonos.
export default function TablaAmortizacionAbonos({
	resultadoConAbonos,
	resultadoSinAbonos,
	abonos,
	modoAbono,
	onModoAbonoChange,
	filaEditando,
	onFilaEditandoChange,
	abonoInputValor,
	onAbonoInputValorChange,
	onAgregarAbono,
	onQuitarAbono,
	ahorroIntereses,
	notaPie,
}: TablaAmortizacionAbonosProps) {
	return (
		<>
			{abonos.length > 0 && resultadoSinAbonos && (
				<div className="mt-8 rounded-2xl bg-primary p-6 shadow-sm sm:p-8">
					<p className="text-sm font-medium text-surface/70">Impacto de tus abonos a capital</p>
					<div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-surface/50">
								Sin abonos
							</p>
							<p className="mt-1 font-serif text-2xl font-semibold text-surface/80">
								Mes {resultadoSinAbonos.mesesFinales}
							</p>
							<p className="text-sm text-surface/60">
								Interés total {currency.format(resultadoSinAbonos.interesTotal)}
							</p>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-surface/70">
								Con tus abonos
							</p>
							<p className="mt-1 font-serif text-3xl font-semibold text-surface sm:text-4xl">
								Mes {resultadoConAbonos.mesesFinales}
							</p>
							<p className="text-sm text-surface/80">
								Interés total {currency.format(resultadoConAbonos.interesTotal)}
							</p>
						</div>
					</div>
					<p className="mt-6 font-serif text-3xl font-semibold text-positive sm:text-4xl">
						Ahorro: {currency.format(ahorroIntereses)}
					</p>
					{resultadoConAbonos.mesesFinales < resultadoSinAbonos.mesesFinales && (
						<p className="mt-1 text-sm text-surface/70">
							Terminas de pagar {resultadoSinAbonos.mesesFinales - resultadoConAbonos.mesesFinales}{' '}
							meses antes.
						</p>
					)}
				</div>
			)}

			<div className="mt-10 rounded-2xl bg-surface p-6 ring-1 ring-primary/10 sm:p-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
						Al agregar un abono a capital, ¿qué prefieres?
					</h3>
					<div className="inline-flex w-fit rounded-lg bg-base p-1 ring-1 ring-primary/10">
						<button
							type="button"
							onClick={() => onModoAbonoChange('reducir-plazo')}
							className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								modoAbono === 'reducir-plazo' ? 'bg-primary text-surface' : 'text-ink/70'
							}`}
						>
							Reducir plazo
						</button>
						<button
							type="button"
							onClick={() => onModoAbonoChange('reducir-cuota')}
							className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								modoAbono === 'reducir-cuota' ? 'bg-primary text-surface' : 'text-ink/70'
							}`}
						>
							Reducir cuota
						</button>
					</div>
				</div>

				{abonos.length === 0 && (
					<p className="mt-3 text-base text-ink/70">
						Haz clic en cualquier mes de la tabla para simular un abono a capital ese mes.
					</p>
				)}
			</div>

			<div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-primary/10">
				<div className="max-h-[28rem] overflow-auto">
					<table className="w-full min-w-[46rem] text-sm">
						<thead className="sticky top-0 bg-primary text-surface">
							<tr>
								<th className="px-3 py-3 text-center font-medium">Mes</th>
								<th className="px-3 py-3 text-right font-medium">Cuota</th>
								<th className="px-3 py-3 text-right font-medium">Saldo inicial</th>
								<th className="px-3 py-3 text-right font-medium">Interés</th>
								<th className="px-3 py-3 text-right font-medium">Capital</th>
								<th className="px-3 py-3 text-right font-medium">Saldo final</th>
								<th className="px-3 py-3 text-right font-medium">Abono</th>
							</tr>
						</thead>
						<tbody className="bg-surface text-ink">
							{resultadoConAbonos.tablaAmortizacion.map((fila) => {
								const tieneAbono = fila.abono > 0;
								const editando = filaEditando === fila.mes;

								return (
									<tr
										key={fila.mes}
										onClick={() => {
											if (!tieneAbono) {
												onFilaEditandoChange(editando ? null : fila.mes);
												onAbonoInputValorChange('');
											}
										}}
										className={`border-b border-primary/10 last:border-0 even:bg-base/50 ${
											tieneAbono ? '' : 'cursor-pointer hover:bg-primary/5'
										}`}
									>
										<td
											className={`px-3 py-2 text-center ${
												tieneAbono ? 'border-l-4 border-positive' : ''
											}`}
										>
											{fila.mes}
										</td>
										<td className="px-3 py-2 text-right">{currency.format(fila.cuota)}</td>
										<td className="px-3 py-2 text-right">{currency.format(fila.saldoInicial)}</td>
										<td className="px-3 py-2 text-right">{currency.format(fila.interes)}</td>
										<td className="px-3 py-2 text-right">{currency.format(fila.capital)}</td>
										<td className="px-3 py-2 text-right">{currency.format(fila.saldoFinal)}</td>
										<td className="px-3 py-2 text-right">
											{tieneAbono ? (
												<span
													className="inline-flex items-center gap-2"
													onClick={(event) => event.stopPropagation()}
												>
													<span className="font-medium text-positive">
														{currency.format(fila.abono)}
													</span>
													<button
														type="button"
														onClick={() => onQuitarAbono(fila.mes)}
														className="text-xs text-alert hover:underline"
													>
														Quitar
													</button>
												</span>
											) : editando ? (
												<span
													className="inline-flex items-center gap-1"
													onClick={(event) => event.stopPropagation()}
												>
													<input
														autoFocus
														type="text"
														inputMode="numeric"
														value={abonoInputValor}
														placeholder="$"
														onChange={(event) => {
															const digits = event.target.value.replace(/\D/g, '');
															onAbonoInputValorChange(digits ? miles.format(Number(digits)) : '');
														}}
														onKeyDown={(event) => {
															if (event.key === 'Enter') {
																event.preventDefault();
																onAgregarAbono(fila.mes);
															}
															if (event.key === 'Escape') {
																onFilaEditandoChange(null);
															}
														}}
														className="w-24 rounded-md px-2 py-1 text-right text-ink outline-none ring-1 ring-primary/30 focus:ring-2 focus:ring-primary"
													/>
													<button
														type="button"
														onClick={() => onAgregarAbono(fila.mes)}
														className="text-xs font-medium text-primary hover:underline"
													>
														Agregar
													</button>
												</span>
											) : (
												<span className="text-ink/30">—</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				{notaPie && <p className="bg-surface px-3 py-2 text-xs text-ink/50">{notaPie}</p>}
			</div>
		</>
	);
}
