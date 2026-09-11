// Tasas de usura certificadas trimestralmente por la Superintendencia Financiera de Colombia.
// TODO: actualizar cada trimestre con el certificado vigente (https://www.superfinanciera.gov.co).
export interface ModalidadCredito {
	id: string;
	label: string;
	tasaUsuraEA: number;
}

export const modalidadesCredito: ModalidadCredito[] = [
	{ id: 'consumo', label: 'Consumo y ordinario', tasaUsuraEA: 0.2577 },
	{ id: 'comercial', label: 'Comercial', tasaUsuraEA: 0.1554 },
	{ id: 'microcredito', label: 'Microcrédito', tasaUsuraEA: 0.3796 },
];
