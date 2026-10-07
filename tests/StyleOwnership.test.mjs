import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { baseParse, NodeTypes } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'

const root = new URL('../', import.meta.url).pathname
const read = path => readFileSync(resolve(root, path), 'utf8')
function filesIn(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = directory + '/' + entry.name
    return entry.isDirectory() ? filesIn(path) : [path]
  })
}
const files = ['index.html', ...filesIn('src'), ...filesIn('public')]
const presentationAttributes = new Set(['bgcolor', 'align', 'valign', 'color', 'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'vector-effect', 'font-family', 'font-size', 'font-weight', 'text-anchor'])

function hasStyleEntry(expression) {
  let found = false
  const source = ts.createSourceFile('binding.ts', `const binding = (${expression})`, ts.ScriptTarget.Latest, true)
  function visit(node) {
    if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && node.name.getText(source).replaceAll(/["']/g, '') === 'style') found = true
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}
function templateViolations(template) {
  const violations = []
  function visit(node) {
    if (node.type === NodeTypes.ELEMENT) {
      if (node.tag.toLowerCase() === 'style') violations.push('embedded style element')
      const isNative = node.tag === node.tag.toLowerCase() && !node.tag.includes('-')
      for (const prop of node.props) {
        const name = prop.type === NodeTypes.ATTRIBUTE ? prop.name : prop.name === 'bind' ? prop.arg?.content : undefined
        if (name?.toLowerCase() === 'style') violations.push('inline style attribute/binding')
        if (isNative && presentationAttributes.has(name?.toLowerCase())) violations.push(`presentation attribute: ${name}`)
        if (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && !prop.arg && prop.exp && hasStyleEntry(prop.exp.content)) violations.push('style in v-bind object')
      }
    }
    for (const child of node.children || []) visit(child)
  }
  visit(baseParse(template))
  return violations
}
function scriptViolations(script) {
  const violations = []
  const source = ts.createSourceFile('source.ts', script, ts.ScriptTarget.Latest, true)
  function visit(node) {
    const property = ts.isPropertyAccessExpression(node) ? node.name.text : ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : undefined
    if (['style', 'cssText', 'insertRule', 'replaceSync'].includes(property)) violations.push(`direct style API: ${property}`)
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      const argument = node.arguments[method === 'setAttributeNS' ? 1 : 0]
      if (['setAttribute', 'setAttributeNS', 'createElement'].includes(method) && argument && ts.isStringLiteral(argument) && argument.text.toLowerCase() === 'style') violations.push('DOM style injection')
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return violations
}

test('guard detects static, bound, embedded and object-spread styling without banning component props or SVG geometry', () => {
  for (const markup of ['<div style="color:red"/>', '<div :style="rules"/>', '<div v-bind:style="rules"/>', '<div v-bind="{ style: rules }"/>', '<style>.card{color:red}</style>', '<svg><path vector-effect="non-scaling-stroke"/></svg>']) assert.ok(templateViolations(markup).length, markup)
  assert.deepEqual(templateViolations('<v-icon color="secondary" size="24"/><svg viewBox="0 0 100 100"><path class="ui-line" :d="path"/><circle :cx="x" cy="2" r="4"/></svg>'), [])
  assert.ok(scriptViolations('element.style.color = "red"').length)
  assert.ok(scriptViolations('element["style"].setProperty("color", "red")').length)
  assert.ok(scriptViolations('element.setAttribute("style", "color:red")').length)
  assert.ok(scriptViolations('document.createElement("style")').length)
  assert.deepEqual(scriptViolations('new Intl.NumberFormat("en", { style: "currency", currency: "USD" })'), [])
})
test('all authored Vue, HTML and SVG templates keep styling in the shared stylesheet', () => {
  const violations = []
  for (const file of files.filter(file => ['.vue', '.html', '.svg'].includes(extname(file)))) {
    let template = read(file)
    if (file.endsWith('.vue')) {
      const { descriptor, errors } = parse(template, { filename: file })
      assert.deepEqual(errors, [], file)
      if (descriptor.styles.length) violations.push(`${file}: SFC style block`)
      for (const script of [descriptor.script, descriptor.scriptSetup]) if (script) violations.push(...scriptViolations(script.content).map(issue => `${file}: ${issue}`))
      template = descriptor.template?.content || ''
    }
    violations.push(...templateViolations(template).map(issue => `${file}: ${issue}`))
  }
  for (const file of files.filter(file => /\.(ts|js)$/.test(file))) violations.push(...scriptViolations(read(file)).map(issue => `${file}: ${issue}`))
  assert.deepEqual(violations, [])
})
test('main.css is the only authored stylesheet and remains imported by the app entry point', () => {
  assert.deepEqual(files.filter(file => /\.(css|scss|sass|less|styl)$/.test(file)), ['src/styles/main.css'])
  assert.match(read('src/main.ts'), /import '\.\/styles\/main\.css'/)
  const css = read('src/styles/main.css')
  assert.match(css, /\.ui-trend__line, \.ui-trend__point\s*\{\s*vector-effect: non-scaling-stroke;/)
})
test('documented brand, identical background/surface and theme values stay aligned', () => {
  const plugin = read('src/plugins/vuetify.ts'), css = read('src/styles/main.css'), guide = read('docs/design-language.md')
  for (const [name, hex] of [['primary', '#FF6B4A'], ['secondary', '#4338CA']]) {
    assert.match(plugin, new RegExp(`${name}: '${hex}'`))
    assert.match(css, new RegExp(`--app-${name}: ${hex};`, 'i'))
    assert.ok(guide.includes(hex))
  }
  for (const hex of ['#FFFFFF', '#171B25']) {
    assert.match(plugin, new RegExp(`background: '${hex}',\\s*surface: '${hex}'`))
    assert.ok(guide.includes(hex))
  }
  for (const doc of ['AGENTS.md', 'docs/vue-architecture.md']) assert.ok(read(doc).includes('design-language.md'), doc)
})
