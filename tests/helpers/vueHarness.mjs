import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { compileFunction } from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import ts from 'typescript'

export { vue }
const projectRoot = new URL('../../', import.meta.url).pathname
export const loadSource = createSourceLoader()

export function createSourceLoader(overrides = {}) {
  const modules = new Map()
  return function loadSource(relativePath) {
    const filename = resolve(projectRoot, relativePath)
    if (modules.has(filename)) return modules.get(filename).exports
    const source = readFileSync(filename, 'utf8')
    const script = filename.endsWith('.vue')
      ? compileScript(parse(source, { filename }).descriptor, { id: filename, inlineTemplate: true }).content
      : source
    const javascript = ts.transpileModule(script, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const module = { exports: {} }
    modules.set(filename, module)
    compileFunction(javascript, ['require', 'exports', 'module'])(name => {
      if (name in overrides) return overrides[name]
      if (name === 'vue') return vue
      const dependency = resolve(dirname(filename), name)
      return loadSource(dependency.endsWith('.vue') ? dependency : dependency + '.ts')
    }, module.exports, module)
    return module.exports
  }
}

export function node(type, text = '') { return { type, text, props: {}, children: [], parent: null } }
function remove(element) {
  if (!element.parent) return
  element.parent.children.splice(element.parent.children.indexOf(element), 1)
  element.parent = null
}
export const renderer = vue.createRenderer({
  createElement: type => node(type),
  createText: text => node('text', text),
  createComment: text => node('comment', text),
  setText: (element, text) => { element.text = text },
  setElementText: (element, text) => { element.children = []; element.text = text },
  patchProp: (element, key, _previous, value) => { element.props[key] = value },
  parentNode: element => element.parent,
  nextSibling: element => element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
  insert(element, parent, anchor = null) {
    remove(element)
    parent.children.splice(anchor ? parent.children.indexOf(anchor) : parent.children.length, 0, element)
    element.parent = parent
  },
  remove,
})
export function findAll(element, predicate) {
  return [...(predicate(element) ? [element] : []), ...element.children.flatMap(child => findAll(child, predicate))]
}
export function byClass(root, name) {
  return findAll(root, element => String(element.props.class ?? '').split(' ').includes(name))
}

// Stub only the third-party render boundary. The actual SFCs, refs, injection and lifecycle run.
export function registerVuetifyStubs(app, selectionHandlers = []) {
  const groupKey = Symbol('test-tabs')
  app.component('VTabs', {
    props: ['modelValue'], emits: ['update:modelValue'],
    setup(props, { slots, emit, attrs }) {
      const select = value => emit('update:modelValue', value)
      selectionHandlers.push(select)
      vue.provide(groupKey, { selected: vue.computed(() => props.modelValue), select })
      return () => vue.h('div', { ...attrs, class: 'v-tabs ' + (attrs.class ?? ''), role: 'tablist' }, [
        vue.h('div', { class: 'v-slide-group__container' }, [
          vue.h('div', { class: 'v-slide-group__content' }, slots.default?.()),
        ]),
      ])
    },
  })
  app.component('VTab', {
    props: ['value', 'disabled'],
    setup(props, { attrs, slots }) {
      const group = vue.inject(groupKey)
      return () => vue.h('button', {
        ...attrs, role: 'tab', disabled: props.disabled, 'aria-selected': props.value === group.selected.value,
        onClick: () => { if (!props.disabled) group.select(props.value) },
      }, slots.default?.())
    },
  })
  app.component('VWindow', {
    props: ['modelValue', 'touch'],
    setup(_props, { attrs, slots }) {
      return () => vue.h('div', { ...attrs, class: 'v-window ' + (attrs.class ?? '') }, [
        vue.h('div', { class: 'v-window__container' }, slots.default?.()),
      ])
    },
  })
  app.component('VWindowItem', (props, { slots }) => vue.h('div', { ...props, class: 'v-window-item' }, slots.default?.()))
  app.component('VIcon', props => vue.h('i', props))
  app.component('VBtn', (props, { slots }) => vue.h('button', props, slots.default?.()))
  app.component('VChip', (props, { slots }) => vue.h('span', props, slots.default?.()))
}
