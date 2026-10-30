import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { answer, chooseFile, importFresh, localDay, openImport, progressRow, startSession } from './helpers'

async function progressTable(page: Page) {
  return page.locator('table').innerText()
}

test('export : fichier complet, rappel effacé, réimport à l’identique', async ({ page }) => {
  // Vocabulaire neuf : les 3 mots sont disponibles quel que soit le jour du test.
  await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog\nchat;cat' })
  await expect(page.getByText(/Aucun export depuis l’import/)).toBeVisible()

  // Parcours complet : session mélangée (3 mots, donc 3 cartes) avant l'export.
  await startSession(page, 'Mélangé', 3)
  for (let i = 1; i <= 3; i++) {
    await answer(page, 'x')
    await page.getByRole('button', { name: i === 3 ? 'Voir le bilan' : 'Suivant' }).click()
  }
  await page.getByRole('button', { name: 'Accueil' }).click()
  await expect(page.getByText(/Des progrès ne sont pas encore sauvegardés/)).toBeVisible()
  const before = await progressTable(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter en CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^vocabulaire_fr_en_\d{4}-\d{2}-\d{2}\.csv$/)

  const file = await download.path()
  const content = await readFile(file, 'utf8')
  expect(content.startsWith('﻿')).toBe(true)
  expect(content.slice(1).split('\r\n')[0]).toBe('fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr')
  // Trois réponses fausses en mode mélangé : chaque mot a été posé dans un seul sens et y est
  // au niveau 1, révisé aujourd'hui ; l'autre sens est resté vide (Nouveau).
  const rows = content.slice(1).trim().split('\r\n').slice(1).map((r) => r.split(';'))
  expect(rows).toHaveLength(3)
  for (const [, , levelAb, levelBa, reviewedAb, reviewedBa] of rows) {
    expect([levelAb, levelBa].sort()).toEqual(['', '1'])
    expect([reviewedAb, reviewedBa].sort()).toEqual(['', localDay()])
  }

  await expect(page.getByText(/Des progrès ne sont pas encore sauvegardés/)).toHaveCount(0)
  await expect(page.getByText(/Dernier export : /)).toBeVisible()

  // Réimport du fichier exporté : même vocabulaire, même progression.
  await openImport(page)
  await page.getByLabel('Fichier CSV').setInputFiles(file)
  await page.getByRole('button', { name: 'Remplacer' }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  expect(await progressTable(page)).toBe(before)
})

test('pas d’export proposé sans vocabulaire', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Exporter en CSV' })).toHaveCount(0)
})

test('import d’un fichier avec progression : niveaux et dates repris', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, { csv: 'fr;en;maitrise_fr_en;revu_fr_en\nmaison;house;3;2026-10-28' })
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'fr ↔ en' })).toBeVisible()
  expect(await progressRow(page, 'Bien connu')).toEqual(['1', '0'])
  expect(await progressRow(page, 'Nouveau')).toEqual(['0', '1'])
})
