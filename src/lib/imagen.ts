/* ===========================================================
   Fotos de la ropa.
   Las fotos del celular pesan varios MB; aquí se achican y se
   comprimen para que quepan y no gasten datos.
   =========================================================== */

/** Lado más largo de la foto guardada (píxeles). */
const LADO_MAX = 560
/** Calidad del JPEG (0 a 1). */
const CALIDAD = 0.7

/**
 * Recibe la foto que ella eligió y devuelve una versión chiquita
 * lista para guardar (dataURL). Recorta al centro en formato retrato.
 */
export function comprimirFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        // recorte centrado en proporción 3:4 (retrato, como se ve la ropa)
        const proporcion = 3 / 4
        let sw = img.width
        let sh = img.height
        if (sw / sh > proporcion) sw = Math.round(sh * proporcion)
        else sh = Math.round(sw / proporcion)
        const sx = Math.round((img.width - sw) / 2)
        const sy = Math.round((img.height - sh) / 2)

        const escala = Math.min(1, LADO_MAX / sh)
        const w = Math.max(1, Math.round(sw * escala))
        const h = Math.max(1, Math.round(sh * escala))

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('sin canvas')
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', CALIDAD))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la foto'))
    }
    img.src = url
  })
}

/** Cuánto pesa (aprox, en KB) una foto guardada en dataURL. */
export function pesoKB(dataUrl: string): number {
  return Math.round((dataUrl.length * 0.75) / 1024)
}
