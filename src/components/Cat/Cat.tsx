import { useCallback, useEffect, useRef, useState } from 'react'
import './cat.css'

export type CatMood = 'idle' | 'happy' | 'sad' | 'celebrate' | 'sleep'
export type CatContext = 'home' | 'accounts' | 'movements' | 'stats' | 'shop' | 'settings' | 'notes'

export interface SkinColors {
  body: string
  shade: string
  ear: string
  earIn: string
  belly: string
}

export const SKINS: Record<string, SkinColors> = {
  // 'pink' es la skin por defecto de Nia — recoloreada a LILA para diferenciarse
  // (se conserva el id 'pink' para no romper datos ya guardados).
  pink:  { body: '#d9c2ff', shade: '#c4a9f5', ear: '#b892ec', earIn: '#9a6fd6', belly: '#f4ecff' },
  cream: { body: '#ffe9c9', shade: '#ffd9a6', ear: '#ffc987', earIn: '#ffb066', belly: '#fff8ec' },
  gray:  { body: '#d8d8e8', shade: '#c2c2d6', ear: '#b6b6cc', earIn: '#9a9ab2', belly: '#f3f3fb' },
  black: { body: '#6e6680', shade: '#5b5468', ear: '#4d4659', earIn: '#3c3647', belly: '#ada6bd' },
  // Premios glam (se ganan cumpliendo metas de tokens)
  rubi:     { body: '#e0556b', shade: '#c8455c', ear: '#bb3a52', earIn: '#9e2f45', belly: '#ffd9df' },
  midnight: { body: '#3b3654', shade: '#2f2a45', ear: '#282338', earIn: '#1c1830', belly: '#726b94' },
  gold:     { body: '#e8c56b', shade: '#d8ae4c', ear: '#caa03c', earIn: '#b0862c', belly: '#fff2cf' },
  velvet:   { body: '#8a5aa8', shade: '#764c92', ear: '#664080', earIn: '#52336a', belly: '#e6d4f2' },
}

type Expression = 'open' | 'happy' | 'teary' | 'closed' | 'wide'

/* ---- Reacciones al TOQUE (estilo Clippy: variadas y al azar) ---- */
interface Reaction {
  anim: string // clase -> cat--r-<anim>
  expr?: Expression
  fx: string[]
  phrase: string
  ms: number
}
const REACTIONS: Reaction[] = [
  { anim: 'pounce',    expr: 'happy', fx: ['💗', '💕', '✨'], phrase: '¡miau! 🐾', ms: 700 },
  { anim: 'spin',      expr: 'happy', fx: ['✨', '💫', '⭐'], phrase: '¡weee!', ms: 800 },
  { anim: 'wiggle',    expr: 'happy', fx: ['🎵', '✨', '💗'], phrase: '♪ ~', ms: 900 },
  { anim: 'surprised', expr: 'wide',  fx: ['❗'],             phrase: '¿¡!? ', ms: 700 },
  { anim: 'purr',      expr: 'happy', fx: ['💗', '💗'],       phrase: 'rrronron~ 😻', ms: 1000 },
  { anim: 'think',     expr: 'open',  fx: ['💡'],             phrase: 'mmm… 🤔', ms: 1000 },
  { anim: 'flip',      expr: 'happy', fx: ['⭐', '✨'],       phrase: '¡ta-da! 🤸', ms: 800 },
  { anim: 'hearts',    expr: 'happy', fx: ['💖', '💗', '💕', '💞'], phrase: 'te quiero 💗', ms: 1000 },
  { anim: 'shy',       expr: 'closed', fx: ['💕'],            phrase: 'ay… 😳', ms: 1000 },
  { anim: 'jump',      expr: 'wide',  fx: ['‼️', '✨'],        phrase: '¡hola! 👋', ms: 700 },
]

/* ---- Travesuras ociosas (rotan solas) ---- */
const IDLE_ACTIONS = ['none', 'none', 'sleep', 'stretch', 'chase', 'yarn', 'peek', 'look'] as const
type IdleAction = (typeof IDLE_ACTIONS)[number]

/* ---- Decoración contextual por pantalla ---- */
const CONTEXT_DECOR: Record<CatContext, string | null> = {
  home: null,
  accounts: '🐷',
  movements: '📋',
  stats: '📊',
  shop: '🛍️',
  settings: '🔧',
  notes: '📝',
}

interface CatProps {
  size?: number
  mood?: CatMood
  equipped?: string[]
  skin?: string
  speech?: string | null
  onTap?: () => void
  alive?: boolean
  context?: CatContext
  /** modo "esperando racha": el gato hace una animación de espera, se bloquean
   *  sus otras animaciones/reacciones, y al tocarlo solo dispara onTap. */
  awaiting?: boolean
}

interface Fx {
  id: number
  emoji: string
  dx: number
  dy: number
}

export default function Cat({
  size = 180,
  mood = 'idle',
  equipped = [],
  skin = 'pink',
  speech = null,
  onTap,
  alive = true,
  context,
  awaiting = false,
}: CatProps) {
  const c = SKINS[skin] ?? SKINS.pink
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [idle, setIdle] = useState<IdleAction>('none')
  const [fx, setFx] = useState<Fx[]>([])
  const [bubble, setBubble] = useState<string | null>(null)
  const fxId = useRef(0)
  const bubbleTimer = useRef<number | undefined>(undefined)
  const reactTimer = useRef<number | undefined>(undefined)

  /* rotación de travesuras ociosas (bloqueadas mientras espera la racha) */
  useEffect(() => {
    if (!alive || awaiting || mood !== 'idle') {
      setIdle('none')
      return
    }
    let t: number
    const loop = () => {
      const next = IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)]
      setIdle(next)
      const dur = next === 'sleep' ? 5200 : next === 'none' ? 4200 : 2400
      t = window.setTimeout(loop, dur)
    }
    t = window.setTimeout(loop, 3500)
    return () => window.clearTimeout(t)
  }, [alive, mood, awaiting])

  /* celebrar/feliz lanzan partículas */
  useEffect(() => {
    if (mood === 'celebrate') spawn(['⭐', '🎉', '💖', '✨'])
    if (mood === 'happy') spawn(['💚', '🪙', '✨'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood])

  const spawn = useCallback((emojis: string[]) => {
    const items = emojis.map((emoji, i) => ({
      id: fxId.current++,
      emoji,
      dx: Math.round((i - (emojis.length - 1) / 2) * 26 + (Math.random() - 0.5) * 16),
      dy: Math.round((Math.random() - 0.5) * 16),
    }))
    setFx((f) => [...f, ...items])
    items.forEach((it) => {
      window.setTimeout(() => setFx((f) => f.filter((x) => x.id !== it.id)), 1150)
    })
  }, [])

  const handleTap = useCallback(() => {
    // Esperando la racha: se bloquean las reacciones; el toque solo dispara onTap.
    if (awaiting) {
      onTap?.()
      return
    }
    const r = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    setReaction(r)
    spawn(r.fx)
    window.clearTimeout(reactTimer.current)
    reactTimer.current = window.setTimeout(() => setReaction(null), r.ms)
    if (!speech) {
      setBubble(r.phrase)
      window.clearTimeout(bubbleTimer.current)
      bubbleTimer.current = window.setTimeout(() => setBubble(null), 1600)
    }
    onTap?.()
  }, [onTap, spawn, speech, awaiting])

  const sleeping = mood === 'sleep' || idle === 'sleep'
  const expression: Expression = reaction?.expr
    ? reaction.expr
    : mood === 'happy' || mood === 'celebrate'
      ? 'happy'
      : mood === 'sad'
        ? 'teary'
        : sleeping
          ? 'closed'
          : 'open'

  const cls = [
    'cat',
    awaiting && 'cat--awaiting',
    !awaiting && reaction && `cat--r-${reaction.anim}`,
    !awaiting && mood === 'celebrate' && 'cat--r-hearts',
    !awaiting && !reaction && idle !== 'none' && idle !== 'look' && `cat--i-${idle}`,
  ]
    .filter(Boolean)
    .join(' ')

  const shownBubble = speech ?? bubble
  const decor = context ? CONTEXT_DECOR[context] : null

  return (
    <button type="button" className={cls} style={{ width: size }} onClick={handleTap} aria-label="Gatito">
      {shownBubble && <span key={shownBubble} className="cat__bubble">{shownBubble}</span>}

      {fx.map((f) => (
        <span key={f.id} className="cat__fx" style={{ left: `calc(50% + ${f.dx}px)`, top: `${28 + f.dy}%` }}>
          {f.emoji}
        </span>
      ))}

      {/* decoración contextual (alcancía, gráfica, etc.) */}
      {decor && <span className="cat__decor">{decor}</span>}
      {/* bolita de estambre (idle) */}
      {idle === 'yarn' && !reaction && <span className="cat__yarn">🧶</span>}
      {/* bombillo (reacción pensar) */}
      {reaction?.anim === 'think' && <span className="cat__bulb">💡</span>}

      <svg viewBox="0 0 240 240" width={size} xmlns="http://www.w3.org/2000/svg">
        <g className="cat__body">
          {/* colita esponjosa con puntita clara */}
          <g className="cat__tail">
            <path d="M166 184 q52 10 50 -44 q-2 -30 -28 -28 q20 8 18 30 q-3 32 -42 26 z" fill={c.shade} />
            <ellipse cx="195" cy="140" rx="14" ry="15" fill={c.belly} />
            <ellipse cx="195" cy="140" rx="14" ry="15" fill={c.shade} opacity="0.22" />
          </g>
          {/* cuerpo */}
          <ellipse cx="120" cy="180" rx="62" ry="48" fill={c.body} />
          <ellipse cx="120" cy="192" rx="40" ry="28" fill={c.belly} opacity="0.7" />
          <ellipse cx="96" cy="214" rx="17" ry="12" fill={c.shade} />
          <ellipse cx="144" cy="214" rx="17" ry="12" fill={c.shade} />

          {/* ===== Accesorios de CUERPO/CUELLO (detrás de la cabeza) ===== */}

          {/* Haori a cuadros de Tanjiro (Demon Slayer) */}
          {equipped.includes('ds_haori') && (
            <g className="cat__acc">
              <defs>
                <pattern id="ichimatsu" width="14" height="14" patternUnits="userSpaceOnUse">
                  <rect width="14" height="14" fill="#1f9d68" />
                  <rect width="7" height="7" fill="#12201a" />
                  <rect x="7" y="7" width="7" height="7" fill="#12201a" />
                </pattern>
              </defs>
              <path
                d="M74 148 L120 192 L166 148 L158 176 L120 208 L82 176 Z"
                fill="url(#ichimatsu)"
                stroke="#0e2a20"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Bufanda de Gryffindor (Harry Potter) */}
          {equipped.includes('hp_scarf') && (
            <g className="cat__acc">
              <path d="M74 150 q46 28 92 0 l0 15 q-46 28 -92 0 Z" fill="#7a1420" />
              <path d="M74 156 q46 26 92 0" fill="none" stroke="#e3b23c" strokeWidth="4" />
              <path d="M150 160 l18 3 l-4 44 l-16 -4 z" fill="#7a1420" stroke="#5e0f19" strokeWidth="1" />
              <g stroke="#e3b23c" strokeWidth="4">
                <line x1="150" y1="172" x2="167" y2="175" />
                <line x1="149" y1="185" x2="166" y2="188" />
                <line x1="148" y1="198" x2="164" y2="201" />
              </g>
              <g stroke="#7a1420" strokeWidth="2.4" strokeLinecap="round">
                <line x1="150" y1="206" x2="149" y2="213" />
                <line x1="156" y1="207" x2="156" y2="214" />
                <line x1="162" y1="208" x2="163" y2="214" />
              </g>
            </g>
          )}

          {/* Camiseta de Colombia (Mundial) — tricolor PINTADO (bloques recortados a la tela) */}
          {equipped.includes('mn_colombia') && (
            <g className="cat__acc">
              <defs>
                <clipPath id="colTor">
                  <path d="M78 152 Q120 146 162 152 L168 196 Q120 216 72 196 Z" />
                </clipPath>
                <clipPath id="colSlL">
                  <ellipse cx="72" cy="170" rx="13" ry="16" />
                </clipPath>
                <clipPath id="colSlR">
                  <ellipse cx="168" cy="170" rx="13" ry="16" />
                </clipPath>
              </defs>

              {/* mangas + puños pintados (el torso tapa la parte interna) */}
              <ellipse cx="72" cy="170" rx="13" ry="16" fill="#ffcd00" stroke="#e0b400" strokeWidth="1" />
              <g clipPath="url(#colSlL)">
                <rect x="58" y="177" width="28" height="4" fill="#003893" />
                <rect x="58" y="181" width="28" height="9" fill="#ce1126" />
              </g>
              <ellipse cx="168" cy="170" rx="13" ry="16" fill="#ffcd00" stroke="#e0b400" strokeWidth="1" />
              <g clipPath="url(#colSlR)">
                <rect x="154" y="177" width="28" height="4" fill="#003893" />
                <rect x="154" y="181" width="28" height="9" fill="#ce1126" />
              </g>

              {/* torso amarillo */}
              <path d="M78 152 Q120 146 162 152 L168 196 Q120 216 72 196 Z" fill="#ffcd00" stroke="#e0b400" strokeWidth="1.5" />

              {/* dobladillo pintado: azul y rojo siguiendo la curva del filo (rojo al borde) */}
              <g clipPath="url(#colTor)">
                <path d="M72 190 Q120 208 168 190 L168 183 Q120 200 72 183 Z" fill="#003893" />
                <path d="M72 196 Q120 216 168 196 L168 190 Q120 208 72 190 Z" fill="#ce1126" />
              </g>

              {/* escudo: banderita de Colombia */}
              <rect x="86" y="174" width="15" height="11" rx="1.8" fill="#ffcd00" stroke="#b98f10" strokeWidth="1" />
              <rect x="86.6" y="179.6" width="13.8" height="2.9" fill="#003893" />
              <rect x="86.6" y="182.5" width="13.8" height="2.4" fill="#ce1126" />

              {/* número */}
              <text x="127" y="189" fontSize="17" fontWeight="800" fill="#003893" textAnchor="middle">10</text>
            </g>
          )}

          {/* Camiseta de Argentina (Mundial) */}
          {equipped.includes('mn_argentina') && (
            <g className="cat__acc">
              <clipPath id="jsyArg">
                <path d="M78 152 Q120 146 162 152 L168 196 Q120 216 72 196 Z" />
              </clipPath>
              <ellipse cx="72" cy="170" rx="13" ry="16" fill="#f4f8fc" stroke="#9fb8cf" strokeWidth="1" />
              <ellipse cx="168" cy="170" rx="13" ry="16" fill="#f4f8fc" stroke="#9fb8cf" strokeWidth="1" />
              <path d="M78 152 Q120 146 162 152 L168 196 Q120 216 72 196 Z" fill="#f4f8fc" stroke="#9fb8cf" strokeWidth="1.5" />
              <g clipPath="url(#jsyArg)" fill="#75aadb">
                <rect x="86" y="146" width="12" height="74" />
                <rect x="114" y="146" width="12" height="74" />
                <rect x="142" y="146" width="12" height="74" />
              </g>
              <path d="M104 150 Q120 164 136 150" fill="none" stroke="#2b5fa5" strokeWidth="3" />
            </g>
          )}

          {/* Camiseta de Brasil (Mundial) */}
          {equipped.includes('mn_brasil') && (
            <g className="cat__acc">
              <ellipse cx="72" cy="170" rx="13" ry="16" fill="#009c3b" stroke="#00762c" strokeWidth="1" />
              <ellipse cx="168" cy="170" rx="13" ry="16" fill="#009c3b" stroke="#00762c" strokeWidth="1" />
              <path d="M78 152 Q120 146 162 152 L168 196 Q120 216 72 196 Z" fill="#ffdf00" stroke="#e0c400" strokeWidth="1.5" />
              <path d="M99 151 Q120 165 141 151 L137 158 Q120 168 103 158 Z" fill="#009c3b" />
              <text x="120" y="197" fontSize="20" fontWeight="800" fill="#009c3b" textAnchor="middle">10</text>
            </g>
          )}

          {/* Pin del Sinsajo (Los Juegos del Hambre) */}
          {equipped.includes('hg_pin') && (
            <g className="cat__acc">
              <circle cx="120" cy="176" r="15" fill="#e9b73a" stroke="#c89320" strokeWidth="2" />
              <circle cx="120" cy="176" r="12" fill="none" stroke="#fff3cf" strokeWidth="1" />
              <path
                d="M120 168 q7 3 10 -1 q-2 7 -7 7 l1 8 l-4 -3 l-4 3 l1 -8 q-5 0 -7 -7 q3 4 10 1 z"
                fill="#6b4e12"
              />
              <line x1="108" y1="184" x2="132" y2="169" stroke="#6b4e12" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {/* Trenza de Katniss (Los Juegos del Hambre) */}
          {equipped.includes('hg_braid') && (
            <g className="cat__acc">
              <path d="M70 96 Q58 130 70 172 Q78 190 76 202 L62 198 Q54 150 58 120 Q60 104 70 96 Z" fill="#7a5230" />
              <g fill="#8a5f38" stroke="#5f3f22" strokeWidth="0.9">
                <path d="M58 120 q10 6 16 -2 q-4 11 -14 8 z" />
                <path d="M58 140 q10 6 16 -2 q-4 11 -14 8 z" />
                <path d="M60 160 q10 6 16 -2 q-4 11 -14 8 z" />
                <path d="M62 180 q10 6 16 -2 q-4 11 -14 8 z" />
              </g>
              <path d="M64 198 q7 -6 13 0 q-2 9 -13 6 z" fill="#c0392b" />
            </g>
          )}

          {/* "En llamas" — la chica en llamas (Los Juegos del Hambre) */}
          {equipped.includes('hg_fire') && (
            <g className="cat__acc">
              <path d="M78 226 Q64 206 78 192 Q75 208 87 210 Q82 194 97 188 Q92 210 101 214 Q99 226 88 228 Z" fill="#ff7a1a" />
              <path d="M84 226 Q78 212 87 201 Q86 211 95 210 Q90 215 97 221 Q92 228 85 227 Z" fill="#ffd23e" />
              <path d="M162 226 Q176 206 162 192 Q165 208 153 210 Q158 194 143 188 Q148 210 139 214 Q141 226 152 228 Z" fill="#ff7a1a" />
              <path d="M156 226 Q162 212 153 201 Q154 211 145 210 Q150 215 143 221 Q148 228 155 227 Z" fill="#ffd23e" />
            </g>
          )}

          {/* Guayos (Mundial) */}
          {equipped.includes('mn_boots') && (
            <g className="cat__acc">
              <path d="M82 210 q12 -4 25 0 l2 8 q-15 5 -29 1 z" fill="#20232b" />
              <path d="M130 210 q12 -4 25 0 l2 8 q-15 5 -29 1 z" fill="#20232b" />
              <g fill="#e23b3b">
                <circle cx="88" cy="221" r="1.5" />
                <circle cx="96" cy="223" r="1.5" />
                <circle cx="104" cy="221" r="1.5" />
                <circle cx="136" cy="221" r="1.5" />
                <circle cx="144" cy="223" r="1.5" />
                <circle cx="152" cy="221" r="1.5" />
              </g>
            </g>
          )}

          {/* Balón (Mundial) */}
          {equipped.includes('mn_ball') && (
            <g className="cat__acc">
              <circle cx="152" cy="216" r="13" fill="#fff" stroke="#c9ced6" strokeWidth="1.5" />
              <path d="M152 208 l6.5 5 l-2.5 8 h-8 l-2.5 -8 z" fill="#20232b" />
              <g stroke="#20232b" strokeWidth="1.3" fill="none">
                <path d="M158.5 213 l7 -2.5 M155.5 221 l4 7 M148.5 221 l-4 7 M145.5 213 l-7 -2.5" />
              </g>
            </g>
          )}

          {/* Copa del Mundo (Mundial) */}
          {equipped.includes('mn_trophy') && (
            <g className="cat__acc">
              <ellipse cx="184" cy="216" rx="12" ry="3.5" fill="#000" opacity="0.12" />
              <rect x="177" y="207" width="14" height="6" rx="1.5" fill="#d9a520" />
              <rect x="180" y="200" width="8" height="8" fill="#e9b73a" />
              <path d="M177 176 q7 22 7 25 q0 -3 7 -25 q5 7 -7 9 q-12 -2 -7 -9 z" fill="#e9b73a" stroke="#c89320" strokeWidth="1" />
              <path d="M178 177 q6 4 6 4 q0 0 6 -4 z" fill="#f7e08f" />
            </g>
          )}

          {/* Boa de plumas (Glam) */}
          {equipped.includes('gl_boa') && (
            <g className="cat__acc">
              <g fill="#ff9ecb">
                <circle cx="72" cy="158" r="14" />
                <circle cx="90" cy="164" r="15" />
                <circle cx="110" cy="167" r="15" />
                <circle cx="130" cy="167" r="15" />
                <circle cx="150" cy="164" r="15" />
                <circle cx="168" cy="158" r="14" />
              </g>
              <g fill="#ffc6e2">
                <circle cx="80" cy="156" r="6" />
                <circle cx="100" cy="162" r="6" />
                <circle cx="120" cy="164" r="6" />
                <circle cx="140" cy="162" r="6" />
                <circle cx="160" cy="156" r="6" />
              </g>
              <g fill="#fff" opacity="0.6">
                <circle cx="86" cy="160" r="2.5" />
                <circle cx="112" cy="164" r="2.5" />
                <circle cx="138" cy="164" r="2.5" />
                <circle cx="162" cy="159" r="2.5" />
              </g>
            </g>
          )}

          {/* Gargantilla de encaje (Glam) */}
          {equipped.includes('gl_choker') && (
            <g className="cat__acc">
              <path d="M80 150 q40 20 80 0 l0 7 q-40 20 -80 0 Z" fill="#2a2433" />
              <g fill="none" stroke="#2a2433" strokeWidth="2">
                <path d="M84 160 q4 6 8 0" />
                <path d="M96 163 q4 6 8 0" />
                <path d="M108 165 q4 6 8 0" />
                <path d="M120 166 q4 6 8 0" />
                <path d="M132 165 q4 6 8 0" />
                <path d="M144 163 q4 6 8 0" />
                <path d="M156 160 q4 6 8 0" />
              </g>
              <path d="M120 168 c-3 -4 -9 -1 -9 3 c0 4 9 8 9 8 c0 0 9 -4 9 -8 c0 -4 -6 -7 -9 -3 z" fill="#e0416b" />
            </g>
          )}

          {/* bufanda (detrás de la cabeza) */}
          {equipped.includes('scarf') && (
            <g className="cat__acc">
              <path d="M74 150 q46 30 92 0 l0 16 q-46 30 -92 0 Z" fill="#56c596" />
              <path d="M150 162 l16 4 l-4 22 l-14 -6 z" fill="#3fae82" />
            </g>
          )}

          {/* orejas redondeadas con corazón adentro */}
          <path className="cat__earL" d="M70 98 Q64 50 90 52 Q114 58 118 82 Q94 72 70 98 Z" fill={c.ear} />
          <path d="M170 98 Q176 50 150 52 Q126 58 122 82 Q146 72 170 98 Z" fill={c.ear} />
          <path d="M90 66 q-6 -7 -11 -1 q-4 6 11 15 q15 -9 11 -15 q-5 -6 -11 1 z" fill={c.earIn} />
          <path d="M150 66 q-6 -7 -11 -1 q-4 6 11 15 q15 -9 11 -15 q-5 -6 -11 1 z" fill={c.earIn} />

          {/* cabeza */}
          <circle cx="120" cy="112" r="56" fill={c.body} />

          {/* cachetes con destello */}
          <ellipse cx="84" cy="125" rx="12" ry="8" fill="#ff9ec2" opacity="0.55" />
          <ellipse cx="156" cy="125" rx="12" ry="8" fill="#ff9ec2" opacity="0.55" />
          <circle cx="80" cy="122" r="1.6" fill="#fff" opacity="0.75" />
          <circle cx="152" cy="122" r="1.6" fill="#fff" opacity="0.75" />

          {/* ojos */}
          {expression === 'open' && (
            <g className="cat__eyes">
              {/* ojos grandes */}
              <ellipse cx="98" cy="112" rx="10" ry="13" fill="#4a3b46" />
              <ellipse cx="142" cy="112" rx="10" ry="13" fill="#4a3b46" />
              {/* iris lila */}
              <ellipse cx="98" cy="115" rx="7" ry="9" fill="#8a63c8" opacity="0.6" />
              <ellipse cx="142" cy="115" rx="7" ry="9" fill="#8a63c8" opacity="0.6" />
              {/* doble brillo */}
              <circle cx="101.5" cy="107" r="3.4" fill="#fff" />
              <circle cx="145.5" cy="107" r="3.4" fill="#fff" />
              <circle cx="94.5" cy="117" r="1.9" fill="#fff" opacity="0.85" />
              <circle cx="138.5" cy="117" r="1.9" fill="#fff" opacity="0.85" />
              {/* pestañas */}
              <g stroke="#4a3b46" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M88 105 q-6 -4 -9 -2" />
                <path d="M152 105 q6 -4 9 -2" />
              </g>
            </g>
          )}
          {expression === 'wide' && (
            <g>
              <circle cx="98" cy="112" r="13" fill="#fff" stroke="#4a3b46" strokeWidth="2.5" />
              <circle cx="142" cy="112" r="13" fill="#fff" stroke="#4a3b46" strokeWidth="2.5" />
              <circle cx="98" cy="113" r="7" fill="#4a3b46" />
              <circle cx="142" cy="113" r="7" fill="#4a3b46" />
              <circle cx="100" cy="110" r="2.5" fill="#fff" />
              <circle cx="144" cy="110" r="2.5" fill="#fff" />
            </g>
          )}
          {expression === 'happy' && (
            <g fill="none" stroke="#4a3b46" strokeWidth="4" strokeLinecap="round">
              <path d="M88 114 q10 -12 20 0" />
              <path d="M132 114 q10 -12 20 0" />
              <g strokeWidth="2">
                <path d="M88 109 q-6 -3 -9 -1" />
                <path d="M152 109 q6 -3 9 -1" />
              </g>
            </g>
          )}
          {expression === 'teary' && (
            <>
              <g fill="none" stroke="#4a3b46" strokeWidth="4" strokeLinecap="round">
                <path d="M88 110 q10 -10 20 0" />
                <path d="M132 110 q10 -10 20 0" />
              </g>
              <ellipse className="cat__tear" cx="96" cy="124" rx="4" ry="6" fill="#7fc8ff" />
            </>
          )}
          {expression === 'closed' && (
            <g fill="none" stroke="#4a3b46" strokeWidth="3.5" strokeLinecap="round">
              <path d="M89 114 q9 8 19 0" />
              <path d="M133 114 q9 8 19 0" />
            </g>
          )}

          {/* naricita de corazón + boca */}
          <path d="M120 124 q-4 -4 -7 -1 q-3 3 0 6 l7 6 l7 -6 q3 -3 0 -6 q-3 -3 -7 1 z" fill="#ff7aa8" />
          {expression === 'teary' ? (
            <path d="M108 140 q12 -8 24 0" fill="none" stroke="#4a3b46" strokeWidth="2.6" strokeLinecap="round" />
          ) : (
            <path
              d="M120 131 q-7 8 -14 2 M120 131 q7 8 14 2"
              fill="none"
              stroke="#4a3b46"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}

          {/* bigotes */}
          <g stroke="#4a3b46" strokeWidth="1.6" strokeLinecap="round" opacity="0.45">
            <line x1="64" y1="120" x2="84" y2="122" />
            <line x1="64" y1="130" x2="84" y2="129" />
            <line x1="176" y1="120" x2="156" y2="122" />
            <line x1="176" y1="130" x2="156" y2="129" />
          </g>

          {/* gafas */}
          {equipped.includes('glasses') && (
            <g className="cat__acc">
              <circle cx="98" cy="112" r="16" fill="rgba(255,255,255,.22)" stroke="#4a3b46" strokeWidth="3" />
              <circle cx="142" cy="112" r="16" fill="rgba(255,255,255,.22)" stroke="#4a3b46" strokeWidth="3" />
              <line x1="114" y1="110" x2="126" y2="110" stroke="#4a3b46" strokeWidth="3" />
            </g>
          )}

          {/* moño */}
          {equipped.includes('bow') && (
            <g className="cat__acc">
              <path d="M90 56 q-18 -12 -18 4 q0 14 18 6 z" fill="#ff5fa0" />
              <path d="M90 56 q18 -12 18 4 q0 14 -18 6 z" fill="#ff5fa0" />
              <circle cx="90" cy="62" r="6" fill="#e3327f" />
            </g>
          )}

          {/* flor */}
          {equipped.includes('flower') && (
            <g className="cat__acc" transform="translate(150,56)" fill="#ff8fc4">
              <circle cx="0" cy="-7" r="6" />
              <circle cx="7" cy="-2" r="6" />
              <circle cx="4" cy="6" r="6" />
              <circle cx="-4" cy="6" r="6" />
              <circle cx="-7" cy="-2" r="6" />
              <circle cx="0" cy="0" r="4.5" fill="#ffb43d" />
            </g>
          )}

          {/* gorrito */}
          {equipped.includes('hat') && (
            <g className="cat__acc">
              <path d="M120 22 L100 64 L140 64 Z" fill="#ff5fa0" />
              <path d="M120 22 L110 64 L120 64 Z" fill="#e3327f" opacity="0.5" />
              <circle cx="120" cy="20" r="6" fill="#ffb43d" />
            </g>
          )}

          {/* gorro navideño */}
          {equipped.includes('santa') && (
            <g className="cat__acc">
              <path d="M78 64 Q120 18 160 50 Q150 28 120 26 Q90 30 78 64 Z" fill="#e8455e" />
              <rect x="72" y="58" width="96" height="15" rx="7.5" fill="#fff" />
              <circle cx="162" cy="48" r="10" fill="#fff" />
            </g>
          )}

          {/* corona */}
          {equipped.includes('crown') && (
            <g className="cat__acc">
              <path
                d="M92 60 L100 40 L112 56 L120 36 L128 56 L140 40 L148 60 Z"
                fill="#ffc24b"
                stroke="#e89a18"
                strokeWidth="1.5"
              />
              <circle cx="120" cy="50" r="3" fill="#ff5fa0" />
            </g>
          )}

          {/* sombrero de paja (Luffy) */}
          {equipped.includes('strawhat') && (
            <g className="cat__acc">
              {/* ala */}
              <ellipse cx="120" cy="62" rx="66" ry="15" fill="#e8c873" stroke="#c9a64e" strokeWidth="2" />
              <path d="M58 62 q62 11 124 0" fill="none" stroke="#caa84f" strokeWidth="1.5" opacity="0.6" />
              {/* copa */}
              <path d="M88 63 Q90 28 120 26 Q150 28 152 63 Z" fill="#f1d588" stroke="#c9a64e" strokeWidth="1.5" />
              {/* banda roja */}
              <path d="M88 57 Q120 49 152 57 L150 64 Q120 56 90 64 Z" fill="#d8463f" />
            </g>
          )}

          {/* ===== Accesorios de CABEZA / CARA ===== */}

          {/* Cicatriz de Luffy (One Piece) */}
          {equipped.includes('op_scar') && (
            <g className="cat__acc" stroke="#c0564a" strokeWidth="2.2" strokeLinecap="round">
              <line x1="90" y1="127" x2="100" y2="133" />
              <line x1="91" y1="130" x2="95" y2="126" />
              <line x1="95" y1="133" x2="99" y2="129" />
            </g>
          )}

          {/* Aretes hanafuda de Tanjiro (Demon Slayer) */}
          {equipped.includes('ds_earrings') && (
            <g className="cat__acc">
              <rect x="70" y="133" width="13" height="17" rx="2.5" fill="#fff" stroke="#e2cdd6" strokeWidth="1" />
              <circle cx="76.5" cy="139" r="3.4" fill="#e23b3b" />
              <g stroke="#e23b3b" strokeWidth="1.5" strokeLinecap="round">
                <line x1="73" y1="145" x2="73" y2="148" />
                <line x1="76.5" y1="145" x2="76.5" y2="148" />
                <line x1="80" y1="145" x2="80" y2="148" />
              </g>
              <rect x="157" y="133" width="13" height="17" rx="2.5" fill="#fff" stroke="#e2cdd6" strokeWidth="1" />
              <circle cx="163.5" cy="139" r="3.4" fill="#e23b3b" />
              <g stroke="#e23b3b" strokeWidth="1.5" strokeLinecap="round">
                <line x1="160" y1="145" x2="160" y2="148" />
                <line x1="163.5" y1="145" x2="163.5" y2="148" />
                <line x1="167" y1="145" x2="167" y2="148" />
              </g>
            </g>
          )}

          {/* Gafas de Harry + cicatriz de rayo (Harry Potter) */}
          {equipped.includes('hp_glasses') && (
            <g className="cat__acc">
              <path
                d="M110 82 l-5 7 l6 4 l-5 8"
                fill="none"
                stroke="#b93b2b"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="98" cy="112" r="15" fill="rgba(255,255,255,.16)" stroke="#2b2b2b" strokeWidth="3" />
              <circle cx="142" cy="112" r="15" fill="rgba(255,255,255,.16)" stroke="#2b2b2b" strokeWidth="3" />
              <line x1="113" y1="112" x2="127" y2="112" stroke="#2b2b2b" strokeWidth="3" />
              <line x1="83" y1="110" x2="71" y2="106" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
              <line x1="157" y1="110" x2="169" y2="106" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* Bandana de Zoro (One Piece) */}
          {equipped.includes('op_zoro') && (
            <g className="cat__acc">
              <path d="M66 92 Q120 76 174 92 L174 101 Q120 86 66 101 Z" fill="#2f7d4f" />
              <path d="M168 96 l16 -6 l-3 12 z" fill="#276b43" />
              <path d="M176 92 q18 6 19 27 l-8 -2 q-3 -15 -13 -19 z" fill="#2f7d4f" />
              <path d="M179 99 q15 9 12 27 l-7 -2 q0 -13 -11 -20 z" fill="#276b43" />
            </g>
          )}

          {/* Cintillo tricolor (Mundial) */}
          {equipped.includes('mn_headband') && (
            <g className="cat__acc">
              <path d="M66 92 Q120 76 174 92 L174 102 Q120 86 66 102 Z" fill="#ffcd00" />
              <path d="M66 96 Q120 80 174 96" fill="none" stroke="#003893" strokeWidth="3" />
              <path d="M66 100 Q120 84 174 100" fill="none" stroke="#ce1126" strokeWidth="2.2" />
              <path d="M170 96 q20 6 18 30 l-7 -2 q0 -16 -14 -22 z" fill="#ffcd00" />
              <path d="M176 100 q14 8 12 26 l-6 -2 q0 -12 -10 -18 z" fill="#ce1126" />
            </g>
          )}

          {/* Bozal de bambú de Nezuko (Demon Slayer) */}
          {equipped.includes('ds_muzzle') && (
            <g className="cat__acc">
              <path d="M96 132 Q80 120 78 100" fill="none" stroke="#8a5a3a" strokeWidth="3" strokeLinecap="round" />
              <path d="M144 132 Q160 120 162 100" fill="none" stroke="#8a5a3a" strokeWidth="3" strokeLinecap="round" />
              <rect x="96" y="126" width="48" height="16" rx="8" fill="#bcd98f" stroke="#8ea86a" strokeWidth="1.5" />
              <rect x="96" y="126" width="8" height="16" rx="4" fill="#a9c97b" />
              <rect x="136" y="126" width="8" height="16" rx="4" fill="#a9c97b" />
              <line x1="113" y1="127" x2="113" y2="141" stroke="#8ea86a" strokeWidth="2" />
              <line x1="128" y1="127" x2="128" y2="141" stroke="#8ea86a" strokeWidth="2" />
            </g>
          )}

          {/* Gorro de Chopper (One Piece) */}
          {equipped.includes('op_chopper') && (
            <g className="cat__acc">
              <path d="M84 42 q-14 -8 -11 -22 q6 8 15 5" fill="none" stroke="#c98a52" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M156 42 q14 -8 11 -22 q-6 8 -15 5" fill="none" stroke="#c98a52" strokeWidth="4.5" strokeLinecap="round" />
              <ellipse cx="120" cy="58" rx="54" ry="12" fill="#e78fb0" stroke="#cf6f95" strokeWidth="2" />
              <path d="M86 58 Q90 24 120 24 Q150 24 154 58 Q120 50 86 58 Z" fill="#f29ec2" stroke="#cf6f95" strokeWidth="2" />
              <ellipse cx="120" cy="42" rx="13" ry="11" fill="#fff" stroke="#e6d3db" strokeWidth="1" />
              <path d="M120 35 v14 M113 42 h14" stroke="#e23b3b" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          )}

          {/* Sombrero seleccionador (Harry Potter) */}
          {equipped.includes('hp_hat') && (
            <g className="cat__acc">
              <ellipse cx="120" cy="58" rx="52" ry="12" fill="#7c5a3a" stroke="#5f4429" strokeWidth="2" />
              <path d="M96 58 Q104 20 120 16 Q126 30 140 26 Q151 40 150 58 Q120 50 96 58 Z" fill="#8a6742" stroke="#5f4429" strokeWidth="2" />
              <path d="M139 27 Q152 15 139 8 Q135 17 127 18 Z" fill="#7c5a3a" stroke="#5f4429" strokeWidth="1.6" />
              <path d="M108 40 q10 -6 18 0" fill="none" stroke="#5f4429" strokeWidth="2" strokeLinecap="round" />
              <path d="M104 50 q14 -5 26 -1" fill="none" stroke="#5f4429" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          )}

          {/* Casco alado de Thor (Marvel) */}
          {equipped.includes('mv_thor') && (
            <g className="cat__acc">
              <path d="M72 92 Q52 66 44 74 Q56 74 60 84 Q50 82 46 90 Q60 88 72 94 Z" fill="#eef0f4" stroke="#b7bcc7" strokeWidth="1.5" />
              <path d="M168 92 Q188 66 196 74 Q184 74 180 84 Q190 82 194 90 Q180 88 168 94 Z" fill="#eef0f4" stroke="#b7bcc7" strokeWidth="1.5" />
              <path d="M72 92 Q78 46 120 44 Q162 46 168 92 Q120 74 72 92 Z" fill="#c9ccd6" stroke="#9aa0ad" strokeWidth="2" />
              <path d="M72 90 Q120 74 168 90 L168 96 Q120 80 72 96 Z" fill="#aeb3bf" />
              <line x1="120" y1="47" x2="120" y2="78" stroke="#9aa0ad" strokeWidth="2" />
            </g>
          )}

          {/* Máscara de zorro (Demon Slayer) — puesta al lado */}
          {equipped.includes('ds_foxmask') && (
            <g className="cat__acc" transform="translate(150 58) rotate(18) scale(1.18)">
              <path d="M-14 -8 L-18 -22 L-6 -14 Z" fill="#fff" stroke="#d9c2c2" strokeWidth="1" />
              <path d="M14 -8 L18 -22 L6 -14 Z" fill="#fff" stroke="#d9c2c2" strokeWidth="1" />
              <path d="M-16 -6 Q0 -14 16 -6 Q16 12 0 20 Q-16 12 -16 -6 Z" fill="#fff" stroke="#d9c2c2" strokeWidth="1.4" />
              <path d="M-6 10 Q0 21 6 10 Z" fill="#f0e6e6" />
              <path d="M-12 -2 q6 2 10 8" fill="none" stroke="#d23b3b" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 -2 q-6 2 -10 8" fill="none" stroke="#d23b3b" strokeWidth="2" strokeLinecap="round" />
              <circle cx="0" cy="-2" r="2.2" fill="#d23b3b" />
              <path d="M-9 2 l6 1" stroke="#333" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 2 l-6 1" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Máscara del Capitán América (Marvel) — deja ver la carita */}
          {equipped.includes('mv_cap') && (
            <g className="cat__acc">
              <path
                fillRule="evenodd"
                d="M120 56 a56 56 0 1 0 0.1 0 Z M120 82 a34 38 0 1 0 0.1 0 Z"
                fill="#2b5fa5"
              />
              <path d="M74 98 q-12 -2 -16 6 q10 -2 16 3 z" fill="#fff" />
              <path d="M166 98 q12 -2 16 6 q-10 -2 -16 3 z" fill="#fff" />
              <text x="120" y="76" fontSize="17" fontWeight="900" fill="#fff" textAnchor="middle">A</text>
            </g>
          )}

          {/* Máscara de Spider-Man (Marvel) — cubre la cara */}
          {equipped.includes('mv_spidey') && (
            <g className="cat__acc">
              <circle cx="120" cy="112" r="55" fill="#c8102e" />
              <g stroke="#7d0a1e" strokeWidth="1.1" fill="none" opacity="0.85">
                <line x1="120" y1="60" x2="120" y2="165" />
                <line x1="66" y1="112" x2="174" y2="112" />
                <line x1="82" y1="74" x2="158" y2="150" />
                <line x1="158" y1="74" x2="82" y2="150" />
                <path d="M92 84 Q120 96 148 84" />
                <path d="M84 104 Q120 118 156 104" />
                <path d="M86 130 Q120 144 154 130" />
              </g>
              <path d="M92 118 Q92 100 108 104 Q117 108 110 120 Q104 128 96 126 Q92 124 92 118 Z" fill="#fff" stroke="#111" strokeWidth="2.5" />
              <path d="M148 118 Q148 100 132 104 Q123 108 130 120 Q136 128 144 126 Q148 124 148 118 Z" fill="#fff" stroke="#111" strokeWidth="2.5" />
            </g>
          )}

          {/* Casco de Iron Man (Marvel) — cubre la cara */}
          {equipped.includes('mv_ironman') && (
            <g className="cat__acc">
              <path d="M66 112 Q66 56 120 54 Q174 56 174 112 Q174 140 158 150 L82 150 Q66 140 66 112 Z" fill="#b3122a" />
              <path d="M84 96 Q120 88 156 96 L150 140 Q120 156 90 140 Z" fill="#e6b422" stroke="#c99a12" strokeWidth="1.5" />
              <path d="M96 112 q10 -6 20 -1 l-2 7 q-9 -3 -18 1 z" fill="#bfe9ff" stroke="#7fbfe0" strokeWidth="1" />
              <path d="M144 112 q-10 -6 -20 -1 l2 7 q9 -3 18 1 z" fill="#bfe9ff" stroke="#7fbfe0" strokeWidth="1" />
              <g stroke="#c99a12" strokeWidth="1.6" strokeLinecap="round">
                <line x1="106" y1="132" x2="134" y2="132" />
                <line x1="108" y1="137" x2="132" y2="137" />
              </g>
            </g>
          )}

          {/* ===== Premios GLAM de carita ===== */}

          {/* Maquillaje coqueto: labios + pestañas (Glam) */}
          {equipped.includes('gl_makeup') && (
            <g className="cat__acc">
              <g stroke="#3a2b36" strokeWidth="2" strokeLinecap="round">
                <path d="M86 106 l-6 -4" />
                <path d="M90 103 l-4 -5" />
                <path d="M154 106 l6 -4" />
                <path d="M150 103 l4 -5" />
              </g>
              <path d="M107 130 Q113 127 120 129 Q127 127 133 130 Q128 141 120 142 Q112 141 107 130 Z" fill="#d61f52" />
              <path d="M111 131 Q120 134 129 131" fill="none" stroke="#8e1038" strokeWidth="1.3" />
              <ellipse cx="115" cy="133" rx="2.2" ry="1.3" fill="#fff" opacity="0.55" />
            </g>
          )}

          {/* Aretes de joya (Glam) — gema rosa redonda (no lágrima) */}
          {equipped.includes('gl_earrings') && (
            <g className="cat__acc">
              <circle cx="72" cy="139" r="2" fill="#ffd94a" />
              <line x1="72" y1="141" x2="72" y2="146" stroke="#e8c34a" strokeWidth="1.5" />
              <circle cx="72" cy="150" r="4.6" fill="#ff5fb0" stroke="#e03d90" strokeWidth="0.9" />
              <circle cx="70.4" cy="148.4" r="1.3" fill="#fff" opacity="0.85" />
              <circle cx="168" cy="139" r="2" fill="#ffd94a" />
              <line x1="168" y1="141" x2="168" y2="146" stroke="#e8c34a" strokeWidth="1.5" />
              <circle cx="168" cy="150" r="4.6" fill="#ff5fb0" stroke="#e03d90" strokeWidth="0.9" />
              <circle cx="166.4" cy="148.4" r="1.3" fill="#fff" opacity="0.85" />
            </g>
          )}

          {/* Moño de encaje (Glam) */}
          {equipped.includes('gl_lacebow') && (
            <g className="cat__acc">
              <path d="M90 56 q-18 -12 -18 4 q0 14 18 6 z" fill="#2a2433" />
              <path d="M90 56 q18 -12 18 4 q0 14 -18 6 z" fill="#2a2433" />
              <circle cx="90" cy="62" r="6" fill="#4a4356" />
              <g fill="#6a6280">
                <circle cx="80" cy="58" r="1.2" />
                <circle cx="84" cy="63" r="1.2" />
                <circle cx="100" cy="58" r="1.2" />
                <circle cx="96" cy="63" r="1.2" />
              </g>
            </g>
          )}

          {/* Antifaz de encaje (Glam) — deja ver los ojitos */}
          {equipped.includes('gl_mask') && (
            <g className="cat__acc">
              <path
                fillRule="evenodd"
                d="M70 104 Q120 92 170 104 Q168 124 150 126 Q132 128 120 120 Q108 128 90 126 Q72 124 70 104 Z M86 112 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0 Z M130 112 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0 Z"
                fill="#241f2e"
              />
              <path d="M70 104 l-8 -3 M170 104 l8 -3" stroke="#241f2e" strokeWidth="3" strokeLinecap="round" />
              <g stroke="#5a5270" strokeWidth="1" fill="none">
                <path d="M100 100 q4 4 0 8" />
                <path d="M140 100 q-4 4 0 8" />
              </g>
            </g>
          )}
        </g>

        {/* zzz al dormir */}
        {sleeping && (
          <text className="cat__zzz" x="168" y="96" fontSize="20" fill={c.earIn} fontWeight="800">
            z
          </text>
        )}
      </svg>
    </button>
  )
}
