/*
  Migration: Move base64 images from public.pins.photos (JSON array) to Supabase Storage as optimized WebP

  What it does:
  - Creates a public bucket `pin-photos` if missing
  - Iterates pins with non-empty photos
  - Converts each base64 image to WebP (quality 70) using sharp (recommended) or falls back to original bytes
  - Uploads to Storage at `pins/<pin_id>/<index>.webp` with cacheControl: 30 days
  - Replaces public.pins.photos with array of public URLs

  Requirements:
  - Node 18+
  - Install deps: npm i -D sharp @supabase/supabase-js
  - Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

  Usage:
  - Dry run:    node ./scripts/migrate-pin-photos-to-storage.ts --dry-run
  - Real run:   node ./scripts/migrate-pin-photos-to-storage.ts
*/

import { createClient } from '@supabase/supabase-js'

// Lazy import sharp to keep it optional
let sharp: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sharp = require('sharp')
} catch (err) {
  // sharp not installed; we'll fall back to original bytes
}

type PinRow = { id: string; photos: string[] | null }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'pin-photos'
const BATCH_SIZE = 50

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function ensureBucket(): Promise<void> {
  // Try list to check existence
  const { data: listData } = await supabase.storage.listBuckets()
  const exists = (listData || []).some((b) => b.name === BUCKET)
  if (exists) return
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB safety
  })
  if (error) throw error
}

function parseBase64(input: string): { buffer: Buffer; mime: string } | null {
  try {
    if (input.startsWith('http')) return null
    if (input.startsWith('data:')) {
      const match = input.match(/^data:(.*?);base64,(.*)$/)
      if (!match) return null
      const mime = match[1]
      const b64 = match[2]
      return { buffer: Buffer.from(b64, 'base64'), mime }
    }
    // Fallback: assume raw base64 jpeg
    return { buffer: Buffer.from(input, 'base64'), mime: 'image/jpeg' }
  } catch {
    return null
  }
}

async function toWebP(buffer: Buffer): Promise<{ data: Buffer; contentType: string }> {
  if (sharp) {
    const data = await sharp(buffer).webp({ quality: 70 }).toBuffer()
    return { data, contentType: 'image/webp' }
  }
  // Fallback without sharp
  return { data: buffer, contentType: 'application/octet-stream' }
}

async function migrateBatch(offset: number, dryRun: boolean): Promise<number> {
  const { data, error } = await supabase
    .from('pins')
    .select('id, photos')
    .not('photos', 'is', null)
    .neq('photos', '[]')
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) throw error
  const pins = (data || []) as PinRow[]
  if (pins.length === 0) return 0

  for (const pin of pins) {
    const photos = Array.isArray(pin.photos) ? pin.photos : []
    const newUrls: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const item = photos[i]
      if (typeof item === 'string' && item.startsWith('http')) {
        // Already a URL
        newUrls.push(item)
        continue
      }
      const parsed = typeof item === 'string' ? parseBase64(item) : null
      if (!parsed) continue
      const { data: webp, contentType } = await toWebP(parsed.buffer)
      const path = `pins/${pin.id}/${i}.webp`
      if (!dryRun) {
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, webp, { contentType, upsert: true, cacheControl: '2592000' })
        if (upErr) throw upErr
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      if (urlData?.publicUrl) newUrls.push(urlData.publicUrl)
    }

    if (!dryRun && newUrls.length > 0) {
      const { error: updErr } = await supabase
        .from('pins')
        .update({ photos: newUrls })
        .eq('id', pin.id)
      if (updErr) throw updErr
    }

    console.log(`Migrated pin ${pin.id} → ${newUrls.length} URLs`)
  }

  return pins.length
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`Starting migration (dryRun=${dryRun})`)
  await ensureBucket()

  let offset = 0
  let total = 0
  while (true) {
    const count = await migrateBatch(offset, dryRun)
    if (count === 0) break
    offset += count
    total += count
    console.log(`Processed ${total} pins...`)
  }

  console.log(`Done. Processed ${total} pins.`)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})


