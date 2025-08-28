import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addSecurityHeaders, sanitizeInput } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Expect email-first identity from client
    const email: string = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return addSecurityHeaders(NextResponse.json({ error: 'Missing email' }, { status: 400 }))
    }

    // Basic validation/sanitization
    const pack = {
      title: sanitizeInput(body.title || ''),
      description: sanitizeInput(body.description || ''),
      city: sanitizeInput(body.city || ''),
      country: sanitizeInput(body.country || ''),
      price: Number.isFinite(body.price) ? Number(body.price) : 0,
      creator_id: email, // RLS expects email in creator_id
      pin_count: Array.isArray(body.pins) ? body.pins.length : Number(body.pin_count) || 0,
      categories: Array.isArray(body.categories) ? body.categories.slice(0, 3) : [],
      maps_list_reference: body.maps_list_reference ?? null,
      created_at: new Date().toISOString(),
    }

    const admin = createAdminClient()

    // Insert pin pack with service role (bypass RLS)
    const { data: createdPack, error: packError } = await admin
      .from('pin_packs')
      .insert([pack])
      .select()
      .single()

    if (packError || !createdPack) {
      return addSecurityHeaders(NextResponse.json({ error: packError?.message || 'Failed to create pack' }, { status: 500 }))
    }

    const newPackId = createdPack.id as string

    // Create pins if provided
    let createdPins = [] as { id: string }[]
    if (Array.isArray(body.pins) && body.pins.length > 0) {
      const pinsInsert = body.pins.map((p: any) => ({
        title: sanitizeInput(p.title || 'Imported Place'),
        description: sanitizeInput(p.description || 'Amazing place to visit'),
        google_maps_url: sanitizeInput(p.google_maps_url || ''),
        category: sanitizeInput(p.category || 'other'),
        latitude: Number(p.latitude) || 0,
        longitude: Number(p.longitude) || 0,
        place_id: p.place_id || null,
        photos: Array.isArray(p.photos) ? p.photos : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { data: pinsData, error: pinsError } = await admin
        .from('pins')
        .insert(pinsInsert)
        .select('id')

      if (pinsError) {
        return addSecurityHeaders(NextResponse.json({ error: pinsError.message }, { status: 500 }))
      }

      createdPins = (pinsData || []) as { id: string }[]

      // Create relationships
      const relationships = createdPins.map((pin) => ({
        pin_pack_id: newPackId,
        pin_id: pin.id,
        created_at: new Date().toISOString(),
      }))
      const { error: relError } = await admin
        .from('pin_pack_pins')
        .insert(relationships)

      if (relError) {
        return addSecurityHeaders(NextResponse.json({ error: relError.message }, { status: 500 }))
      }
    }

    // Update pin_count in case it was computed
    await admin
      .from('pin_packs')
      .update({ pin_count: createdPins.length || pack.pin_count })
      .eq('id', newPackId)

    return addSecurityHeaders(NextResponse.json({ id: newPackId }, { status: 201 }))
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 }))
  }
}
