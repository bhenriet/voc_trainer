// Jours calendaires au format AAAA-MM-JJ, sans heure ni fuseau.
export type Day = string

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/** Jour local de l'appareil pour l'instant donné. */
export function today(now: Date = new Date()): Day {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Vrai si la chaîne est une date AAAA-MM-JJ existante (pas de 2026-02-30). */
export function isValidDay(value: string): boolean {
  const match = DAY_PATTERN.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function toUtcMs(day: Day): number {
  const match = DAY_PATTERN.exec(day)
  if (!match) throw new Error(`Date invalide : ${day}`)
  const [, y, m, d] = match.map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Ajoute (ou retire) un nombre de jours. */
export function addDays(day: Day, days: number): Day {
  const date = new Date(toUtcMs(day) + days * MS_PER_DAY)
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Nombre de jours de `from` à `to` (négatif si `to` est antérieur). */
export function daysBetween(from: Day, to: Day): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY)
}
