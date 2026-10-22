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
  for (const key of ['name', 'status', 'requirements', 'steps']) {
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
