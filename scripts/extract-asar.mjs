/**
 * Read-only audit helper for the installed Harness bundle.
 *
 * DSH Desktop ships its capability packages inside `resources/app.asar`, which
 * a shell, ripgrep, or Node module loader cannot open. This script parses the
 * ASAR header and copies matching entries out so a deployment can inspect the
 * exact host implementation a plugin is compiled against.
 *
 * Usage:
 *   node scripts/extract-asar.mjs <app.asar> <out-dir> [path-filter ...]
 *   node scripts/extract-asar.mjs "D:\DSH NEXT\resources\app.asar" .tmp-asar \
 *     node_modules/@deepseek-ai/dsh-tool-subagent/lib
 *
 * Without filters it lists every archived path; with filters it extracts the
 * matching, non-unpacked entries under <out-dir>.
 */
import { open } from 'node:fs/promises'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const asarPath = process.argv[2]
const outDir = process.argv[3]
const filters = process.argv.slice(4)

const fh = await open(asarPath, 'r')
const sizeBuf = Buffer.alloc(16)
await fh.read(sizeBuf, 0, 16, 0)
const headerSize = sizeBuf.readUInt32LE(4)
const jsonSize = sizeBuf.readUInt32LE(12)
const headerBuf = Buffer.alloc(jsonSize)
await fh.read(headerBuf, 0, jsonSize, 16)
const header = JSON.parse(headerBuf.toString('utf8'))
const baseOffset = 8 + headerSize

function walk(node, prefix, out) {
  if (node.files) {
    for (const [name, child] of Object.entries(node.files)) walk(child, prefix ? `${prefix}/${name}` : name, out)
  } else if (typeof node.offset === 'string') {
    out.push({ path: prefix, offset: Number(node.offset), size: node.size, unpacked: node.unpacked === true })
  }
}
const all = []
walk(header, '', all)
if (filters.length === 0) {
  for (const entry of all) console.log(`${entry.path}\t${entry.size}`)
  process.exit(0)
}
const selected = all.filter(entry => !entry.unpacked && filters.some(f => entry.path.includes(f)))
let count = 0
for (const entry of selected) {
  const buf = Buffer.alloc(entry.size)
  await fh.read(buf, 0, entry.size, baseOffset + entry.offset)
  const target = resolve(outDir, entry.path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, buf)
  count += 1
}
await fh.close()
console.log(`extracted ${count} files from ${asarPath} -> ${outDir}`)
