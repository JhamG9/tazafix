import { useMemo, useState } from 'react';
import { currency, miles } from '../../lib/format';
import CalculatorHint from './CalculatorHint';
import ExportButtons from './ExportButtons';

const TASA_GMF = 0.004;

type TipoTransaccion = 'normal' | 'exenta';

export default function GravamenMovimientosCalculator() {
	const [montoInput, setMontoInput] = useState('');
	const [tipo, setTipo] = useState<TipoTransaccion>('normal');

	const monto = Number(montoInput.replace(/\D/g, '')) || 0;

	const { gmf, montoNeto } = useMemo(() => {
		if (tipo === 'exenta') {
			return { gmf: 0, montoNeto: monto };
		}
		const gmfCalculado = monto * TASA_GMF;
		return { gmf: gmfCalculado, montoNeto: monto - gmfCalculado };
	}, [monto, tipo]);

	const handleMontoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const digits = event.target.value.replace(/\D/g, '');
		setMontoInput(digits ? miles.format(Number(digits)) : '');
	};

	const esExenta = tipo === 'exenta';

	return (
		<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
			<div className="h-fit rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary/10">
				<CalculatorHint>indica cuánto vas a mover y si tu cuenta está marcada como exenta.</CalculatorHint>
				<div className="space-y-5">
					<div>
						<label htmlFor="monto" className="block text-sm font-medium text-ink">
							Monto de la transacción
						</label>
						<div className="mt-1 flex items-center rounded-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary">
							<span className="pl-3 text-ink/50">$</span>
							<input
								type="text"
								inputMode="numeric"
								id="monto"
								placeholder="1.000.000"
								className="w-full rounded-lg bg-transparent px-2 py-2.5 text-ink outline-none"
								value={montoInput}
								onChange={handleMontoChange}
							/>
						</div>
					</div>

					<div>
						<span className="block text-sm font-medium text-ink">Tipo de transacción</span>
						<div className="mt-1 flex flex-col gap-2">
							<label
								className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium ring-1 transition-colors ${
									tipo === 'normal'
										? 'bg-primary/10 text-ink ring-primary'
										: 'text-ink/70 ring-primary/20 hover:bg-primary/5'
								}`}
							>
								<input
									type="radio"
									value="normal"
									className="hidden"
									checked={tipo === 'normal'}
									onChange={() => setTipo('normal')}
								/>
								Retiro o transferencia normal
							</label>
							<label
								className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium ring-1 transition-colors ${
									tipo === 'exenta'
										? 'bg-primary/10 text-ink ring-primary'
										: 'text-ink/70 ring-primary/20 hover:bg-primary/5'
								}`}
							>
								<input
									type="radio"
									value="exenta"
									className="hidden"
									checked={tipo === 'exenta'}
									onChange={() => setTipo('exenta')}
								/>
								Cuenta de ahorros exenta
							</label>
						</div>
						{esExenta && (
							<p className="mt-2 text-xs text-ink/50">
								Cada persona puede marcar una cuenta de ahorros como exenta del 4x1000 ante su
								entidad financiera, hasta cierto tope mensual en UVT. Por encima de ese tope, el
								gravamen sí se cobra.
							</p>
						)}
					</div>
				</div>
			</div>

			<div id="resultado-4x1000">
				{esExenta ? (
					<div className="rounded-2xl bg-primary p-6 sm:p-8">
						<p className="text-sm font-medium text-surface/70">Resultado</p>
						<p className="mt-1 font-serif text-3xl font-semibold text-surface sm:text-4xl">
							Esta transacción no paga 4x1000
						</p>
					</div>
				) : (
					<div className="rounded-2xl bg-primary p-6 sm:p-8">
						<p className="text-sm font-medium text-surface/70">Resultado</p>
						<p className="mt-1 font-serif text-3xl font-semibold text-surface sm:text-4xl">
							Pagarías {currency.format(gmf)} de 4x1000 en esta transacción
						</p>
					</div>
				)}
				<ExportButtons targetId="resultado-4x1000" title="Resultado de calculadora 4x1000" />

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
							Monto de la transacción
						</p>
						<p className="mt-1 font-serif text-xl font-semibold text-ink">
							{currency.format(monto)}
						</p>
					</div>
					<div className="rounded-2xl bg-surface p-5 ring-1 ring-primary/10">
						<p className="text-xs font-medium uppercase tracking-wide text-ink/60">
							Monto neto después del 4x1000
						</p>
						<p className="mt-1 font-serif text-xl font-semibold text-ink">
							{currency.format(montoNeto)}
						</p>
					</div>
				</div>

				<p className="mt-4 text-sm text-ink/70">
					El 4x1000 es un impuesto que se cobra sobre movimientos bancarios como retiros y
					transferencias entre cuentas de distinto titular. La tarifa es del 0,4% y está fijada
					por ley.
				</p>
			</div>
		</div>
	);
}
