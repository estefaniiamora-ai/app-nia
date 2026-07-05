import { motion, useAnimationControls } from 'framer-motion'
import { useState, type ReactNode } from 'react'

/**
 * Envuelve al gatito para poder ARRASTRARLO por la pantalla. Mientras lo
 * sostienes se agranda, se menea contento y suelta chispitas; al soltarlo
 * NO se devuelve de golpe: cae de vuelta a su lugar con un resorte suave y
 * un rebotecito natural (el centro en Inicio, o su rincón sobre la barra).
 * El toque simple (sin arrastrar) sigue disparando las reacciones del gato.
 */
export default function DraggableCat({
  children,
  className,
  onDraggingChange,
}: {
  children: ReactNode
  className?: string
  onDraggingChange?: (dragging: boolean) => void
}) {
  const [dragging, setDragging] = useState(false)
  const controls = useAnimationControls()

  return (
    <motion.div
      className={className}
      drag
      dragMomentum={false}
      animate={controls}
      whileDrag={{ scale: 1.18 }}
      onDragStart={() => {
        setDragging(true)
        onDraggingChange?.(true)
      }}
      onDragEnd={() => {
        setDragging(false)
        onDraggingChange?.(false)
        // regreso a su sitio: resorte lento, flotadito y con peso, con un
        // rebotecito suave al final. Nada de tirón instantáneo.
        controls.start({
          x: 0,
          y: 0,
          scale: 1,
          transition: { type: 'spring', stiffness: 55, damping: 11, mass: 1.8 },
        })
      }}
      style={{
        display: 'inline-block',
        position: 'relative',
        zIndex: dragging ? 60 : undefined,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none', // en móvil, arrastrar el gato no hace scroll
      }}
    >
      {/* meneo vivo + saltitos mientras lo sostienes (independiente del arrastre) */}
      <motion.div
        animate={
          dragging
            ? { rotate: [0, -13, 11, -9, 7, -4, 0], y: [0, -5, 0], scale: [1, 1.04, 1] }
            : { rotate: 0, y: 0, scale: 1 }
        }
        transition={
          dragging
            ? {
                rotate: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 0.44, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
              }
            : { type: 'spring', stiffness: 300, damping: 18 }
        }
        style={{ display: 'inline-block' }}
      >
        {children}
      </motion.div>

      {/* chispitas coquetas mientras lo sostienes */}
      {dragging && (
        <>
          <motion.span
            style={{ position: 'absolute', left: '2%', top: '4%', fontSize: 18, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: [-2, -16, -22], scale: [0.5, 1, 0.7] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
          >
            ✨
          </motion.span>
          <motion.span
            style={{ position: 'absolute', right: '2%', top: '16%', fontSize: 16, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: [0, -14, -20], scale: [0.5, 1, 0.7] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.35, ease: 'easeOut' }}
          >
            💗
          </motion.span>
          <motion.span
            style={{ position: 'absolute', left: '46%', top: '-6%', fontSize: 14, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: [-2, -12, -18], scale: [0.5, 1, 0.7] }}
            transition={{ duration: 1.0, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
          >
            ⭐
          </motion.span>
        </>
      )}
    </motion.div>
  )
}
