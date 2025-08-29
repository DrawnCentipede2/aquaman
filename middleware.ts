import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of sensitive file patterns that should never be accessible
const SENSITIVE_FILE_PATTERNS = [
  /\.env/,
  /\.sql$/,
  /\.md$/,
  /\.log$/,
  /\.json$/,
  /\.yaml$/,
  /\.yml$/,
  /report\.html$/,
  /lighthouse.*\.html$/,
  /localhost.*\.html$/,
  /config/,
  /secret/,
  /key/,
  /password/,
  /auth/,
  /credential/,
  // Additional patterns from security audit
  /\.tsconfig/,
  /\.tsbuildinfo/,
  /tailwind\.config/,
  /postcss\.config/,
  /next\.config/,
  /\.swcrc/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /\.editorconfig/,
  /\.prettierrc/,
  /\.eslintrc/,
  /README\.md$/,
  /CHANGELOG\.md$/,
  /CONTRIBUTING\.md$/,
  /LICENSE$/,
  /SECURITY.*\.md$/,
  /PERFORMANCE.*\.md$/,
  /DEPLOYMENT.*\.md$/,
  /IMAGE.*\.md$/,
  /LCP.*\.md$/,
  /MANAGE.*\.md$/,
  /MISSING.*\.md$/,
  /BROWSE.*\.md$/,
  /PACK.*\.md$/,
  /ULTRA.*\.md$/,
  /ENHANCED.*\.md$/,
  /test.*\.md$/,
  /\.report\.html$/,
  /_.*\.report\.html$/,
  /\.html\.report$/,
  // Block all hidden files and directories
  /^\./,
  // Block common sensitive files
  /backup/,
  /temp/,
  /tmp/,
  /\.bak$/,
  /\.old$/,
  /\.orig$/,
  // Block configuration and build files
  /webpack\.config/,
  /rollup\.config/,
  /vite\.config/,
  /babel\.config/,
  /\.babelrc/,
  /jest\.config/,
  /cypress\.config/,
  /playwright\.config/
]

// List of sensitive directories
const SENSITIVE_DIRECTORIES = [
  '/api/',
  '/_next/',
  '/node_modules/',
  '.git',
  '.env',
  '.next',
  '.vercel',
  '.github',
  '.vscode',
  '.idea',
  'scripts',
  'tests',
  'test',
  '.storybook',
  'coverage',
  '.nyc_output',
  'dist',
  'build',
  'out',
  '.secure'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block access to sensitive files
  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Access Denied', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    }
  }

  // Block access to sensitive directories
  for (const dir of SENSITIVE_DIRECTORIES) {
    if (pathname.startsWith(dir) && !pathname.startsWith('/api/public')) {
      // Allow specific API routes but block everything else in /api/
      if (pathname.startsWith('/api/') && !pathname.match(/^\/api\/(places|contact|packs|storage|orders|purchases)/)) {
        return new NextResponse('Access Denied', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Content-Type-Options': 'nosniff'
          }
        })
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https://*.supabase.co https://*.paypal.com; " +
    "frame-src 'self' https://*.paypal.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  )
  

  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
