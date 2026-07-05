import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** elemento que se asoma por encima del borde superior (ej: gatito chismoso) */
  peek?: ReactNode
}

export default function Sheet({ open, onClose, title, children, peek }: SheetProps) {
  const controls = useDragControls()
  const [kb, setKb] = useState(0) // alto del teclado (px) en iOS
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Bloquear scroll de fondo mientras está abierta (html + body)
  useEffect(() => {
    if (!open) return
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [open])

  // El botón "atrás" del celular CIERRA la hoja (en vez de irse de pantalla).
  useEffect(() => {
    if (!open) return
    window.history.pushState({ niaSheet: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // si se cerró con botón/deslizar (no con "atrás"), quitamos la entrada que agregamos
      if ((window.history.state as { niaSheet?: boolean } | null)?.niaSheet) {
        window.history.back()
      }
    }
  }, [open])

  // Detectar el teclado con visualViewport y levantar la hoja por encima de él
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKb(inset)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      setKb(0)
    }
  }, [open])

  // Centrar el campo enfocado (cuando aparece el teclado)
  function handleFocus(e: FocusEvent) {
    const el = e.target as HTMLElement
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      window.setTimeout(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 280)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sheet-backdrop"
          style={{ paddingBottom: kb }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="sheet-stack">
          {peek}
          <motion.div
            className="sheet no-scrollbar"
            style={{ maxHeight: kb ? `calc(100dvh - ${kb + 12}px)` : undefined }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            onClick={(e) => e.stopPropagation()}
            onFocusCapture={handleFocus}
          >
            {/* solo el manija inicia el "deslizar para cerrar" → el cuerpo hace scroll normal */}
            <div
              className="sheet__grip-zone"
              onPointerDown={(e) => controls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <div className="sheet__grip" />
            </div>
            {title && <div className="sheet__title">{title}</div>}
            {children}
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
