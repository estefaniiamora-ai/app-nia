import { accountDelta, accountCurrency, countsInStats, isPersonAccount, transferInAmount } from './types'
import type { Account, Currency, ID, Movement } from './types'

/** Movimientos ordenados cronológicamente (viejo → nuevo). */
export function sortedAsc(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => a.date - b.date || a.createdAt - b.createdAt)
}

/** Movimientos del más nuevo al más viejo (para listas). */
export function sortedDesc(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => b.date - a.date || b.createdAt - a.createdAt)
}

/** Saldo actual de una cuenta. */
export function accountBalance(movements: Movement[], accountId: ID): number {
  let bal = 0
  for (const m of movements) bal += accountDelta(m, accountId)
  return bal
}

/** Saldos de todas las cuentas en un solo recorrido. */
export function allBalances(movements: Movement[]): Map<ID, number> {
  const map = new Map<ID, number>()
  for (const m of movements) {
    if (m.type === 'income' || m.type === 'expense' || m.type === 'adjust') {
      map.set(m.accountId, (map.get(m.accountId) ?? 0) + accountDelta(m, m.accountId))
    } else if (m.type === 'transfer') {
      map.set(m.accountId, (map.get(m.accountId) ?? 0) - m.amount)
      // pendiente: el destino aún no recibe
      if (m.toAccountId && !m.pending)
        map.set(m.toAccountId, (map.get(m.toAccountId) ?? 0) + transferInAmount(m))
    }
  }
  return map
}

/** Totales del patrimonio separados por moneda (nunca se mezclan). */
export type CurrencyTotals = Record<Currency, number>

export function totalsByCurrency(accounts: Account[], movements: Movement[]): CurrencyTotals {
  const balances = allBalances(movements)
  const totals: CurrencyTotals = { COP: 0, USD: 0 }
  for (const a of accounts) {
    if (a.archived || a.deleted || isPersonAccount(a)) continue // las personas van aparte
    totals[accountCurrency(a)] += balances.get(a.id) ?? 0
  }
  return totals
}

/** Resumen de deudas (cuentas de persona activas):
 *  te deben = saldos en positivo, debes = |saldos en negativo|. En COP. */
export interface DebtSummary {
  owed: number   // te deben (centavos, ≥ 0)
  debt: number   // le debes (centavos, ≥ 0)
}
export function debtSummary(accounts: Account[], movements: Movement[]): DebtSummary {
  const balances = allBalances(movements)
  let owed = 0
  let debt = 0
  for (const a of accounts) {
    if (a.archived || a.deleted || !isPersonAccount(a)) continue
    const bal = balances.get(a.id) ?? 0
    if (bal > 0) owed += bal
    else if (bal < 0) debt += -bal
  }
  return { owed, debt }
}

/** Transferencias pendientes (dinero que salió pero aún no ha llegado). */
export function pendingTransfers(movements: Movement[]): Movement[] {
  return movements.filter((m) => m.type === 'transfer' && m.pending)
}

/** Saldo total (sólo cuentas reales no archivadas; las personas van aparte). */
export function totalBalance(accounts: Account[], movements: Movement[]): number {
  const balances = allBalances(movements)
  let total = 0
  for (const a of accounts) {
    if (!a.archived && !a.deleted && !isPersonAccount(a)) total += balances.get(a.id) ?? 0
  }
  return total
}

/** Mapa movimientoId → saldo resultante de su(s) cuenta(s) tras ese movimiento.
 *  Esto es el "devolverse en el tiempo": cada movimiento muestra en cuánto
 *  quedó la cuenta. Se calcula reproduciendo en orden cronológico. */
export interface BalanceAfter {
  account: number
  toAccount?: number
}
export function balancesAfter(movements: Movement[]): Map<ID, BalanceAfter> {
  const running = new Map<ID, number>()
  const result = new Map<ID, BalanceAfter>()
  for (const m of sortedAsc(movements)) {
    if (m.type === 'transfer') {
      running.set(m.accountId, (running.get(m.accountId) ?? 0) - m.amount)
      const after: BalanceAfter = { account: running.get(m.accountId)! }
      if (m.toAccountId) {
        if (!m.pending)
          running.set(m.toAccountId, (running.get(m.toAccountId) ?? 0) + transferInAmount(m))
        after.toAccount = running.get(m.toAccountId) ?? 0
      }
      result.set(m.id, after)
    } else {
      const d = accountDelta(m, m.accountId)
      running.set(m.accountId, (running.get(m.accountId) ?? 0) + d)
      result.set(m.id, { account: running.get(m.accountId)! })
    }
  }
  return result
}

/* ----------------- Estadísticas por categoría ----------------- */
export interface CategoryStat {
  categoryId: ID
  income: number   // entró (centavos)
  expense: number  // salió (centavos)
  net: number      // income - expense
}

export function categoryStats(
  movements: Movement[],
  fromTs: number,
  toTs: number,
): CategoryStat[] {
  const map = new Map<ID, CategoryStat>()
  for (const m of movements) {
    if (!countsInStats(m)) continue
    if (m.date < fromTs || m.date > toTs) continue
    if (!m.categoryId) continue
    const cur = map.get(m.categoryId) ?? {
      categoryId: m.categoryId,
      income: 0,
      expense: 0,
      net: 0,
    }
    if (m.type === 'income') cur.income += m.amount
    else cur.expense += m.amount
    cur.net = cur.income - cur.expense
    map.set(m.categoryId, cur)
  }
  return [...map.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
}

/** Totales de ingreso y gasto en un periodo. */
export function periodTotals(movements: Movement[], fromTs: number, toTs: number) {
  let income = 0
  let expense = 0
  for (const m of movements) {
    if (m.date < fromTs || m.date > toTs) continue
    if (m.type === 'income') income += m.amount
    else if (m.type === 'expense') expense += m.amount
  }
  return { income, expense, net: income - expense }
}
