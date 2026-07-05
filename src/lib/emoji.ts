/** Toma el ÚLTIMO emoji/carácter completo escrito, respetando emojis
 *  combinados (tono de piel, ZWJ como 👩‍💻, banderas, etc.).
 *  Así el usuario puede elegir CUALQUIER emoji del teclado del celular. */
export function lastEmoji(input: string): string {
  if (!input) return ''
  try {
    // Intl.Segmenter agrupa cada emoji (aunque sea combinado) como 1 "grapheme".
    const Seg = (Intl as unknown as { Segmenter?: any }).Segmenter
    if (Seg) {
      const seg = new Seg(undefined, { granularity: 'grapheme' })
      const graphemes = Array.from(seg.segment(input.trim()), (s: any) => s.segment as string)
      return graphemes.length ? graphemes[graphemes.length - 1] : ''
    }
  } catch {
    /* fallback abajo */
  }
  const arr = Array.from(input.trim())
  return arr.length ? arr[arr.length - 1] : ''
}
