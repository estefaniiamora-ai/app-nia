import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav, { Fab } from './BottomNav'
import AddSheet from './AddSheet'
import BuddyCat, { ROUTE_CONTEXT } from './BuddyCat'
import { SheetsContext } from './SheetsContext'
import type { Movement } from '../data/types'

export default function Layout() {
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState<Movement | null>(null)
  const loc = useLocation()
  const context = ROUTE_CONTEXT[loc.pathname]

  const openAdd = useCallback((m?: Movement | null) => {
    setEdit(m ?? null)
    setAddOpen(true)
  }, [])

  const value = useMemo(() => ({ openAdd, addOpen }), [openAdd, addOpen])

  return (
    <SheetsContext.Provider value={value}>
      <div className="app">
        <Outlet />

        {/* El gatito de la barra: entra/sale deslizando por el costado */}
        <AnimatePresence>
          {context && <BuddyCat key="buddy" context={context} />}
        </AnimatePresence>

        <BottomNav />
        <Fab onClick={() => openAdd(null)} open={addOpen} />
        <AddSheet
          open={addOpen}
          edit={edit}
          onClose={() => {
            setAddOpen(false)
            setEdit(null)
          }}
        />
      </div>
    </SheetsContext.Provider>
  )
}
