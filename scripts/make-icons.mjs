// Genera los PNG de la PWA a partir de scripts/icon.svg.
// Usa `sharp`. Se ejecuta desde la raíz de workdesk para resolver sharp:
//   node Colaboro/scripts/make-icons.mjs Colaboro/public
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(here, 'icon.svg'))
const out = process.argv[2] || join(here, '..', 'public')

const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-icon.png', 180],
]

for (const [name, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(out, name))
  console.log('escrito', name, size)
}
