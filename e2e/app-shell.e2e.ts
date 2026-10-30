import { expect, test } from '@playwright/test'
import { answer, expectNoHorizontalScroll, importFresh, openImport, startSession } from './helpers'

test('aucun défilement horizontal sur chaque écran', async ({ page }) => {
  await page.goto('./')
  await expectNoHorizontalScroll(page)

  await importFresh(page, { sample: 'fr-en-minimal.csv' })
  await expectNoHorizontalScroll(page)

  await openImport(page)
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Retour' }).click()

  await page.getByRole('button', { name: 'Réviser' }).click()
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Retour' }).click()

  await startSession(page, 'fr → en', 1)
  await expectNoHorizontalScroll(page)
  await answer(page, 'une réponse fausse assez longue pour tester le retour à la ligne')
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Voir le bilan' }).click()
  await expectNoHorizontalScroll(page)
})

test('zones tactiles d’au moins 44 px de haut pour les boutons principaux', async ({ page }) => {
  await importFresh(page, { sample: 'fr-en-minimal.csv' })
  for (const name of ['Réviser', 'Exporter en CSV', 'Importer un autre fichier']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})

test('stockage persistant demandé au démarrage', async ({ page }) => {
  await page.addInitScript(() => {
    const storage = navigator.storage
    const original = storage.persist.bind(storage)
    ;(window as unknown as { persistCalls: number }).persistCalls = 0
    storage.persist = () => {
      ;(window as unknown as { persistCalls: number }).persistCalls++
      return original()
    }
  })
  await page.goto('./')
  await expect.poll(() => page.evaluate(() => (window as unknown as { persistCalls: number }).persistCalls)).toBe(1)
})

test('aucune donnée de vocabulaire envoyée sur le réseau', async ({ page, baseURL }) => {
  const requests: { method: string; url: string; body: string | null }[] = []
  page.on('request', (r) => requests.push({ method: r.method(), url: r.url(), body: r.postData() }))

  await importFresh(page, { csv: 'fr;en\nsecretmot;secretword' })
  await startSession(page, 'fr → en', 1)
  await answer(page, 'secretword')

  const origin = new URL(baseURL!).origin
  for (const r of requests) {
    expect(r.method).toBe('GET')
    expect(new URL(r.url).origin).toBe(origin)
    expect(r.url).not.toContain('secret')
    expect(r.body).toBeNull()
  }
})

test.describe('PWA', () => {
  test.skip(({ isMobile }) => isMobile, 'vérifié une seule fois, sur le projet desktop')

  test('manifeste installable et service worker actif', async ({ page }) => {
    await page.goto('./')
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
    const manifest = await (await page.request.get(new URL(manifestHref!, page.url()).href)).json()
    expect(manifest).toMatchObject({ name: 'Voc Trainer', display: 'standalone', start_url: '/voc_trainer/', scope: '/voc_trainer/' })
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active)).toBe(true)
  })

  test('fonctionne hors-ligne après une première visite : révision et import', async ({ page, context }) => {
    await page.goto('./')
    await page.evaluate(() => navigator.serviceWorker.ready)
    // Le service worker contrôle la page au chargement suivant.
    await page.reload()
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()

    await openImport(page)
    await page.getByLabel('Fichier CSV').setInputFiles({
      name: 'v.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('fr;en\nmaison;house'),
    })
    await page.getByRole('button', { name: 'Continuer' }).click()
    await startSession(page, 'fr → en', 1)
    await answer(page, 'house')
    await expect(page.getByText('Juste !')).toBeVisible()
  })
})
