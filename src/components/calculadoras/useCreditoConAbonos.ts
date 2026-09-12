import { useEffect, useMemo, useState } from 'react';
import {
	calcularCreditoConAbonos,
	type AbonoExtra,
	type ModoAbono,
	type ResultadoCreditoConAbonos,
} from '../../lib/credito';

export interface BaseCredito {
	monto: number;
	iMensual: number;
	n: number;
}

export interface UseCreditoConAbonosResult {
	abonos: AbonoExtra[];
	modoAbono: ModoAbono;
	setModoAbono: (modo: ModoAbono) => void;
	filaEditando: number | null;
	setFilaEditando: (mes: number | null) => void;
	abonoInputValor: string;
	setAbonoInputValor: (valor: string) => void;
	resultadoSinAbonos: ResultadoCreditoConAbonos | null;
	resultadoConAbonos: ResultadoCreditoConAbonos | null;
	ahorroIntereses: number;
	handleAgregarAbono: (mes: number) => void;
	handleQuitarAbono: (mes: number) => void;
}

// Encapsula el estado y los cálculos de abonos extra a capital para reutilizar la misma lógica
// entre las distintas calculadoras de crédito (cuota simple, hipotecario, etc.).
export function useCreditoConAbonos(baseCredito: BaseCredito | null): UseCreditoConAbonosResult {
	const [abonos, setAbonos] = useState<AbonoExtra[]>([]);
	const [modoAbono, setModoAbono] = useState<ModoAbono>('reducir-plazo');
	const [filaEditando, setFilaEditando] = useState<number | null>(null);
	const [abonoInputValor, setAbonoInputValor] = useState('');

	// Cada vez que se calcula un nuevo crédito se limpian los abonos simulados anteriormente.
	useEffect(() => {
		setAbonos([]);
		setModoAbono('reducir-plazo');
		setFilaEditando(null);
		setAbonoInputValor('');
	}, [baseCredito]);

	const resultadoSinAbonos = useMemo(
		() =>
			baseCredito
				? calcularCreditoConAbonos(baseCredito.monto, baseCredito.iMensual, baseCredito.n, [], 'reducir-plazo')
				: null,
		[baseCredito]
	);

	const resultadoConAbonos = useMemo(
		() =>
			baseCredito
				? calcularCreditoConAbonos(baseCredito.monto, baseCredito.iMensual, baseCredito.n, abonos, modoAbono)
				: null,
		[baseCredito, abonos, modoAbono]
	);

	const handleAgregarAbono = (mes: number) => {
		const monto = Number(abonoInputValor.replace(/\D/g, ''));
		if (monto > 0) {
			setAbonos((prev) => [...prev, { mes, monto }]);
		}
		setFilaEditando(null);
		setAbonoInputValor('');
	};

	const handleQuitarAbono = (mes: number) => {
		setAbonos((prev) => prev.filter((abono) => abono.mes !== mes));
	};

	const ahorroIntereses =
		resultadoSinAbonos && resultadoConAbonos
			? resultadoSinAbonos.interesTotal - resultadoConAbonos.interesTotal
			: 0;

	return {
		abonos,
		modoAbono,
		setModoAbono,
		filaEditando,
		setFilaEditando,
		abonoInputValor,
		setAbonoInputValor,
		resultadoSinAbonos,
		resultadoConAbonos,
		ahorroIntereses,
		handleAgregarAbono,
		handleQuitarAbono,
	};
}
