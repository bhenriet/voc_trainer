import { expect, type Page } from '@playwright/test'
import path from 'node:path'

export const SAMPLES = path.resolve(import.meta.dirname, '../samples')

/** Jour local AAAA-MM-JJ (même horloge que le navigateur de test). */
export function localDay(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ouvre l'écran d'import depuis l'accueil, qu'il y ait déjà un vocabulaire ou non. */
export async function openImport(page: Page) {
  const first = page.getByRole('button', { name: 'Importer un fichier CSV' })
  const other = page.getByRole('button', { name: 'Importer un autre fichier' })
  await expect(first.or(other)).toBeVisible()
  if (await first.isVisible()) await first.click()
  else await other.click()
}

/** Choisit un fichier : chemin d'un exemple de samples/ ou contenu CSV en ligne. */
export async function chooseFile(page: Page, file: { sample: string } | { csv: string }) {
  const input = page.getByLabel('Fichier CSV')
  if ('sample' in file) await input.setInputFiles(path.join(SAMPLES, file.sample))
  else await input.setInputFiles({ name: 'vocabulaire.csv', mimeType: 'text/csv', buffer: Buffer.from(file.csv) })
}

/** Importe un fichier sur un appareil vierge et revient à l'accueil. */
export async function importFresh(page: Page, file: { sample: string } | { csv: string }) {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, file)
  await expect(page.getByText('Import terminé.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('button', { name: 'Réviser' })).toBeVisible()
}

/** Lance une session depuis l'accueil. `mode` est le libellé affiché (« fr → en », « Mélangé »…). */
export async function startSession(page: Page, mode: string, count: number) {
  await page.getByRole('button', { name: 'Réviser' }).click()
  await page.getByLabel(mode).check()
  await page.getByLabel('Nombre de cartes').fill(String(count))
  await page.getByRole('button', { name: 'Commencer' }).click()
}

export function answerField(page: Page) {
  return page.getByLabel(/^Traduction en/)
}

export async function answer(page: Page, text: string) {
  await answerField(page).fill(text)
  await page.getByRole('button', { name: 'Valider' }).click()
}

/** Ligne du tableau de progression de l'accueil, ex. « En apprentissage » → [fr→en, en→fr]. */
export async function progressRow(page: Page, label: string): Promise<string[]> {
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: label, exact: true }) })
  return (await row.locator('td.num, th.num').allTextContents()).map((t) => t.trim())
}

/** Aucune largeur de page supérieure à la fenêtre (pas de défilement horizontal). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}
