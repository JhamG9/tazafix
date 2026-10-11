import { existsSync } from 'node:fs';
import { type CollectionEntry, getCollection } from 'astro:content';

export type Articulo = CollectionEntry<'aprende'>;

// El orden de esta lista es el orden en que se muestran las categorías en todo el sitio.
// El `slug` debe coincidir con el campo `category` de los artículos y con su carpeta en src/content/aprende.
export const categoriasBlog = [
	{ slug: 'vivienda', nombre: 'Vivienda', descripcion: 'Comprar, arrendar, subsidios y crédito hipotecario.' },
	{ slug: 'creditos', nombre: 'Créditos', descripcion: 'Tasas, tarjetas, deudas y tu historial en las centrales de riesgo.' },
	{ slug: 'ahorro', nombre: 'Ahorro', descripcion: 'Presupuesto, fondo de emergencia, CDT e interés compuesto.' },
	{ slug: 'empresa', nombre: 'Empresa', descripcion: 'Nómina, prestaciones, recargos y liquidaciones de empleados.' },
];

export type CategoriaBlog = (typeof categoriasBlog)[number];

export const urlArticulo = (articulo: Articulo) => `/aprende/${articulo.id}/`;
export const urlCategoria = (slug: string) => `/aprende/${slug}/`;

// Solo mostramos la foto si el archivo ya está en public/, para no dejar imágenes rotas.
export const tieneImagen = (articulo: Articulo) =>
	Boolean(articulo.data.image && existsSync(`public${articulo.data.image}`));

const ordenCategoria = (slug: string) => {
	const indice = categoriasBlog.findIndex((categoria) => categoria.slug === slug);
	return indice === -1 ? categoriasBlog.length : indice;
};

// Todos los artículos, agrupados por el orden de categorías y luego por título.
export async function getArticulos() {
	const articulos = await getCollection('aprende');
	return articulos.sort(
		(a, b) =>
			ordenCategoria(a.data.category) - ordenCategoria(b.data.category) ||
			a.data.title.localeCompare(b.data.title, 'es')
	);
}

export const articulosDeCategoria = (articulos: Articulo[], slug: string) =>
	articulos.filter((articulo) => articulo.data.category === slug);

// Toma artículos alternando entre categorías, para que una selección corta no quede toda de un tema.
export function mezclarPorCategoria(articulos: Articulo[], limite: number) {
	const grupos = categoriasBlog.map((categoria) => articulosDeCategoria(articulos, categoria.slug));
	const resultado: Articulo[] = [];
	for (let ronda = 0; resultado.length < limite && grupos.some((grupo) => grupo.length > ronda); ronda++) {
		for (const grupo of grupos) {
			if (grupo[ronda] && resultado.length < limite) resultado.push(grupo[ronda]);
		}
	}
	return resultado;
}

const enlazaA = (articulo: Articulo, calculadora: string) =>
	Boolean(articulo.body?.includes(`/calculadoras/${calculadora}/`));

// Recomendados para una calculadora: primero los artículos que enlazan a ella y, si faltan, los que
// enlazan a sus calculadoras relacionadas (en el mismo orden de cercanía que `relacionadas`).
export function articulosParaCalculadora(
	articulos: Articulo[],
	calculadora: string,
	relacionadas: string[],
	limite = 3
) {
	const resultado: Articulo[] = [];
	for (const destino of [calculadora, ...relacionadas]) {
		for (const articulo of articulos) {
			if (resultado.length >= limite) return resultado;
			if (enlazaA(articulo, destino) && !resultado.includes(articulo)) resultado.push(articulo);
		}
	}
	return resultado;
}
