import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/store'
import { effectiveLook } from '../data/shop'
import Cat, { type CatContext } from './Cat/Cat'
import DraggableCat from './DraggableCat'

/** Gatito de la barra: aparece deslizándose desde el costado (derecha) y se
 *  esconde por el mismo lado al salir. La visibilidad la decide <Layout> con
 *  <AnimatePresence>. */
export const BUDDY_SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const

export const ROUTE_CONTEXT: Record<string, CatContext> = {
  '/movimientos': 'movements',
  '/cuentas': 'accounts',
  '/estadisticas': 'stats',
  '/ajustes': 'settings',
  '/notas': 'notes',
}

export default function BuddyCat({ context }: { context: CatContext }) {
  const { gamification } = useApp()
  const wander = true // el gatito siempre está "Mucho" (anda haciendo cositas)
  const look = effectiveLook(gamification, new Date().getMonth() + 1)
  const [dragging, setDragging] = useState(false)
  return (
    <motion.div
      className="screencat"
      initial={{ x: 110, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 110, opacity: 0 }}
      transition={BUDDY_SPRING}
    >
      {/* mientras lo arrastras se pausa la caminata para que no se "escape" */}
      <div
        className={`screencat__walk ${wander ? 'screencat__walk--on' : ''} ${
          dragging ? 'screencat__walk--paused' : ''
        }`}
      >
        <DraggableCat onDraggingChange={setDragging}>
          <Cat size={68} equipped={look.equipped} skin={look.skin} context={context} alive />
        </DraggableCat>
      </div>
    </motion.div>
  )
}
