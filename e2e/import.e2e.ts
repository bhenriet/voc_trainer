import { expect, test } from '@playwright/test'
import { chooseFile, importFresh, openImport } from './helpers'

test('premier lancement : invitation à importer avec un exemple de format', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
  await expect(page.locator('pre')).toContainText('fr;en')
  await expect(page.locator('pre')).toContainText('maison;house')
  await expect(page.getByRole('button', { name: 'Importer un fichier CSV' })).toBeVisible()
})

test('premier import : enregistré sans confirmation, avec récapitulatif', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-minimal.csv' })
  await expect(page.getByText('Import terminé.')).toBeVisible()
  await expect(page.getByText('10 mots (fr ↔ en)')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'fr ↔ en' })).toBeVisible()
  await expect(page.getByText('10 mots', { exact: true })).toBeVisible()
})

test('import sur des données existantes : avertissement chiffré, annulation puis remplacement', async ({ page }) => {
  await importFresh(page, { sample: 'fr-en-minimal.csv' })

  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-progression.csv' })
  await expect(
    page.getByText('Remplacer les 10 mots enregistrés et leur progression par les 3 mots du fichier ?'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByText('10 mots', { exact: true })).toBeVisible()

  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-progression.csv' })
  await page.getByRole('button', { name: 'Remplacer' }).click()
  await expect(page.getByText('Import terminé.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByText('3 mots', { exact: true })).toBeVisible()
})

test('séparateur : « ; » par défaut, « , » au choix', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await expect(page.getByLabel('Point-virgule « ; »')).toBeChecked()
  await chooseFile(page, { sample: 'fr-en-virgule.csv' })
  await expect(page.getByText(/Vérifiez le séparateur/)).toBeVisible()

  await page.getByLabel('Virgule « , »').check()
  await expect(page.getByText('Import terminé.')).toBeVisible()
  await expect(page.getByText('2 mots (fr ↔ en)')).toBeVisible()
})

test('lignes ignorées, progressions invalides et colonnes non reconnues sont signalées', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-erreurs.csv' })
  await expect(page.getByText('Import terminé.')).toBeVisible()
  await expect(page.getByText('3 mots (fr ↔ en)')).toBeVisible()
  await expect(page.getByText('1 ligne ignorée (une langue vide)')).toBeVisible()
  await expect(page.getByText('2 progressions invalides remises à « Nouveau »')).toBeVisible()
  await expect(page.getByText(/Colonnes non reconnues, ignorées : categorie/)).toBeVisible()
})

for (const sample of ['invalide-une-colonne.csv', 'invalide-aucune-ligne.csv']) {
  test(`fichier refusé sans toucher aux données : ${sample}`, async ({ page }) => {
    await importFresh(page, { sample: 'fr-en-minimal.csv' })
    await openImport(page)
    await chooseFile(page, { sample })
    await expect(page.locator('.notice.error')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remplacer' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Retour' }).click()
    await expect(page.getByText('10 mots', { exact: true })).toBeVisible()
  })
}
