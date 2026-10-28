/**
 * Guard the native DSH workflow surface this plugin depends on.
 *
 * The plugin appends `tool-workflow/*` Session events so the stock DSH Web UI
 * projects a background workflow run. The previous form of this check imported
 * a DSH client source checkout; the 0.2 capability packages ship that
 * vocabulary as the `@deepseek-ai/dsh-tool-workflow` module augmentation, so
 * the contract is verified against the installed declarations instead.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const typesPath = join(root, 'node_modules', '@deepseek-ai', 'dsh-tool-workflow', 'lib', 'types', 'types.d.ts')

let declaration
try {
  declaration = readFileSync(typesPath, 'utf8')
} catch {
  throw new Error(`@deepseek-ai/dsh-tool-workflow is not installed at ${typesPath}`)
}

const requiredEvents = ['tool-workflow/run-start', 'tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/run-end']
const requiredFields = ['childId', 'stopReason', 'outcome', 'label']

const problems = []
for (const event of requiredEvents) {
  if (!declaration.includes(`'${event}'`)) problems.push(`missing Session event '${event}'`)
}
for (const field of requiredFields) {
  if (!new RegExp(`\\b${field}\\??:`, 'u').test(declaration)) problems.push(`missing data field '${field}'`)
}

if (problems.length > 0) {
  throw new Error(`DSH native workflow projection contract changed:\n- ${problems.join('\n- ')}`)
}

process.stdout.write('DSH native workflow projection contract verified\n')
