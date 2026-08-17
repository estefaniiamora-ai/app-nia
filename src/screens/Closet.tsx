import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/store'
import Sheet from '../components/ui/Sheet'
import Cat from '../components/Cat/Cat'
import { comprimirFoto } from '../lib/imagen'
import { localDayKey, daysBetween } from '../lib/date'
import {
  CLIMAS,
  COLORES,
  ESTILOS,
  TIPOS,
  colorDe,
  queFalta,
  sugerirOutfits,
  tipoDe,
  type OutfitSugerido,
} from '../data/closet'
import type { Garment, GarmentKind, GarmentStyle, GarmentWeather, Outfit } from '../data/types'
import './Closet.css'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Los 7 días (lunes a domingo) de la semana con el desplazamiento dado. */
function semanaDe(offset: number): string[] {
  const hoy = new Date()
  const dow = (hoy.getDay() + 6) % 7 // 0 = lunes
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - dow + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return localDayKey(d.getTime())
  })
}

function etiquetaSemana(offset: number): string {
  if (offset === 0) return 'Esta semana'
  if (offset === 1) return 'La próxima'
  if (offset === -1) return 'La pasada'
  return offset > 0 ? `En ${offset} semanas` : `Hace ${-offset} semanas`
}

type Pestana = 'semana' | 'ropa'

export default function Closet() {
  const {
    garments,
    garmentsLoaded,
    loadGarments,
    addGarment,
    updateGarment,
    deleteGarment,
    outfits,
    addOutfit,
    updateOutfit,
    deleteOutfit,
  } = useApp()
  const navigate = useNavigate()
  const [pestana, setPestana] = useState<Pestana>('semana')
  const [offset, setOffset] = useState(0)
  const [editandoPrenda, setEditandoPrenda] = useState<Garment | null>(null)
  const [creandoPrenda, setCreandoPrenda] = useState(false)
  const [diaElegido, setDiaElegido] = useState<string | null>(null)

  useEffect(() => {
    loadGarments()
  }, [loadGarments])

  const dias = useMemo(() => semanaDe(offset), [offset])
  const vivas = useMemo(() => garments.filter((g) => !g.archived), [garments])
  const falta = queFalta(garments)

  const outfitDe = (fecha: string) => outfits.find((o) => o.date === fecha)
  const prendaDe = (id: string) => garments.find((g) => g.id === id)

  /** Prendas usadas en los últimos 10 días (para no repetir tanto). */
  const usadasHacePoco = useMemo(() => {
    const hoy = localDayKey()
    return outfits
      .filter((o) => Math.abs(daysBetween(o.date, hoy)) <= 10)
      .flatMap((o) => o.garmentIds)
  }, [outfits])

  /** Le pone un outfit sugerido a un día. */
  function ponerEnDia(fecha: string, ids: string[]) {
    const ya = outfitDe(fecha)
    if (ya) updateOutfit({ ...ya, garmentIds: ids })
    else addOutfit({ date: fecha, garmentIds: ids })
  }

  /** "Huella" de un outfit, sin contar accesorios (para no repetirlo en la semana). */
  function huella(ids: string[]): string {
    return ids
      .filter((id) => prendaDe(id)?.kind !== 'accesorio')
      .slice()
      .sort()
      .join('|')
  }

  /** Llena de una vez los días que estén vacíos, sin repetir outfits. */
  function llenarSemana() {
    const vacios = dias.filter((d) => !outfitDe(d))
    if (!vacios.length) return
    const usadas = [...usadasHacePoco]
    const yaEnLaSemana = new Set(
      dias.map((d) => outfitDe(d)).filter(Boolean).map((o) => huella(o!.garmentIds)),
    )
    for (const dia of vacios) {
      const opciones = sugerirOutfits(garments, { usadasHacePoco: usadas, cuantas: 10 })
      if (!opciones.length) break
      const ids = (
        opciones.find((o) => !yaEnLaSemana.has(huella(o.garments.map((g) => g.id)))) ?? opciones[0]
      ).garments.map((g) => g.id)
      ponerEnDia(dia, ids)
      yaEnLaSemana.add(huella(ids))
      usadas.push(...ids)
    }
  }

  return (
    <main className="screen closet">
      <div className="screen-head">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>Mi Clóset 👗</h1>
          <p className="screen-sub">Tu ropa y los outfits de tu semana</p>
        </div>
        <button className="iconbtn" onClick={() => setCreandoPrenda(true)} aria-label="Subir prenda">
          ＋
        </button>
      </div>

      <div className="cl-tabs">
        <button
          className={`chip ${pestana === 'semana' ? 'chip--active' : ''}`}
          onClick={() => setPestana('semana')}
        >
          🗓️ Mi semana
        </button>
        <button
          className={`chip ${pestana === 'ropa' ? 'chip--active' : ''}`}
          onClick={() => setPestana('ropa')}
        >
          👚 Mi ropa {vivas.length > 0 ? `(${vivas.length})` : ''}
        </button>
      </div>

      {/* ================= MI SEMANA ================= */}
      {pestana === 'semana' && (
        <>
          <div className="cl-semana">
            <button className="iconbtn" onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior">
              ‹
            </button>
            <b>{etiquetaSemana(offset)}</b>
            <button className="iconbtn" onClick={() => setOffset((o) => o + 1)} aria-label="Semana siguiente">
              ›
            </button>
          </div>

          {!garmentsLoaded ? (
            <p className="screen-sub" style={{ textAlign: 'center' }}>
              Abriendo tu clóset…
            </p>
          ) : vivas.length === 0 ? (
            <div className="cl-empty">
              <Cat size={130} mood="happy" alive={false} speech="¡vamos! 👗" />
              <h3>Tu clóset está vacío</h3>
              <p className="screen-sub">
                Súbele fotos a tu ropa y yo te armo los outfits de la semana 💗
              </p>
              <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreandoPrenda(true)}>
                Subir mi primera prenda
              </button>
            </div>
          ) : (
            <>
              {falta && <p className="cl-falta">💡 {falta}</p>}

              <button className="btn btn--primary btn--block" onClick={llenarSemana} disabled={!!falta}>
                ✨ Armar los días que faltan
              </button>

              <div className="cl-dias">
                {dias.map((fecha, i) => {
                  const outfit = outfitDe(fecha)
                  const hoy = fecha === localDayKey()
                  const piezas = (outfit?.garmentIds ?? []).map(prendaDe).filter(Boolean) as Garment[]
                  return (
                    <button
                      key={fecha}
                      className={`cl-dia ${hoy ? 'cl-dia--hoy' : ''}`}
                      onClick={() => setDiaElegido(fecha)}
                    >
                      <span className="cl-dia__nombre">
                        {DIAS[i]}
                        {hoy && <span className="cl-dia__hoy">hoy</span>}
                      </span>
                      {piezas.length === 0 ? (
                        <span className="cl-dia__vacio">＋ elegir outfit</span>
                      ) : (
                        <span className="cl-dia__fotos">
                          {piezas.slice(0, 4).map((g) => (
                            <Miniatura key={g.id} prenda={g} />
                          ))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ================= MI ROPA ================= */}
      {pestana === 'ropa' &&
        (!garmentsLoaded ? (
          <p className="screen-sub" style={{ textAlign: 'center' }}>
            Abriendo tu clóset…
          </p>
        ) : vivas.length === 0 ? (
          <div className="cl-empty">
            <Cat size={120} mood="happy" alive={false} speech="¡súbelas! 📸" />
            <h3>Aún no has subido ropa</h3>
            <p className="screen-sub">Tómale una foto a cada prenda y dime qué es 💗</p>
            <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => setCreandoPrenda(true)}>
              Subir mi primera prenda
            </button>
          </div>
        ) : (
          <>
            {TIPOS.map((t) => {
              const delTipo = vivas.filter((g) => g.kind === t.key)
              if (!delTipo.length) return null
              return (
                <section key={t.key} className="cl-grupo">
                  <span className="t-label">
                    {t.emoji} {t.label} ({delTipo.length})
                  </span>
                  <div className="cl-grid">
                    {delTipo.map((g) => (
                      <button key={g.id} className="cl-prenda" onClick={() => setEditandoPrenda(g)}>
                        <Miniatura prenda={g} grande />
                        <span className="cl-prenda__nombre">{g.name}</span>
                        {g.favorite && <span className="cl-prenda__fav">💖</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        ))}

      {/* ----- Hojas ----- */}
      <EditorPrenda
        open={creandoPrenda}
        onClose={() => setCreandoPrenda(false)}
        onSave={(datos) => {
          addGarment(datos)
          setCreandoPrenda(false)
        }}
      />

      <EditorPrenda
        open={!!editandoPrenda}
        prenda={editandoPrenda ?? undefined}
        onClose={() => setEditandoPrenda(null)}
        onSave={(datos) => {
          if (editandoPrenda) updateGarment({ ...editandoPrenda, ...datos })
          setEditandoPrenda(null)
        }}
        onDelete={() => {
          if (editandoPrenda) deleteGarment(editandoPrenda.id)
          setEditandoPrenda(null)
        }}
      />

      <ElegirOutfit
        open={!!diaElegido}
        fecha={diaElegido ?? ''}
        prendas={garments}
        outfit={diaElegido ? outfitDe(diaElegido) : undefined}
        usadasHacePoco={usadasHacePoco}
        onClose={() => setDiaElegido(null)}
        onGuardar={(ids) => {
          if (diaElegido) ponerEnDia(diaElegido, ids)
          setDiaElegido(null)
        }}
        onQuitar={() => {
          const ya = diaElegido ? outfitDe(diaElegido) : undefined
          if (ya) deleteOutfit(ya.id)
          setDiaElegido(null)
        }}
      />
    </main>
  )
}

/* ===========================================================
   Fotico de una prenda (si no tiene foto, un cuadrito de color)
   =========================================================== */

function Miniatura({ prenda, grande = false }: { prenda: Garment; grande?: boolean }) {
  const c = colorDe(prenda.color)
  if (prenda.photo) {
    return (
      <span className={`cl-mini ${grande ? 'cl-mini--grande' : ''}`}>
        <img src={prenda.photo} alt={prenda.name} loading="lazy" />
      </span>
    )
  }
  return (
    <span
      className={`cl-mini cl-mini--color ${grande ? 'cl-mini--grande' : ''}`}
      style={{ background: c.hex }}
    >
      <span className="cl-mini__emoji">{tipoDe(prenda.kind).emoji}</span>
    </span>
  )
}

/* ===========================================================
   Subir / editar una prenda
   =========================================================== */

type DatosPrenda = Omit<Garment, 'id' | 'createdAt'>

function EditorPrenda({
  open,
  prenda,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  prenda?: Garment
  onClose: () => void
  onSave: (datos: DatosPrenda) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(prenda?.name ?? '')
  const [kind, setKind] = useState<GarmentKind>(prenda?.kind ?? 'top')
  const [color, setColor] = useState(prenda?.color ?? 'negro')
  const [styles, setStyles] = useState<GarmentStyle[]>(prenda?.styles ?? ['casual'])
  const [weather, setWeather] = useState<GarmentWeather | undefined>(prenda?.weather)
  const [photo, setPhoto] = useState<string | undefined>(prenda?.photo)
  const [favorite, setFavorite] = useState(prenda?.favorite ?? false)
  const [cargando, setCargando] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)

  const firma = `${open}|${prenda?.id ?? 'nueva'}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setName(prenda?.name ?? '')
    setKind(prenda?.kind ?? 'top')
    setColor(prenda?.color ?? 'negro')
    setStyles(prenda?.styles ?? ['casual'])
    setWeather(prenda?.weather)
    setPhoto(prenda?.photo)
    setFavorite(prenda?.favorite ?? false)
    setCargando(false)
  }

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCargando(true)
    try {
      setPhoto(await comprimirFoto(file))
    } catch {
      /* si falla, se queda sin foto */
    }
    setCargando(false)
  }

  function alternarEstilo(k: GarmentStyle) {
    setStyles((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))
  }

  return (
    <Sheet open={open} onClose={onClose} title={prenda ? 'Editar prenda' : 'Subir una prenda'}>
      <div className="stack">
        {/* foto */}
        <button className="cl-foto" onClick={() => inputFoto.current?.click()}>
          {cargando ? (
            <span className="cl-foto__vacia">Achicando la foto… ⏳</span>
          ) : photo ? (
            <img src={photo} alt="Tu prenda" />
          ) : (
            <span className="cl-foto__vacia">
              📸<br />
              Toca para tomarle una foto
              <br />
              <small>o elegirla de tu galería</small>
            </span>
          )}
        </button>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          onChange={elegirFoto}
          style={{ display: 'none' }}
        />
        {photo && (
          <button className="cl-quitarfoto" onClick={() => setPhoto(undefined)}>
            Quitar la foto
          </button>
        )}

        <div className="field">
          <label>¿Qué es?</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Blusa blanca, jean negro…"
            maxLength={40}
          />
        </div>

        <span className="t-label">Tipo de prenda</span>
        <div className="cl-chips">
          {TIPOS.map((t) => (
            <button
              key={t.key}
              className={`chip ${kind === t.key ? 'chip--active' : ''}`}
              onClick={() => setKind(t.key)}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <span className="t-label">Color</span>
        <div className="cl-colores">
          {COLORES.map((c) => (
            <button
              key={c.key}
              className={`cl-color ${color === c.key ? 'cl-color--on' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setColor(c.key)}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>

        <span className="t-label">¿Para qué la usas?</span>
        <div className="cl-chips">
          {ESTILOS.map((e) => (
            <button
              key={e.key}
              className={`chip ${styles.includes(e.key) ? 'chip--active' : ''}`}
              onClick={() => alternarEstilo(e.key)}
            >
              {e.emoji} {e.label}
            </button>
          ))}
        </div>

        <span className="t-label">¿Para qué clima? (opcional)</span>
        <div className="cl-chips">
          {CLIMAS.map((c) => (
            <button
              key={c.key}
              className={`chip ${weather === c.key ? 'chip--active' : ''}`}
              onClick={() => setWeather(weather === c.key ? undefined : c.key)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <button
          className={`btn btn--block ${favorite ? 'cl-fav--on' : ''}`}
          onClick={() => setFavorite((f) => !f)}
        >
          {favorite ? '💖 Es de mis favoritas' : '🤍 Marcarla como favorita'}
        </button>

        <button
          className="btn btn--primary btn--block"
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              kind,
              color,
              styles: styles.length ? styles : ['casual'],
              weather,
              photo,
              favorite,
            })
          }
        >
          Guardar prenda
        </button>

        {onDelete && (
          <button className="btn btn--block btn--ghost cl-del" onClick={onDelete}>
            Eliminar esta prenda
          </button>
        )}
      </div>
    </Sheet>
  )
}

/* ===========================================================
   Elegir el outfit de un día
   =========================================================== */

function ElegirOutfit({
  open,
  fecha,
  prendas,
  outfit,
  usadasHacePoco,
  onClose,
  onGuardar,
  onQuitar,
}: {
  open: boolean
  fecha: string
  prendas: Garment[]
  outfit?: Outfit
  usadasHacePoco: string[]
  onClose: () => void
  onGuardar: (ids: string[]) => void
  onQuitar: () => void
}) {
  const [estilo, setEstilo] = useState<GarmentStyle | undefined>(undefined)
  const [clima, setClima] = useState<GarmentWeather | undefined>(undefined)
  const [sugerencias, setSugerencias] = useState<OutfitSugerido[]>([])
  const [aMano, setAMano] = useState<string[]>(outfit?.garmentIds ?? [])
  const [modo, setModo] = useState<'sugerir' | 'mano'>('sugerir')

  const firma = `${open}|${fecha}`
  const [ultimaFirma, setUltimaFirma] = useState(firma)
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma)
    setEstilo(undefined)
    setClima(undefined)
    setAMano(outfit?.garmentIds ?? [])
    setModo('sugerir')
    setSugerencias(open ? sugerirOutfits(prendas, { usadasHacePoco, cuantas: 4 }) : [])
  }

  function recalcular(nuevoEstilo = estilo, nuevoClima = clima) {
    setSugerencias(
      sugerirOutfits(prendas, {
        estilo: nuevoEstilo,
        clima: nuevoClima,
        usadasHacePoco,
        cuantas: 4,
      }),
    )
  }

  function alternarPrenda(id: string) {
    setAMano((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  }

  // ojo: al principio `fecha` viene vacía (la hoja está cerrada)
  const nombreDia = (() => {
    if (!fecha) return 'día'
    const [y, m, d] = fecha.split('-').map(Number)
    return DIAS[(new Date(y, m - 1, d).getDay() + 6) % 7] ?? 'día'
  })()

  return (
    <Sheet open={open} onClose={onClose} title={`Outfit del ${nombreDia.toLowerCase()}`}>
      <div className="stack">
        <div className="cl-chips">
          <button
            className={`chip ${modo === 'sugerir' ? 'chip--active' : ''}`}
            onClick={() => setModo('sugerir')}
          >
            ✨ Que me sugiera
          </button>
          <button
            className={`chip ${modo === 'mano' ? 'chip--active' : ''}`}
            onClick={() => setModo('mano')}
          >
            👆 Elegir yo
          </button>
        </div>

        {modo === 'sugerir' ? (
          <>
            <div className="cl-chips">
              {ESTILOS.map((e) => (
                <button
                  key={e.key}
                  className={`chip ${estilo === e.key ? 'chip--active' : ''}`}
                  onClick={() => {
                    const nuevo = estilo === e.key ? undefined : e.key
                    setEstilo(nuevo)
                    recalcular(nuevo, clima)
                  }}
                >
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
            <div className="cl-chips">
              {CLIMAS.map((c) => (
                <button
                  key={c.key}
                  className={`chip ${clima === c.key ? 'chip--active' : ''}`}
                  onClick={() => {
                    const nuevo = clima === c.key ? undefined : c.key
                    setClima(nuevo)
                    recalcular(estilo, nuevo)
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {sugerencias.length === 0 ? (
              <p className="cl-falta">
                No pude armar nada con eso 🙈 Prueba quitando los filtros o sube más ropa.
              </p>
            ) : (
              <div className="cl-sugs">
                {sugerencias.map((s, i) => (
                  <div key={i} className="cl-sug">
                    <div className="cl-sug__fotos">
                      {s.garments.map((g) => (
                        <span key={g.id} className="cl-sug__pieza">
                          <Miniatura prenda={g} />
                          <span className="cl-sug__nombre">{g.name}</span>
                        </span>
                      ))}
                    </div>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => onGuardar(s.garments.map((g) => g.id))}
                    >
                      Este me gusta 💗
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn--block" onClick={() => recalcular()}>
              🎲 Mostrarme otros
            </button>
          </>
        ) : (
          <>
            <p className="screen-sub" style={{ paddingLeft: 2 }}>
              Toca las prendas que te vas a poner ese día 💗
            </p>
            {TIPOS.map((t) => {
              const delTipo = prendas.filter((g) => !g.archived && g.kind === t.key)
              if (!delTipo.length) return null
              return (
                <div key={t.key}>
                  <span className="t-label">
                    {t.emoji} {t.label}
                  </span>
                  <div className="cl-grid cl-grid--sel">
                    {delTipo.map((g) => (
                      <button
                        key={g.id}
                        className={`cl-prenda ${aMano.includes(g.id) ? 'cl-prenda--on' : ''}`}
                        onClick={() => alternarPrenda(g.id)}
                      >
                        <Miniatura prenda={g} grande />
                        <span className="cl-prenda__nombre">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            <button
              className="btn btn--primary btn--block"
              disabled={aMano.length === 0}
              onClick={() => onGuardar(aMano)}
            >
              Guardar este outfit
            </button>
          </>
        )}

        {outfit && (
          <button className="btn btn--block btn--ghost cl-del" onClick={onQuitar}>
            Quitar el outfit de este día
          </button>
        )}
      </div>
    </Sheet>
  )
}
