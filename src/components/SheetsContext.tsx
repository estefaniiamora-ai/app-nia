import { createContext, useContext } from 'react'
import type { Movement } from '../data/types'

interface SheetsValue {
  /** abre la hoja de registro; con movimiento = modo edición */
  openAdd: (edit?: Movement | null) => void
  /** ¿hay una hoja abierta? → las pantallas esconden su propio gato para
   *  que solo se vea el gatito asomado (nunca dos gatos a la vez). */
  addOpen: boolean
}

export const SheetsContext = createContext<SheetsValue | null>(null)

export function useSheets(): SheetsValue {
  const ctx = useContext(SheetsContext)
  if (!ctx) throw new Error('useSheets debe usarse dentro de <Layout>')
  return ctx
}
