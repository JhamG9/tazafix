import { useState } from 'react';
import * as XLSX from 'xlsx';

interface Props {
	targetId: string;
	title: string;
}

function getResultClone(targetId: string): HTMLElement | null {
	const target = document.getElementById(targetId);
	if (!target) return null;

	const clone = target.cloneNode(true) as HTMLElement;
	clone.querySelectorAll('.export-actions').forEach((element) => element.remove());
	return clone;
}

function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function getSpreadsheetRows(clone: HTMLElement, title: string, nombre: string, empresa: string): string[][] {
	const rows: string[][] = [[title], []];
	const encabezado: string[][] = [];
	if (nombre) encabezado.push([`Preparado para: ${nombre}`]);
	if (empresa) encabezado.push([`Empresa: ${empresa}`]);
	if (encabezado.length > 0) rows.splice(1, 0, ...encabezado);
	const filasBase = rows.length;

	const tables = Array.from(clone.querySelectorAll('table'));

	if (tables.length > 0) {
		for (const table of tables) {
			for (const row of Array.from(table.querySelectorAll('tr'))) {
				const cells = Array.from(row.querySelectorAll('th, td')).map((cell) =>
					(cell.textContent ?? '').replace(/\s+/g, ' ').trim()
				);
				if (cells.some(Boolean)) rows.push(cells);
			}
		}
	}

	const summaryRows = Array.from(clone.querySelectorAll('dl, .bg-primary, .bg-surface'))
		.flatMap((block) => {
			const paragraphs = Array.from(block.querySelectorAll(':scope > p, :scope > dl > div'))
				.map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
				.filter(Boolean);
			return paragraphs.length > 0 ? [paragraphs] : [];
		});

	if (summaryRows.length > 0) rows.push([], ...summaryRows);
	if (rows.length === filasBase) {
		rows.push(...clone.innerText.split('\n').map((line) => [line.trim()]).filter(([line]) => line));
	}

	return rows;
}

const fechaEmision = new Intl.DateTimeFormat('es-CO', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
}).format(new Date());

const folio = () => Math.floor(100000 + Math.random() * 900000);

function escapeHtml(value: string): string {
	const div = document.createElement('div');
	div.textContent = value;
	return div.innerHTML;
}

// Alto disponible de una carta (11in) menos los márgenes de @page (0.5in arriba y abajo),
// en píxeles CSS de referencia (96px = 1in), para forzar que el certificado quepa en una sola
// página sin importar cuánto contenido tenga cada calculadora.
const ALTO_PAGINA_PX = 10 * 96;

export default function ExportButtons({ targetId, title }: Props) {
	const [nombre, setNombre] = useState('');
	const [empresa, setEmpresa] = useState('');
	const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);

	const fileName = slugify(title);

	const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const archivo = event.target.files?.[0];
		if (!archivo) {
			setLogoEmpresa(null);
			return;
		}
		const lector = new FileReader();
		lector.onload = () => setLogoEmpresa(typeof lector.result === 'string' ? lector.result : null);
		lector.readAsDataURL(archivo);
	};

	const handlePdf = () => {
		const clone = getResultClone(targetId);
		if (!clone) return;

		const printWindow = window.open('', '_blank', 'width=900,height=700');
		if (!printWindow) return;

		const nombreLimpio = nombre.trim();
		const empresaLimpia = empresa.trim();

		printWindow.document.write(`
			<!doctype html>
			<html lang="es">
			<head>
				<meta charset="utf-8" />
				<title>${title}</title>
				<style>
					@page { size: letter; margin: 0.5in; }
					* { box-sizing: border-box; }
					html, body {
						color: #17213d;
						font-family: Arial, Helvetica, sans-serif;
						margin: 0;
						background: #ffffff;
					}
					body { padding: 0.4in 0.15in; }
					.pagina {
						max-width: 7.5in;
						margin: 0 auto;
						overflow: hidden;
					}
					.certificado {
						background: #ffffff;
						padding: 0;
						transform-origin: top center;
					}
					.logo-empresa {
						max-height: 64px;
						max-width: 260px;
						object-fit: contain;
						margin-bottom: 6px;
					}
					.membrete {
						min-height: 48px;
						display: flex;
						align-items: center;
						justify-content: center;
						margin-top: 30px;
					}
					.membrete-vacio {
						width: 100%;
						height: 100%;
						min-height: 56px;
						border: 1px dashed #c7cbe0;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.membrete-vacio span {
						font-size: 10px;
						letter-spacing: 0.08em;
						text-transform: uppercase;
						color: #b8bccb;
					}
					.membrete-empresa {
						font-family: Georgia, 'Times New Roman', serif;
						font-size: 20px;
						font-weight: 700;
						color: #17213d;
						text-align: center;
						letter-spacing: 0.02em;
					}
					.marca {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 10px;
						margin-bottom: 4px;
					}
					.marca img { height: 34px; width: auto; object-fit: contain; mix-blend-mode: multiply; }
					.marca span { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 19px; color: #1F3A8A; }
					.marca span em { color: #7628C9; font-style: normal; }
					.marca-final {
						margin-top: 18px;
						opacity: 0.55;
						transform: scale(0.7);
						transform-origin: center;
					}
					.marca-final span { font-size: 15px; }
					.eyebrow {
						text-align: center;
						font-size: 11px;
						letter-spacing: 0.18em;
						text-transform: uppercase;
						color: #7d8296;
						margin: 4px 0 18px;
					}
					h1 {
						font-family: Georgia, 'Times New Roman', serif;
						color: #17213d;
						font-size: 26px;
						text-align: center;
						margin: 0 0 6px;
						line-height: 1.25;
					}
					.preparado-para {
						text-align: center;
						font-size: 15px;
						font-weight: 600;
						color: #2947b8;
						margin: 0 0 4px;
					}
					.subtitulo {
						text-align: center;
						font-size: 13px;
						color: #5b6072;
						margin: 0 0 22px;
					}
					.divisor {
						border: none;
						border-top: 1px solid #dfe3ed;
						margin: 0 0 28px;
					}
					.contenido p { line-height: 1.5; }
					.bg-primary { background: #2947b8 !important; color: white !important; padding: 20px; border-radius: 2px; }
					.bg-surface { background: #fafbfd !important; border: 1px solid #dfe3ed; padding: 16px; border-radius: 2px; }
					table { width: 100%; border-collapse: collapse; }
					table th, table td { border: 1px solid #dfe3ed; padding: 6px 8px; text-align: left; }
					.pie {
						margin-top: 32px;
						padding-top: 16px;
						border-top: 1px solid #dfe3ed;
					}
					.pie-texto { font-size: 11px; line-height: 1.6; color: #7d8296; text-align: center; margin: 0 auto; max-width: 560px; }
					.pie-texto strong { color: #17213d; }
					.validacion {
						margin-top: 14px;
						text-align: center;
						font-size: 10px;
						letter-spacing: 0.1em;
						text-transform: uppercase;
						color: #2947b8;
					}
					.folio { text-align: center; font-size: 10px; color: #b8bccb; margin-top: 8px; letter-spacing: 0.05em; }
				</style>
			</head>
			<body>
				<div class="certificado">
					<p class="eyebrow">Constancia de cálculo</p>
					<h1>${title}</h1>
					${nombreLimpio ? `<p class="preparado-para">Preparado para: ${escapeHtml(nombreLimpio)}</p>` : ''}
					<p class="subtitulo">Emitido el ${fechaEmision}</p>
					<hr class="divisor" />
					<div class="contenido">${clone.innerHTML}</div>
					<div class="pie">
						<p class="pie-texto">
							<strong>Documento generado automáticamente</strong> por Cifras y Finanzas a partir de
							los datos ingresados por el usuario. Es una herramienta orientativa y no constituye
							un cálculo legal, contable o tributario certificado.
						</p>
						<p class="validacion">Cifras y Finanzas · Resultado verificado</p>
					</div>
					<p class="folio">Folio N.° ${folio()}</p>
					<div class="membrete">
						${
							empresaLimpia
								? `<p class="membrete-empresa">${escapeHtml(empresaLimpia)}</p>`
								: '<div class="membrete-vacio"><span>Espacio para membrete o logo de la empresa</span></div>'
						}
					</div>
					<div class="marca marca-final">
						<img src="/logo.svg" alt="" />
						<span>Cifras <em>y Finanzas</em></span>
					</div>
				</div>
			</body>
			</html>
		`);
		printWindow.document.close();
		printWindow.onafterprint = () => printWindow.close();
		printWindow.focus();
		setTimeout(() => printWindow.print(), 300);
	};

	const handleExcel = () => {
		const clone = getResultClone(targetId);
		if (!clone) return;

		const rows = getSpreadsheetRows(clone, title, nombre.trim(), empresa.trim());
		const worksheet = XLSX.utils.aoa_to_sheet(rows);
		worksheet['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado');
		XLSX.writeFile(workbook, `${fileName}.xlsx`);
	};

	return (
		<div className="export-actions mb-5 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/80 p-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold text-ink">Guardar este resultado</p>
					<p className="text-xs text-ink/55">PDF para compartir · Excel para analizar</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={handlePdf}
						aria-label={`Guardar ${title} como PDF`}
						className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary/90"
					>
						↓ Guardar PDF
					</button>
					<button
						type="button"
						onClick={handleExcel}
						aria-label={`Exportar ${title} a Excel`}
						className="rounded-lg bg-[#217346] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#185c37]"
					>
						↓ Guardar Excel
					</button>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label htmlFor={`nombre-${targetId}`} className="block text-xs font-medium text-ink/60">
						Nombre de la persona (opcional, aparece en el PDF)
					</label>
					<input
						type="text"
						id={`nombre-${targetId}`}
						value={nombre}
						onChange={(event) => setNombre(event.target.value)}
						placeholder="Ej: Juan Pérez"
						className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-ink outline-none ring-1 ring-ink/15 focus:ring-2 focus:ring-primary"
					/>
				</div>
				<div>
					<label htmlFor={`empresa-${targetId}`} className="block text-xs font-medium text-ink/60">
						Nombre de la empresa (opcional, deja espacio de membrete)
					</label>
					<input
						type="text"
						id={`empresa-${targetId}`}
						value={empresa}
						onChange={(event) => setEmpresa(event.target.value)}
						placeholder="Ej: Mi Empresa S.A.S."
						className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-ink outline-none ring-1 ring-ink/15 focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>
		</div>
	);
}
