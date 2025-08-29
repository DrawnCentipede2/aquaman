import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addSecurityHeaders } from '@/lib/auth'

type PathRequest = {
  path: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { paths?: PathRequest[] }
    const paths = Array.isArray(body.paths) ? body.paths : []

    if (!paths.length) {
      return addSecurityHeaders(NextResponse.json({ error: 'No paths provided' }, { status: 400 }))
    }

    const admin = createAdminClient()

    const results: Array<{ path: string, token: string }> = []
    for (const { path } of paths) {
      if (typeof path !== 'string' || !path.trim()) continue
      const { data, error } = await admin.storage
        .from('pin-photos')
        .createSignedUploadUrl(path)
      if (error || !data) {
        return addSecurityHeaders(NextResponse.json({ error: error?.message || 'Failed to create signed URL' }, { status: 500 }))
      }
      results.push({ path, token: data.token })
    }

    return addSecurityHeaders(NextResponse.json({ uploads: results }, { status: 200 }))
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 }))
  }
}


