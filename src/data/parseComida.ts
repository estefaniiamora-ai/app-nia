/* ===========================================================
   "Cuéntame qué comiste" — entiende una frase escrita normal
   y la convierte en alimentos con sus gramos.

   Ejemplos que reconoce:
     "2 huevos, 1 arepa y un vaso de jugo"
     "media taza de arroz con pollo"
     "150 g de pechuga y una ensalada"

   Todo pasa aquí adentro, en el teléfono: no consulta internet.
   =========================================================== */

import { FOODS, macrosFor, type Food } from './foods'

export interface ItemDetectado {
  food: Food
  grams: number
  /** cómo se leyó ("2 × 1 huevo", "150 g") — solo para mostrárselo a ella */
  detalle: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface ResultadoComida {
  items: ItemDetectado[]
  /** trocitos de la frase que no se reconocieron */
  noEntendidos: string[]
}

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.;!?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Números escritos con letras. */
const NUMEROS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  medio: 0.5, media: 0.5, mitad: 0.5,
}

/** Unidades y con qué palabra de porción se corresponden. */
const UNIDADES: Record<string, string> = {
  g: 'GRAMOS', gr: 'GRAMOS', grs: 'GRAMOS', gramo: 'GRAMOS', gramos: 'GRAMOS',
  ml: 'GRAMOS', mililitro: 'GRAMOS', mililitros: 'GRAMOS', cc: 'GRAMOS',
  kg: 'KILOS', kilo: 'KILOS', kilos: 'KILOS',
  taza: 'taza', tazas: 'taza', pocillo: 'pocillo', pocillos: 'pocillo',
  vaso: 'vaso', vasos: 'vaso',
  cucharada: 'cucharada', cucharadas: 'cucharada', cda: 'cucharada', cdas: 'cucharada',
  tajada: 'tajada', tajadas: 'tajada', rebanada: 'tajada', rebanadas: 'tajada',
  rodaja: 'tajada', rodajas: 'tajada',
  porcion: 'porcion', porciones: 'porcion', plato: 'plato', platos: 'plato',
  puñado: 'puñado', punado: 'puñado', puñados: 'puñado', punados: 'puñado',
  lata: 'lata', latas: 'lata', scoop: 'scoop', scoops: 'scoop', medida: 'scoop',
  bola: 'bola', bolas: 'bola', paquete: 'paquete', paquetes: 'paquete',
  filete: 'filete', filetes: 'filete', bistec: 'bistec',
  unidad: 'UNIDAD', unidades: 'UNIDAD', pedazo: 'UNIDAD', pedazos: 'UNIDAD',
}

/** Palabras que no aportan nada y estorban al buscar. */
const RELLENO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'poco', 'poquito', 'algo', 'mi', 'mis'])

/** Todos los nombres posibles (nombre + otros nombres), del más largo al más corto
 *  para que "papas fritas" gane sobre "papa". */
const NOMBRES: { texto: string; food: Food }[] = FOODS.flatMap((f) => [
  { texto: normalizar(f.name), food: f },
  ...(f.alias ?? []).map((a) => ({ texto: normalizar(a), food: f })),
]).sort((a, b) => b.texto.length - a.texto.length)

/** Nombres que llevan "con" adentro (café con leche, pan con queso…): esos NO
 *  se deben partir por la palabra "con". */
const NOMBRES_CON = NOMBRES.filter((n) => n.texto.includes(' con '))

/** Parte la frase en trocitos: comas, "y", "más", saltos de línea. */
function trocear(texto: string): string[] {
  return normalizar(texto)
    .split(/\s*(?:,|\+|\by\b|\bmas\b|\btambien\b|\badema[s]?\b|\n)\s*/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Un trocito puede traer varias cosas unidas por "con" ("pan con queso").
 *  Se parte, salvo que sea un alimento que se llama así ("café con leche"). */
function subtrozos(trozo: string): string[] {
  if (!/ con /.test(trozo)) return [trozo]
  if (NOMBRES_CON.some((n) => trozo.includes(n.texto))) return [trozo]
  return trozo.split(/ con /).map((t) => t.trim()).filter(Boolean)
}

/** Lee un número: "2", "1,5", "1/2" o escrito con letras. */
function leerNumero(palabra: string): number | null {
  if (/^\d+(?:[.,]\d+)?$/.test(palabra)) return Number(palabra.replace(',', '.'))
  const frac = palabra.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  if (palabra in NUMEROS) return NUMEROS[palabra]
  return null
}

/** Cuántos gramos son "cantidad + unidad" de ese alimento. */
function gramosDe(food: Food, cantidad: number | null, unidad: string | null): { grams: number; detalle: string } {
  const porciones = food.portions ?? []
  const n = cantidad ?? 1

  if (unidad === 'GRAMOS') return { grams: Math.round(n), detalle: `${Math.round(n)} g` }
  if (unidad === 'KILOS') return { grams: Math.round(n * 1000), detalle: `${n} kg` }

  if (unidad && unidad !== 'UNIDAD') {
    const p = porciones.find((pz) => normalizar(pz.label).includes(unidad))
    if (p) return { grams: Math.round(p.grams * n), detalle: `${n} × ${p.label.replace(/^1 /, '')}` }
  }

  // Sin unidad pero con un número grande → seguro son gramos ("150 pollo").
  if (!unidad && cantidad !== null && cantidad >= 20) {
    return { grams: Math.round(cantidad), detalle: `${Math.round(cantidad)} g` }
  }

  const base = porciones[0]
  if (base) return { grams: Math.round(base.grams * n), detalle: `${n} × ${base.label.replace(/^1 /, '')}` }
  return { grams: Math.round(100 * n), detalle: `${Math.round(100 * n)} g` }
}

/** Lee un trocito de frase y devuelve el alimento que encontró (o null). */
function leerTrozo(trozo: string): ItemDetectado | null {
  const palabras = trozo.split(' ').filter(Boolean)
  let i = 0
  let cantidad: number | null = null
  let unidad: string | null = null

  // 1) el número del principio
  if (palabras[i] !== undefined) {
    const n = leerNumero(palabras[i])
    if (n !== null) {
      cantidad = n
      i++
    }
  }

  // 2) la unidad (taza, vaso, gramos…)
  if (palabras[i] !== undefined && palabras[i] in UNIDADES) {
    unidad = UNIDADES[palabras[i]]
    i++
    if (palabras[i] === 'de') i++
  }

  // 3) lo que queda es el nombre del alimento
  const resto = palabras.slice(i).filter((p) => !RELLENO.has(p)).join(' ')
  const donde = resto || trozo

  const encontrado = NOMBRES.find((n) => donde.includes(n.texto))
  if (!encontrado) return null

  const { grams, detalle } = gramosDe(encontrado.food, cantidad, unidad)
  if (grams <= 0) return null
  const m = macrosFor(encontrado.food, grams)
  return { food: encontrado.food, grams, detalle, ...m }
}

/** Lee toda la frase y devuelve los alimentos con sus nutrientes. */
export function parseComida(texto: string): ResultadoComida {
  const items: ItemDetectado[] = []
  const noEntendidos: string[] = []

  for (const trozo of trocear(texto)) {
    for (const pieza of subtrozos(trozo)) {
      const item = leerTrozo(pieza)
      if (item) items.push(item)
      else if (pieza.length > 2) noEntendidos.push(pieza)
    }
  }

  return { items, noEntendidos }
}
