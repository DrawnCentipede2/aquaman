import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Authentication middleware
export async function requireAuth(_request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  response?: NextResponse;
}> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return { success: true, user }
  } catch (_error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

// Admin authorization middleware
export async function requireAdmin(_request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  response?: NextResponse;
}> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (userError || userData?.role !== 'admin') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return { success: true, user }
  } catch (_error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authorization error' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Input validation helpers
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  // Remove potentially dangerous characters and limit length
  return input.replace(/[<>]/g, '').substring(0, 1000)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  return response
}
