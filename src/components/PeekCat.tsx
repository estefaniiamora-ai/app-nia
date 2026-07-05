import { motion } from 'framer-motion'
import { useApp } from '../store/store'
import { effectiveLook } from '../data/shop'
import { SKINS } from './Cat/Cat'
import './PeekCat.css'

/**
 * Gatito CHISMOSO: se asoma trepando por el borde superior de la hoja,
 * con las paticas agarradas al filo y los ojitos mirando de lado a lado
 * "¿qué haces?". Usa el skin desbloqueado. Va SIEMPRE solo (mientras la
 * hoja está abierta se esconden los demás gatos) para no romper la ilusión.
 */
export default function PeekCat() {
  const { gamification, goalsMet } = useApp()
  const look = effectiveLook(gamification, new Date().getMonth() + 1, goalsMet)
  const c = SKINS[look.skin] ?? SKINS.pink

  return (
    <motion.div
      className="peekcat"
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 64, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.18 }}
    >
      {/* burbujita coqueta */}
      <motion.span
        className="peekcat__bubble"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 400, damping: 16 }}
      >
        👀 ¿qué haces?
      </motion.span>

      {/* balanceo + ladeo curioso continuo */}
      <motion.div
        className="peekcat__bob"
        animate={{ y: [0, -4, 0], rotate: [0, -2.5, 0, 2.5, 0] }}
        transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 170 138" width="132" xmlns="http://www.w3.org/2000/svg">
          {/* orejas */}
          <path d="M40 58 L50 16 L82 44 Z" fill={c.ear} />
          <path d="M130 58 L120 16 L88 44 Z" fill={c.ear} />
          <path d="M49 50 L55 28 L71 44 Z" fill={c.earIn} />
          <path d="M121 50 L115 28 L99 44 Z" fill={c.earIn} />

          {/* cabeza */}
          <circle cx="85" cy="76" r="52" fill={c.body} />

          {/* cachetes */}
          <ellipse cx="55" cy="90" rx="12" ry="7" fill="#ff7aa8" opacity="0.5" />
          <ellipse cx="115" cy="90" rx="12" ry="7" fill="#ff7aa8" opacity="0.5" />

          {/* ojos que miran de lado a lado (chismoseando) */}
          <g className="peekcat__eyes">
            <ellipse cx="66" cy="78" rx="9" ry="12" fill="#4a3b46" />
            <ellipse cx="104" cy="78" rx="9" ry="12" fill="#4a3b46" />
            <motion.g
              animate={{ x: [0, 3.5, 3.5, -3.5, -3.5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', times: [0, 0.15, 0.45, 0.6, 0.9, 1] }}
            >
              <circle cx="69" cy="75" r="3" fill="#fff" />
              <circle cx="107" cy="75" r="3" fill="#fff" />
            </motion.g>
          </g>

          {/* nariz + boquita */}
          <path d="M81 92 h8 l-4 5 z" fill={c.earIn} />
          <path
            d="M85 97 q-6 7 -12 2 M85 97 q6 7 12 2"
            fill="none"
            stroke="#4a3b46"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* bigotes */}
          <g stroke="#4a3b46" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
            <line x1="30" y1="84" x2="50" y2="86" />
            <line x1="30" y1="94" x2="50" y2="93" />
            <line x1="140" y1="84" x2="120" y2="86" />
            <line x1="140" y1="94" x2="120" y2="93" />
          </g>

          {/* paticas agarradas al filo */}
          <ellipse cx="56" cy="126" rx="17" ry="13" fill={c.body} stroke={c.shade} strokeWidth="1.5" />
          <ellipse cx="114" cy="126" rx="17" ry="13" fill={c.body} stroke={c.shade} strokeWidth="1.5" />
          <g stroke={c.shade} strokeWidth="1.4" strokeLinecap="round">
            <line x1="49" y1="122" x2="49" y2="130" />
            <line x1="56" y1="123" x2="56" y2="131" />
            <line x1="63" y1="122" x2="63" y2="130" />
            <line x1="107" y1="122" x2="107" y2="130" />
            <line x1="114" y1="123" x2="114" y2="131" />
            <line x1="121" y1="122" x2="121" y2="130" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  )
}
