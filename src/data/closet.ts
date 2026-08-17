/* ===========================================================
   Mi Clóset — colores, tipos de prenda y el "armador de outfits".

   Las sugerencias se calculan aquí mismo en el teléfono, con
   reglas sencillas de combinación (neutros, mismo color, parejas
   que se ven bien). Nada de internet.
   =========================================================== */

import type { Garment, GarmentKind, GarmentStyle, GarmentWeather } from './types'

export const TIPOS: { key: GarmentKind; label: string; emoji: string }[] = [
  { key: 'top', label: 'Blusa / camiseta', emoji: '👚' },
  { key: 'bottom', label: 'Pantalón / falda', emoji: '👖' },
  { key: 'vestido', label: 'Vestido / enterizo', emoji: '👗' },
  { key: 'zapatos', label: 'Zapatos', emoji: '👟' },
  { key: 'abrigo', label: 'Chaqueta / abrigo', emoji: '🧥' },
  { key: 'accesorio', label: 'Accesorio', emoji: '👜' },
]

export const ESTILOS: { key: GarmentStyle; label: string; emoji: string }[] = [
  { key: 'casual', label: 'Casual', emoji: '🙂' },
  { key: 'comodo', label: 'Cómodo', emoji: '🛋️' },
  { key: 'elegante', label: 'Elegante', emoji: '✨' },
  { key: 'oficina', label: 'Oficina', emoji: '💼' },
  { key: 'deportivo', label: 'Deportivo', emoji: '🏃‍♀️' },
  { key: 'salir', label: 'Para salir', emoji: '🌙' },
  { key: 'rave', label: 'Rave', emoji: '🔊' },
  { key: 'playa', label: 'Playa', emoji: '🏖️' },
  { key: 'tumblr', label: 'Tumblr', emoji: '🎧' },
  { key: 'aesthetic', label: 'Aesthetic', emoji: '🤍' },
  { key: 'coquette', label: 'Coquette', emoji: '🎀' },
  { key: 'y2k', label: 'Y2K', emoji: '💿' },
]

export const CLIMAS: { key: GarmentWeather; label: string; emoji: string }[] = [
  { key: 'calor', label: 'Calorcito', emoji: '☀️' },
  { key: 'templado', label: 'Normal', emoji: '⛅' },
  { key: 'frio', label: 'Frío', emoji: '🧊' },
]

export interface ColorPrenda {
  key: string
  label: string
  hex: string
  /** los neutros combinan con todo */
  neutro?: boolean
}

export const COLORES: ColorPrenda[] = [
  { key: 'negro', label: 'Negro', hex: '#2c2a30', neutro: true },
  { key: 'blanco', label: 'Blanco', hex: '#fbf9f7', neutro: true },
  { key: 'gris', label: 'Gris', hex: '#a9a7b0', neutro: true },
  { key: 'beige', label: 'Beige', hex: '#e6d6c0', neutro: true },
  { key: 'cafe', label: 'Café', hex: '#8a5f42', neutro: true },
  { key: 'denim', label: 'Jean', hex: '#5b7fa6', neutro: true },
  { key: 'rosado', label: 'Rosado', hex: '#ff9dc4' },
  { key: 'rojo', label: 'Rojo', hex: '#e0556b' },
  { key: 'vinotinto', label: 'Vinotinto', hex: '#8c2f45' },
  { key: 'naranja', label: 'Naranja', hex: '#ff9a4d' },
  { key: 'amarillo', label: 'Amarillo', hex: '#ffcf5a' },
  { key: 'verde', label: 'Verde', hex: '#7bc48c' },
  { key: 'azul', label: 'Azul', hex: '#6aa9e0' },
  { key: 'morado', label: 'Morado', hex: '#a985d6' },
  { key: 'estampado', label: 'Estampado', hex: 'linear-gradient(135deg,#ff9dc4,#ffcf5a,#7bc48c)' },
]

export function colorDe(key: string): ColorPrenda {
  return COLORES.find((c) => c.key === key) ?? COLORES[0]
}

export function tipoDe(key: GarmentKind) {
  return TIPOS.find((t) => t.key === key) ?? TIPOS[0]
}

/** Parejas de colores que se ven lindas juntas (además de los neutros). */
const PAREJAS: [string, string][] = [
  ['rosado', 'azul'],
  ['rosado', 'verde'],
  ['rosado', 'vinotinto'],
  ['rojo', 'azul'],
  ['azul', 'amarillo'],
  ['azul', 'naranja'],
  ['verde', 'amarillo'],
  ['verde', 'naranja'],
  ['morado', 'amarillo'],
  ['morado', 'rosado'],
  ['vinotinto', 'rosado'],
  ['naranja', 'amarillo'],
]

/** ¿Estos dos colores combinan? Devuelve un puntaje de 0 a 3. */
export function combinan(a: string, b: string): number {
  if (!a || !b) return 1
  const ca = colorDe(a)
  const cb = colorDe(b)
  if (a === b) return a === 'estampado' ? 0 : 2 // dos estampados juntos: mejor no
  if (a === 'estampado' || b === 'estampado') return ca.neutro || cb.neutro ? 3 : 1
  if (ca.neutro && cb.neutro) return 3
  if (ca.neutro || cb.neutro) return 3
  if (PAREJAS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 2
  return 0
}

export interface OutfitSugerido {
  garments: Garment[]
  puntaje: number
}

export interface OpcionesSugerencia {
  estilo?: GarmentStyle
  clima?: GarmentWeather
  /** ids de prendas usadas hace poquito (para no repetir) */
  usadasHacePoco?: string[]
  /** cuántas sugerencias devolver */
  cuantas?: number
}

function sirve(g: Garment, o: OpcionesSugerencia): boolean {
  if (g.archived) return false
  if (o.estilo && g.styles.length && !g.styles.includes(o.estilo)) return false
  if (o.clima && g.weather && g.weather !== o.clima) return false
  return true
}

/** Mezcla una lista (para que las sugerencias no salgan siempre iguales). */
function revolver<T>(lista: T[]): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Arma outfits con la ropa que ella subió.
 * Un outfit = (blusa + pantalón) o (vestido), + zapatos, y si hace frío un abrigo.
 */
export function sugerirOutfits(prendas: Garment[], opciones: OpcionesSugerencia = {}): OutfitSugerido[] {
  const cuantas = opciones.cuantas ?? 4
  const recientes = new Set(opciones.usadasHacePoco ?? [])
  const utiles = prendas.filter((g) => sirve(g, opciones))

  const tops = revolver(utiles.filter((g) => g.kind === 'top'))
  const bottoms = revolver(utiles.filter((g) => g.kind === 'bottom'))
  const vestidos = revolver(utiles.filter((g) => g.kind === 'vestido'))
  const zapatos = revolver(utiles.filter((g) => g.kind === 'zapatos'))
  const abrigos = revolver(utiles.filter((g) => g.kind === 'abrigo'))
  const accesorios = revolver(utiles.filter((g) => g.kind === 'accesorio'))

  const candidatos: OutfitSugerido[] = []

  const puntoExtra = (g: Garment) => (g.favorite ? 1 : 0) - (recientes.has(g.id) ? 5 : 0)

  /** ¿Estas dos prendas sirven para la misma ocasión? (no mezclar gym con elegante) */
  function mismoRollo(a: Garment, b: Garment): number {
    if (!a.styles.length || !b.styles.length) return 0
    return a.styles.some((e) => b.styles.includes(e)) ? 1.5 : -3
  }

  /** Le pone zapatos, abrigo y accesorio a una base ya armada. */
  function completar(base: Garment[], puntajeBase: number) {
    const colorBase = base.map((g) => g.color)
    let mejorZapato: Garment | null = null
    let mejorZapatoPts = -99
    for (const z of zapatos) {
      const pts =
        Math.min(...colorBase.map((c) => combinan(c, z.color))) +
        Math.min(...base.map((g) => mismoRollo(g, z))) +
        puntoExtra(z) +
        Math.random() * 0.4
      if (pts > mejorZapatoPts) {
        mejorZapatoPts = pts
        mejorZapato = z
      }
    }

    const piezas = [...base]
    let puntaje = puntajeBase
    if (mejorZapato) {
      piezas.push(mejorZapato)
      puntaje += mejorZapatoPts
    }

    if (opciones.clima === 'frio' && abrigos.length) {
      const ab = abrigos.find((a) => combinan(a.color, colorBase[0]) >= 2) ?? abrigos[0]
      piezas.push(ab)
      puntaje += combinan(ab.color, colorBase[0]) + puntoExtra(ab)
    }

    if (accesorios.length && Math.random() > 0.45) {
      const ac = accesorios.find((a) => combinan(a.color, colorBase[0]) >= 2) ?? accesorios[0]
      piezas.push(ac)
      puntaje += 0.5
    }

    candidatos.push({ garments: piezas, puntaje })
  }

  // vestidos: ya son un outfit completo
  for (const v of vestidos) {
    completar([v], 3 + puntoExtra(v) + Math.random() * 0.5)
  }

  // blusa + pantalón
  for (const t of tops) {
    for (const b of bottoms) {
      const c = combinan(t.color, b.color)
      if (c === 0) continue
      completar(
        [t, b],
        c * 2 + mismoRollo(t, b) + puntoExtra(t) + puntoExtra(b) + Math.random() * 0.5,
      )
    }
  }

  // los mejores primero, sin repetir la misma pareja principal
  const vistos = new Set<string>()
  return candidatos
    .sort((a, b) => b.puntaje - a.puntaje)
    .filter((o) => {
      const clave = o.garments
        .filter((g) => g.kind !== 'accesorio')
        .map((g) => g.id)
        .sort()
        .join('|')
      if (vistos.has(clave)) return false
      vistos.add(clave)
      return true
    })
    .slice(0, cuantas)
}

/** Qué le falta al clóset para poder sugerir outfits. */
export function queFalta(prendas: Garment[]): string | null {
  const vivas = prendas.filter((g) => !g.archived)
  const hay = (k: GarmentKind) => vivas.some((g) => g.kind === k)
  if (vivas.length === 0) return 'Sube tus primeras prendas 💗'
  if (!hay('vestido') && !(hay('top') && hay('bottom')))
    return 'Te falta subir blusas y pantalones (o un vestido) para poder armar outfits'
  if (!hay('zapatos')) return 'Sube unos zapaticos y los outfits quedan completos 👟'
  return null
}
