import { expect, test } from '@playwright/test'
import { chooseFile, confirmImport, importFresh, openImport, pasteList } from './helpers'

test('premier lancement : invitation à importer avec un exemple de format', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
  await expect(page.locator('pre')).toContainText('fr;en')
  await expect(page.locator('pre')).toContainText('maison;house')
  await expect(page.getByRole('button', { name: 'Étudier un jeu de cartes', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ajouter des cartes de vocabulaire', exact: true })).toBeVisible()
})

test('premier import : langues affichées avant validation, puis récapitulatif', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-minimal.csv' })
  await expect(page.getByText('Langues : fr ↔ en.')).toBeVisible()
  await expect(page.getByText('10 mots (fr ↔ en)')).toBeVisible()
  await expect(page.getByText('Import terminé.')).toHaveCount(0)
  await confirmImport(page)
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
  await confirmImport(page, 'Remplacer')
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
  await expect(page.getByText('2 mots (fr ↔ en)')).toBeVisible()
  await confirmImport(page)
  await expect(page.getByText('Import terminé.')).toBeVisible()
})

test('lignes ignorées, progressions invalides et colonnes non reconnues sont signalées', async ({ page }) => {
  await page.goto('./')
  await openImport(page)
  await chooseFile(page, { sample: 'fr-en-erreurs.csv' })
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

const PASTED = [
  'Mot NL\tMot FR',
  'Goeiedag!\tBonjour !',
  'Hallo!\tSalut !',
  'Hei!\tSalut !',
  'Beste Anja,\tChère Anja,',
].join('\n')

test('collage depuis un tableur : tabulation reconnue, langues affichées avant validation', async ({ page }) => {
  await page.goto('./')
  await openImport(page, 'append')
  await pasteList(page, PASTED)
  await expect(page.getByText('Langues : Mot NL ↔ Mot FR.')).toBeVisible()
  await expect(page.getByText('4 mots à ajouter au jeu Mot NL ↔ Mot FR')).toBeVisible()
  await confirmImport(page, 'Ajouter')
  await expect(page.getByText('Ajout terminé.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'Mot NL ↔ Mot FR' })).toBeVisible()
  await expect(page.getByText('4 mots', { exact: true })).toBeVisible()
})

test('collage refusé sans ligne de titres exploitable', async ({ page }) => {
  await page.goto('./')
  await openImport(page, 'append')
  await pasteList(page, 'nl\n')
  await expect(page.locator('.notice.error')).toBeVisible()
})

test('ajout sans titres : la première ligne est un mot, les langues du jeu sont conservées', async ({ page }) => {
  await importFresh(page, { csv: 'nl;fr\nhuis;maison' })
  await openImport(page, 'append')
  await expect(page.getByLabel('Ma liste contient une colonne de titres')).not.toBeChecked()
  await pasteList(page, 'Goeiedag!\tBonjour !\nHallo!\tSalut !')
  await expect(page.getByText('2 mots à ajouter au jeu nl ↔ fr')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remplacer', exact: true })).toHaveCount(0)
  await confirmImport(page, 'Ajouter')
  await expect(page.getByText('(total : 3 mots)')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'nl ↔ fr' })).toBeVisible()
  await expect(page.getByText('3 mots', { exact: true })).toBeVisible()
})

test('ajout avec titres : correspondance des langues informative, langues du jeu inchangées', async ({ page }) => {
  await importFresh(page, { csv: 'nl;fr\nhuis;maison' })
  await openImport(page, 'append')
  await pasteList(page, PASTED)
  await page.getByLabel('Ma liste contient une colonne de titres').check()
  await expect(page.getByText('nl ↔ Mot NL, fr ↔ Mot FR')).toBeVisible()
  await expect(page.getByText('4 mots à ajouter au jeu nl ↔ fr')).toBeVisible()
  await confirmImport(page, 'Ajouter')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'nl ↔ fr' })).toBeVisible()
  await expect(page.getByText('5 mots', { exact: true })).toBeVisible()
})

test('ajout : la progression du fichier est ignorée et signalée', async ({ page }) => {
  await importFresh(page, { csv: 'fr;en\nmaison;house' })
  await openImport(page, 'append')
  await chooseFile(page, { csv: 'fr;en;maitrise_fr_en;revu_fr_en\nchien;dog;S:12.4|D:5.3;2026-10-28' })
  await page.getByLabel('Ma liste contient une colonne de titres').check()
  await expect(page.getByText(/Colonnes de progression ignorées : maitrise_fr_en, revu_fr_en/)).toBeVisible()
  await confirmImport(page, 'Ajouter')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByText('2 mots', { exact: true })).toBeVisible()
})
