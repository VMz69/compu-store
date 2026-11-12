import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const sourceRoot = path.join(root, 'src')

async function sourceFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const name = path.join(folder, entry.name)
    return entry.isDirectory() ? sourceFiles(name) : /\.tsx?$/.test(name) ? [name] : []
  }))
  return files.flat()
}

test('los emisores de trazabilidad apuntan a su archivo FLOA y usan el helper central', async () => {
  let emitters = 0
  for (const file of await sourceFiles(sourceRoot)) {
    const text = await readFile(file, 'utf8')
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const relative = path.relative(root, file).split(path.sep).join('/')
    const traceImports = new Map()
    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement)) continue
      const bindings = statement.importClause?.namedBindings
      if (!bindings || !ts.isNamedImports(bindings)) continue
      for (const binding of bindings.elements) {
        const imported = binding.propertyName?.text ?? binding.name.text
        if (imported === 'tracer' || imported === 'uiMeta') {
          assert.equal(statement.moduleSpecifier.text, '@/00-trazabilidad', relative)
          traceImports.set(binding.name.text, imported)
        }
      }
    }
    function visit(node) {
      if (ts.isJsxAttribute(node)) {
        assert(!node.name.getText(tree).startsWith('data-ui-'), `Metadata que elude el kill switch: ${relative}`)
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const imported = traceImports.get(node.expression.text)
        if (imported === 'tracer') {
          const [component, source] = node.arguments
          assert.equal(node.arguments.length, 2, relative)
          assert(ts.isStringLiteral(component), relative)
          assert(ts.isStringLiteral(source), relative)
          assert.equal(source.text, relative, `source desactualizado en ${relative}`)
          ++emitters
        } else if (imported === 'uiMeta') {
          const [meta] = node.arguments
          assert(ts.isObjectLiteralExpression(meta), relative)
          const source = meta.properties.find((property) => property.name?.getText(tree) === 'source')
          assert(source && ts.isPropertyAssignment(source) && ts.isStringLiteral(source.initializer), relative)
          assert.equal(source.initializer.text, relative, `source desactualizado en ${relative}`)
          ++emitters
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
  }
  assert(emitters > 0, 'La auditoría debe encontrar emisores de metadata')
})

test('contrato, propagación al HTML y kill switch sin cambios de presentación', async (t) => {
  const rendered = []
  for (const value of [undefined, 'true', 'false', '', 'FALSE']) {
    await t.test(`VITE_UI_TRACEABILITY=${value === undefined ? '(ausente)' : JSON.stringify(value)}`, async () => {
      const server = await createServer({
        root,
        configFile: false,
        envFile: false,
        logLevel: 'silent',
        resolve: { alias: { '@': sourceRoot } },
        define: { 'import.meta.env.VITE_UI_TRACEABILITY': value === undefined ? 'undefined' : JSON.stringify(value) },
        server: { middlewareMode: true, watch: null, ws: false },
        optimizeDeps: { noDiscovery: true, include: [] },
      })
      try {
        const { uiMeta, tracer } = await server.ssrLoadModule('/src/00-trazabilidad.ts')
        const enabled = value !== 'false'
        const meta = { id: 'audit.item.001', component: 'TraceabilityAudit', source: 'src/00-trazabilidad.ts' }
        const expected = (id) => enabled ? {
          'data-ui-id': id,
          'data-ui-component': meta.component,
          'data-ui-source': meta.source,
        } : {}
        assert.deepEqual(uiMeta(meta), expected(meta.id))
        const trace = tracer(meta.component, meta.source)
        assert.deepEqual(trace(meta.id), expected(meta.id))
        assert.deepEqual(trace('audit.item.002'), expected('audit.item.002'))
        assert.deepEqual(trace(meta.id), expected(meta.id), 'El ID anterior no debe mutar')

        const { Button } = await server.ssrLoadModule('/src/66-pipeline-acciones-administrativas/01-Button.tsx')
        const { Input } = await server.ssrLoadModule('/src/65-pipeline-campos-administrativos/01-Input.tsx')
        const { Modal, ModalHeader } = await server.ssrLoadModule('/src/73-pipeline-modales-globales/01-Modal.tsx')
        const { SegmentedTabs } = await server.ssrLoadModule('/src/69-pipeline-navegacion-listados/03-SegmentedTabs.tsx')
        const noop = () => {}
        const html = renderToStaticMarkup(createElement('section', trace('audit.section'),
          createElement(Button, { ...trace('audit.button'), onClick: noop }, 'Acción'),
          createElement(Input, { ...trace('audit.input'), name: 'audit', defaultValue: 'Conservado' }),
          createElement(Modal, { ...trace('audit.modal'), onClose: noop },
            createElement(ModalHeader, { onClose: noop, closeMeta: trace('audit.modal.close') }, 'Modal')),
          createElement(SegmentedTabs, {
            items: [{ id: 'one', label: 'Uno' }, { id: 'two', label: 'Dos' }],
            value: 'one', onChange: noop, 'aria-label': 'Áreas de prueba', traceId: 'audit.tabs',
          }),
        ))
        const ids = [...html.matchAll(/data-ui-id="([^"]+)"/g)].map((match) => match[1])
        if (enabled) {
          assert.deepEqual(ids, ['audit.section', 'audit.button', 'audit.input', 'audit.modal',
            'audit.modal.close', 'audit.tabs', 'audit.tabs.one', 'audit.tabs.two'])
          assert(html.includes('data-ui-source="src/69-pipeline-navegacion-listados/03-SegmentedTabs.tsx"'))
          assert.equal((html.match(/data-ui-component=/g) ?? []).length, ids.length)
          assert.equal((html.match(/data-ui-source=/g) ?? []).length, ids.length)
        } else {
          assert(!html.includes('data-ui-'), 'El kill switch debe retirar los tres atributos, también en hijos')
        }
        rendered.push(html.replace(/ data-ui-(?:id|component|source)="[^"]*"/g, ''))
      } finally {
        await server.close()
      }
    })
  }
  assert.equal(rendered.length, 5)
  assert(rendered.every((html) => html === rendered[0]), 'Activar/desactivar metadata no debe cambiar el HTML restante')
})
