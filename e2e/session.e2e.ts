import { expect, test } from '@playwright/test'
import { answer, answerField, importFresh, localDay, progressRow, startSession } from './helpers'

test.describe('configuration', () => {
  test('trois sens avec les noms de langue, nombre de cartes ≥ 1', async ({ page }) => {
    await importFresh(page, { sample: 'fr-en-minimal.csv' })
    await page.getByRole('button', { name: 'Réviser' }).click()
    for (const mode of ['fr → en', 'en → fr', 'Mélangé']) await expect(page.getByLabel(mode)).toBeVisible()

    await page.getByLabel('Nombre de cartes').fill('0')
    await expect(page.getByRole('button', { name: 'Commencer' })).toBeDisabled()
    await expect(page.getByText('Indiquez un nombre entier d’au moins 1.')).toBeVisible()
  })

  test('derniers choix mémorisés', async ({ page }) => {
    await importFresh(page, { sample: 'fr-en-minimal.csv' })
    await startSession(page, 'en → fr', 3)
    await page.getByRole('button', { name: 'Arrêter' }).click()
    await page.getByRole('button', { name: 'Réviser' }).click()
    await expect(page.getByLabel('en → fr')).toBeChecked()
    await expect(page.getByLabel('Nombre de cartes')).toHaveValue('3')
  })

  test('pas assez de cartes : session avec ce qui est disponible, utilisateur informé', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog\nchat;cat' })
    await startSession(page, 'fr → en', 20)
    await expect(page.getByText('Seulement 3 cartes à réviser aujourd’hui sur les 20 demandées.')).toBeVisible()
    await expect(page.getByText('1 / 3')).toBeVisible()
  })

  test('rien à réviser : la session ne démarre pas, prochaine date indiquée', async ({ page }) => {
    const csv = `fr;en;maitrise_fr_en;revu_fr_en\nmaison;house;5;${localDay()}`
    await importFresh(page, { csv })
    await page.getByRole('button', { name: 'Réviser' }).click()
    await page.getByLabel('fr → en').check()
    await expect(page.getByText(/Rien à réviser dans ce sens aujourd’hui\. Prochaine révision : /)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Commencer' })).toBeDisabled()
    // Le sens inverse est Nouveau, donc disponible.
    await page.getByLabel('en → fr').check()
    await expect(page.getByRole('button', { name: 'Commencer' })).toBeEnabled()
  })

  test('mode mélangé : jamais deux fois le même mot', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nun;one\ndeux;two\ntrois;three\nquatre;four\ncinq;five' })
    await startSession(page, 'Mélangé', 10)
    await expect(page.getByText('Seulement 5 cartes à réviser aujourd’hui sur les 10 demandées.')).toBeVisible()
    const seen = new Set<string>()
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`${i} / 5`)).toBeVisible()
      const prompt = (await page.locator('.prompt').textContent())!.trim()
      const word = ['un', 'one', 'deux', 'two', 'trois', 'three', 'quatre', 'four', 'cinq', 'five'].indexOf(prompt) >> 1
      expect(seen.has(String(word))).toBe(false)
      seen.add(String(word))
      await answer(page, 'x')
      await page.getByRole('button', { name: i === 5 ? 'Voir le bilan' : 'Suivant' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Bilan' })).toBeVisible()
  })
})

test.describe('saisie et vérification', () => {
  const cases = [
    { name: 'casse et espaces ignorés', csv: 'fr;en\nmaison;house', mode: 'fr → en', typed: ' House ', feedback: 'Juste !' },
    { name: 'réponses multiples', csv: 'fr;en\nélève;pupil / student', mode: 'fr → en', typed: 'student', feedback: 'Juste !' },
    { name: 'pas de tolérance aux articles', csv: 'fr;en\nla maison;the house', mode: 'en → fr', typed: 'maison', feedback: 'Faux.' },
    { name: 'pas de tolérance aux fautes de frappe', csv: 'fr;en\nmaison;house', mode: 'fr → en', typed: 'hosue', feedback: 'Faux.' },
    { name: 'réponse vide comptée fausse', csv: 'fr;en\nmaison;house', mode: 'fr → en', typed: '', feedback: 'Faux.' },
    { name: 'accents manquants', csv: 'fr;en\nété;summer', mode: 'en → fr', typed: 'ete', feedback: 'Juste, mais attention aux accents : été' },
    { name: 'accents erronés', csv: 'fr;en\nélève;pupil', mode: 'en → fr', typed: 'éléve', feedback: 'Juste, mais attention aux accents : élève' },
  ]

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await importFresh(page, { csv: c.csv })
      await startSession(page, c.mode, 1)
      await answer(page, c.typed)
      await expect(page.locator('.feedback')).toHaveText(c.feedback)
    })
  }

  test('après une réponse fausse, la réponse attendue est affichée', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house / home' })
    await startSession(page, 'fr → en', 1)
    await answer(page, 'flat')
    await expect(page.getByText('Réponses acceptées : house / home')).toBeVisible()
  })

  test('le champ a le focus ; Entrée valide puis passe à la carte suivante', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog' })
    await startSession(page, 'fr → en', 2)
    await expect(answerField(page)).toBeFocused()
    await page.keyboard.type('zzz')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Faux.')).toBeVisible()
    await expect(answerField(page)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByText('2 / 2')).toBeVisible()
    await expect(answerField(page)).toHaveValue('')
    await expect(answerField(page)).toBeFocused()
  })
})

test.describe('progression et bilan', () => {
  test('« j’avais juste » compte la carte comme juste, pour la maîtrise et le bilan', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house' })
    expect(await progressRow(page, 'Nouveau')).toEqual(['1', '1'])
    await startSession(page, 'fr → en', 1)
    await answer(page, 'home')
    await expect(page.getByText('Faux.')).toBeVisible()
    await page.getByRole('button', { name: 'J’avais juste' }).click()
    await expect(page.getByText('Corrigé : compté comme juste.')).toBeVisible()
    await page.getByRole('button', { name: 'Voir le bilan' }).click()
    await expect(page.getByText('1 juste')).toBeVisible()
    await expect(page.getByText('0 fausse')).toBeVisible()
    await page.getByRole('button', { name: 'Accueil' }).click()
    expect(await progressRow(page, 'En apprentissage')).toEqual(['1', '0'])
  })

  test('bilan : compteurs et liste des cartes ratées', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog\nchat;cat' })
    await startSession(page, 'fr → en', 3)
    const answers: Record<string, string> = { maison: 'house', chien: 'cat', chat: 'cat' }
    for (let i = 1; i <= 3; i++) {
      const prompt = (await page.locator('.prompt').textContent())!.trim()
      await answer(page, answers[prompt])
      await page.getByRole('button', { name: i === 3 ? 'Voir le bilan' : 'Suivant' }).click()
    }
    await expect(page.getByText('2 justes')).toBeVisible()
    await expect(page.getByText('1 fausse')).toBeVisible()
    const missed = page.getByRole('row').filter({ hasText: 'chien' })
    await expect(missed).toContainText('dog')
    await expect(missed).toContainText('votre réponse : cat')
  })

  test('progression conservée après un rechargement en cours de session', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog' })
    await startSession(page, 'fr → en', 2)
    const prompt = (await page.locator('.prompt').textContent())!.trim()
    await answer(page, prompt === 'maison' ? 'house' : 'dog')
    await expect(page.getByText('Juste !')).toBeVisible()
    await page.reload()
    expect(await progressRow(page, 'En apprentissage')).toEqual(['1', '0'])
    expect(await progressRow(page, 'Nouveau')).toEqual(['1', '2'])
    await expect(page.getByText('Des progrès ne sont pas encore sauvegardés dans un fichier.', { exact: false })).toBeVisible()
  })

  test('interruption : réponses enregistrées, bilan partiel', async ({ page }) => {
    await importFresh(page, { csv: 'fr;en\nmaison;house\nchien;dog\nchat;cat' })
    await startSession(page, 'fr → en', 3)
    await answer(page, 'x')
    await page.getByRole('button', { name: 'Arrêter' }).click()
    await expect(page.getByText('Session interrompue : 1 carte sur 3.')).toBeVisible()
    await page.getByRole('button', { name: 'Accueil' }).click()
    expect(await progressRow(page, 'En apprentissage')).toEqual(['1', '0'])
    expect(await progressRow(page, 'Nouveau')).toEqual(['2', '3'])
  })
})
