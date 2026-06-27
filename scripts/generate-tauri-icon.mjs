import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import png2icons from 'png2icons'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'public', 'favicon.svg')
const padded = join(root, 'public', 'tauri-icon-source.png')
const iconsOut = join(root, 'src-tauri', 'icons')

// macOS icon keyline: artwork ~80.5% of a 1024 canvas with transparent outer corners.
const CANVAS = 1024
const SCALE = 0.805

const contentSize = Math.round(CANVAS * SCALE)
const inset = Math.round((CANVAS - contentSize) / 2)

const paddedBuffer = await sharp(source, { density: 384 })
  .resize(contentSize, contentSize)
  .extend({
    top: inset,
    bottom: inset,
    left: inset,
    right: inset,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

await writeFile(padded, paddedBuffer)

await mkdir(iconsOut, { recursive: true })

const pngSizes = [
  ['32x32.png', 32],
  ['128x128.png', 128],
  ['128x128@2x.png', 256],
  ['icon.png', 512],
]

for (const [name, size] of pngSizes) {
  await sharp(paddedBuffer)
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(join(iconsOut, name))
}

const icns = png2icons.createICNS(paddedBuffer, png2icons.BICUBIC, 0)
const ico = png2icons.createICO(paddedBuffer, png2icons.BICUBIC, 0, true)
if (!icns || !ico) {
  throw new Error('Failed to generate ICNS/ICO from tauri icon source')
}

await writeFile(join(iconsOut, 'icon.icns'), icns)
await writeFile(join(iconsOut, 'icon.ico'), ico)

console.log(`Generated padded source at ${padded}`)
console.log(`Regenerated Tauri icons in ${iconsOut}`)
