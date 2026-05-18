#!/usr/bin/env node
/**
 * style-bd | Bulk Image Processor
 * Converts all product photoshoot images to WebP format
 * and copies them to the Next.js public/media/products directory
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE_BASE = '/home/samiur/Documents/Larabel Ecommerce running project/Tops-photoshoots 24 dec 2025'
const OUTPUT_BASE = '/home/samiur/Documents/Larabel Ecommerce running project/style-bd-admin/public/media/products'

// Product folders to process
const PRODUCT_FOLDERS = [
  'Tops code 700', 'Tops code 701', 'Tops code 702', 'Tops code 703',
  'Tops code 704', 'Tops code 705', 'Tops code 706', 'Tops code 707',
  // 'Tops code 708'  // empty – skipped
]

async function processImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(1200, 1500, {
        fit: 'cover',
        position: 'top',  // keep face/top of garment in frame
        withoutEnlargement: false,
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath)
    return true
  } catch (err) {
    console.error(`  ❌ Failed: ${path.basename(inputPath)} — ${err.message}`)
    return false
  }
}

async function processFolder(folderName) {
  const sourceDir = path.join(SOURCE_BASE, folderName)
  const code = folderName.replace('Tops code ', '')
  const outputDir = path.join(OUTPUT_BASE, `tops-${code}`)

  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠  Skipping ${folderName} — directory not found`)
    return []
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const files = fs.readdirSync(sourceDir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.log(`⚠  Skipping ${folderName} — no images`)
    return []
  }

  console.log(`\n📁 Processing: ${folderName} (${files.length} images)`)
  const processed = []

  for (let i = 0; i < files.length; i++) {
    const inputPath = path.join(sourceDir, files[i])
    const outputName = `img-${String(i + 1).padStart(2, '0')}.webp`
    const outputPath = path.join(outputDir, outputName)

    process.stdout.write(`  [${i+1}/${files.length}] ${files[i]} → ${outputName} ... `)
    const ok = await processImage(inputPath, outputPath)
    if (ok) {
      const stats = fs.statSync(outputPath)
      console.log(`✅ (${(stats.size/1024).toFixed(0)}KB)`)
      processed.push(`/media/products/tops-${code}/${outputName}`)
    }
  }

  return processed
}

async function main() {
  console.log('🚀 style-bd Image Processor — Starting...\n')
  console.log(`Source: ${SOURCE_BASE}`)
  console.log(`Output: ${OUTPUT_BASE}\n`)

  fs.mkdirSync(OUTPUT_BASE, { recursive: true })

  const manifest = {}

  for (const folder of PRODUCT_FOLDERS) {
    const images = await processFolder(folder)
    const code = folder.replace('Tops code ', '')
    manifest[`TOPS-${code}`] = images
  }

  // Write manifest JSON for the frontend
  const manifestPath = path.join(OUTPUT_BASE, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  const total = Object.values(manifest).reduce((a, imgs) => a + imgs.length, 0)
  console.log(`\n✅ DONE! Processed ${total} images across ${PRODUCT_FOLDERS.length} products`)
  console.log(`📄 Manifest written to: ${manifestPath}`)
  console.log('\nProduct summary:')
  Object.entries(manifest).forEach(([code, imgs]) => {
    console.log(`  ${code}: ${imgs.length} images`)
  })
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
