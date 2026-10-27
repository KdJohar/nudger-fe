import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSourceLoader } from './helpers/vueHarness.mjs'
const { INTEGRATIONS, validateIntegrations } = createSourceLoader()('src/data/integrations.ts')
const copy = () => structuredClone(INTEGRATIONS)
test('catalog rejects duplicate and unsafe paths before build', () => {
  assert.throws(() => validateIntegrations([...copy(), copy()[0]]), /duplicate/)
  for (const slug of ['../private', 'hello/world', '<script>', 'UPPER']) {
    const entries = copy(); entries[0].slug = slug
    assert.throws(() => validateIntegrations(entries), /slug/)
  }
})
test('new catalog entries require availability and complete setup instructions', () => {
  for (const key of ['name', 'status', 'published', 'requirements', 'steps']) {
    const entries = copy(); delete entries[0][key]
    assert.throws(() => validateIntegrations(entries))
  }
  const entries = copy(); entries.push({ ...copy()[0], slug: 'new-tool', name: 'New tool' })
  assert.equal(validateIntegrations(entries).at(-1).name, 'New tool')
})
test('consumer content contains no credentials or private plugin links', () => {
  const catalog = readFileSync(new URL('../src/data/integrations.json', import.meta.url), 'utf8')
  assert.doesNotMatch(catalog, /plugins_6|plugin_asdk|mcp\.plugandnudge\.com\/|fixture-refresh|Bearer [a-z0-9]/i)
  assert.equal(INTEGRATIONS.find(item => item.slug === 'chatgpt').status, 'preview')
})

test('only explicitly published entries receive routes, regardless of availability', () => {
  const load = createSourceLoader()
  const { PUBLISHED_INTEGRATIONS } = load('src/data/publicFeatures.ts')
  const { PUBLIC_PAGES } = load('src/data/publicPages.ts')
  assert.deepEqual(PUBLISHED_INTEGRATIONS.map(item => item.slug), ['odoo'])
  assert.equal(INTEGRATIONS.find(item => item.slug === 'webhooks').status, 'available')
  assert.deepEqual(PUBLIC_PAGES.filter(page => page.path.startsWith('/integrations')).map(page => page.path), ['/integrations', '/integrations/odoo'])
  const { PUBLIC_PAGES: unpublished } = createSourceLoader({
    './publicFeatures': { PUBLIC_INTEGRATIONS_ENABLED: false, PUBLISHED_INTEGRATIONS: [] },
  })('src/data/publicPages.ts')
  assert.equal(unpublished.some(page => page.path.startsWith('/integrations')), false)
})

test('product guides require working assets, links, SEO and useful setup data without fake code', () => {
  const odoo = copy().find(item => item.slug === 'odoo')
  assert.equal(odoo.code, undefined)
  assert.doesNotThrow(() => validateIntegrations([odoo]))
  for (const change of [
    entry => { entry.product.appUrl = 'javascript:alert(1)' },
    entry => { entry.product.versions[0].url = 'http://insecure.test' },
    entry => { entry.product.installSteps = [] },
    entry => { entry.product.faqs[0].answer = '' },
    entry => { entry.product.alertGroups[0].items = [] },
    entry => { entry.logo.src = 'https://remote.test/logo.png' },
    entry => { entry.logo.width = 0 },
    entry => { entry.seo.title = '' },
    entry => { entry.code = 'unlabelled example' },
  ]) {
    const entry = structuredClone(odoo); change(entry)
    assert.throws(() => validateIntegrations([entry]))
  }
})
