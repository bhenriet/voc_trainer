import type { Day } from '../domain/dates'

const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

/** « 29 octobre 2026 » pour un jour AAAA-MM-JJ. */
export function formatDay(day: Day): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayFormat.format(new Date(y, m - 1, d))
}

/** « 29 octobre 2026 à 18:00 » pour un horodatage ISO. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}
