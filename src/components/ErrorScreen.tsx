import Cat, { type CatMood } from './Cat/Cat'
import './ErrorScreen.css'

interface Props {
  code?: string
  title: string
  message: string
  actionLabel: string
  onAction: () => void
  mood?: CatMood
  speech?: string
}

export default function ErrorScreen({
  code,
  title,
  message,
  actionLabel,
  onAction,
  mood = 'sad',
  speech,
}: Props) {
  return (
    <div className="errscreen">
      {/* decoración flotante */}
      <span className="errscreen__spark s1">✨</span>
      <span className="errscreen__spark s2">🐾</span>
      <span className="errscreen__spark s3">💔</span>

      <div className="errscreen__card">
        {code && <div className="errscreen__code">{code}</div>}
        <div className="errscreen__cat">
          <Cat size={156} mood={mood} alive speech={speech} />
        </div>
        <h1 className="errscreen__title">{title}</h1>
        <p className="errscreen__msg">{message}</p>
        <button className="btn btn--primary btn--block" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
