/**
 * Verify that this plugin is being developed and validated against the DSH
 * package generation it claims in `compatibility.json`.
 *
 * The previous form of this check compared a git commit of a DSH source
 * checkout. DSH 0.2 ships its capability packages independently, so the pin is
 * now the exact published version of every peer package the plugin compiles
 * against, resolved from the local installation.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const compatibility = JSON.parse(readFileSync(join(root, 'compatibility.json'), 'utf8'))
const plugin = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const problems = []
for (const [name, expected] of Object.entries(compatibility.packages)) {
  const manifest = join(root, 'node_modules', ...name.split('/'), 'package.json')
  let actual
  try {
    actual = JSON.parse(readFileSync(manifest, 'utf8')).version
  } catch {
    problems.push(`${name}: not installed at ${manifest}`)
    continue
  }
  if (actual !== expected) problems.push(`${name}: installed ${actual}, pinned ${expected}`)
}

if (compatibility.pluginVersion !== undefined && plugin.version !== compatibility.pluginVersion) {
  problems.push(`package.json version ${plugin.version} does not match compatibility.json pluginVersion ${compatibility.pluginVersion}`)
}

const source = readFileSync(join(root, 'src', 'index.ts'), 'utf8')
const declaredDshVersion = /dshVersion:\s*'([^']+)'/u.exec(source)?.[1]
if (declaredDshVersion !== compatibility.hostVersion) {
  problems.push(`src/index.ts declares dshVersion ${declaredDshVersion ?? '<missing>'}, compatibility.json pins ${compatibility.hostVersion}`)
}

if (problems.length > 0) {
  throw new Error(`DSH compatibility pin mismatch:\n- ${problems.join('\n- ')}`)
}

process.stdout.write(`DSH compatibility pin verified: ${compatibility.hostVersion} across ${Object.keys(compatibility.packages).length} packages\n`)
