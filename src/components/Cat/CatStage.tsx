import type { ReactNode } from 'react'
import './catstage.css'

const DECOR: Record<string, string[]> = {
  sky: ['☁️', '☁️', '✨'],
  hearts: ['💕', '💗', '💖'],
  mint: ['🌿', '🍃', '✨'],
  night: ['🌙', '⭐', '✨'],
  none: [],
}

interface Props {
  background: string
  children: ReactNode
  /** tamaño del escenario (cuadrado), default auto */
  size?: number
}

export default function CatStage({ background, children, size }: Props) {
  const decor = DECOR[background] ?? []
  return (
    <div className="catstage" style={size ? { width: size, height: size } : undefined}>
      <div className={`catstage__bg catstage__bg--${background}`}>
        {decor.map((e, i) => (
          <span key={i} className={`catstage__decor d${i}`}>
            {e}
          </span>
        ))}
      </div>
      <div className="catstage__cat">{children}</div>
    </div>
  )
}
