import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const store = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(store, 'src')
const traceFile = join(src, '04-trazabilidad-ui.ts')
const source = readFileSync(traceFile, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText
const loadTrace = async (env) => {
  const code = compiled.replaceAll('import.meta.env', JSON.stringify(env))
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}
const metadata = Object.freeze({
  id: 'producto.card.42',
  component: 'ProductCard',
  source: 'src/17-pipeline-vitrina-productos/02-tarjeta-producto.tsx',
})
const expected = {
  'data-ui-id': metadata.id,
  'data-ui-component': metadata.component,
  'data-ui-source': metadata.source,
}

for (const [name, env, enabled] of [
  ['sin variable en desarrollo', { DEV: true, PROD: false }, true],
  ['sin variable en producción', { DEV: false, PROD: true }, true],
  ['true explícito', { VITE_UI_TRACEABILITY: 'true' }, true],
  ['false explícito en desarrollo', { DEV: true, VITE_UI_TRACEABILITY: 'false' }, false],
  ['false explícito en producción', { PROD: true, VITE_UI_TRACEABILITY: 'false' }, false],
  ['valor vacío conserva el contrato', { VITE_UI_TRACEABILITY: '' }, true],
  ['False no equivale a false', { VITE_UI_TRACEABILITY: 'False' }, true],
]) {
  test(`kill switch: ${name}`, async () => {
    const { uiMeta } = await loadTrace(env)
    assert.deepEqual(uiMeta(metadata), enabled ? expected : {})
  })
}

test('uiMeta conserva los IDs y no modifica sus argumentos', async () => {
  const { uiMeta } = await loadTrace({})
  const first = uiMeta(metadata)
  first['data-ui-id'] = 'modificado-por-consumidor'
  assert.deepEqual(uiMeta(metadata), expected)
  assert.equal(metadata.id, 'producto.card.42')
})

const filesIn = (folder) => readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
  const file = join(folder, entry.name)
  return entry.isDirectory() ? filesIn(file) : /\.tsx?$/.test(file) ? [file] : []
})
const files = filesIn(src)
const parse = (file) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
const visit = (node, callback) => {
  callback(node)
  ts.forEachChild(node, (child) => visit(child, callback))
}

test('cada SOURCE apunta al archivo FLOA actual y las fuentes delegadas existen', () => {
  let checked = 0
  for (const file of files) {
    visit(parse(file), (node) => {
      if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return
      if (!/^SOURCE(?:_[A-Z]+)?$/.test(node.name.text)) return
      assert.ok(node.initializer && ts.isStringLiteral(node.initializer), file)
      const value = node.initializer.text
      assert.ok(existsSync(join(store, value)), `${file}: ${value} no existe`)
      if (node.name.text === 'SOURCE') {
        assert.equal(value, relative(store, file).split('\\').join('/'))
      }
      checked++
    })
  }
  assert.ok(checked > 0, 'Debe haber componentes trazables')
})

test('todos los consumidores importan el núcleo de trazabilidad vigente', () => {
  let consumers = 0
  for (const file of files) {
    visit(parse(file), (node) => {
      if (!ts.isImportDeclaration(node) || !node.importClause?.namedBindings) return
      const bindings = node.importClause.namedBindings
      if (!ts.isNamedImports(bindings)) return
      if (!bindings.elements.some((element) => (element.propertyName ?? element.name).text === 'uiMeta')) return
      assert.equal(node.moduleSpecifier.text, '@/04-trazabilidad-ui', file)
      consumers++
    })
  }
  assert.ok(consumers > 0)
})

test('ningún selector funcional depende de data-ui-* ni evita el kill switch', () => {
  for (const file of files.filter((name) => name !== traceFile)) {
    visit(parse(file), (node) => {
      if (ts.isStringLiteralLike(node)) {
        assert.ok(!node.text.includes('data-ui-'), `${file}: metadatos usados fuera del núcleo`)
      }
      if (ts.isJsxAttribute(node)) {
        assert.ok(!node.name.getText().startsWith('data-ui-'), `${file}: inyección fuera de uiMeta`)
      }
      if (ts.isPropertyAccessExpression(node) && /^(uiId|uiComponent|uiSource)$/.test(node.name.text)) {
        assert.notEqual(node.expression.getText().split('.').at(-1), 'dataset', file)
      }
    })
  }
})
