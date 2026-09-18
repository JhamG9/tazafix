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
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function getSpreadsheetRows(clone: HTMLElement, title: string): string[][] {
	const rows: string[][] = [[title], []];
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
	if (rows.length === 2) {
		rows.push(...clone.innerText.split('\n').map((line) => [line.trim()]).filter(([line]) => line));
	}

	return rows;
}

export default function ExportButtons({ targetId, title }: Props) {
	const fileName = slugify(title);

	const handlePdf = () => {
		const clone = getResultClone(targetId);
		if (!clone) return;

		const printWindow = window.open('', '_blank', 'width=900,height=700');
		if (!printWindow) return;

		printWindow.document.write(`
			<!doctype html>
			<html lang="es">
			<head>
				<meta charset="utf-8" />
				<title>${title}</title>
				<style>
					body { color: #17213d; font-family: Arial, sans-serif; margin: 40px auto; max-width: 820px; }
					h1 { color: #2947b8; font-size: 24px; margin-bottom: 28px; }
					* { box-sizing: border-box; }
					.bg-primary { background: #2947b8 !important; color: white !important; padding: 24px; border-radius: 12px; }
					.bg-surface { background: white !important; border: 1px solid #dfe3ed; padding: 18px; border-radius: 12px; }
					p { line-height: 1.5; }
				</style>
			</head>
			<body><h1>${title}</h1>${clone.innerHTML}</body>
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

		const rows = getSpreadsheetRows(clone, title);
		const worksheet = XLSX.utils.aoa_to_sheet(rows);
		worksheet['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado');
		XLSX.writeFile(workbook, `${fileName}.xlsx`);
	};

	return (
		<div className="export-actions mb-5 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
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
	);
}
