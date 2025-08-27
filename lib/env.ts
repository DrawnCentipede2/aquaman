import { z } from 'zod'
import { logger } from '@/lib/logger'

// Environment variable schema
const envSchema = z.object({
  // Supabase - Client-side variables (with NEXT_PUBLIC_ prefix)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // PayPal - Client-side variables (with NEXT_PUBLIC_ prefix)
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().min(1, 'PayPal client ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PayPal client secret is required'),
  NEXT_PUBLIC_PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live'], {
    errorMap: () => ({ message: 'PayPal environment must be sandbox or live' })
  }),

  // Email
  GMAIL_USER: z.string().email('Invalid Gmail user email'),
  GMAIL_APP_PASSWORD: z.string().min(1, 'Gmail app password is required'),

  // Google Maps API Keys - Server-side only
  GOOGLE_MAPS_API_KEY_SERVER: z.string().min(1, 'Google Maps server API key is required'),

  // Security
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined'

      if (isBrowser) {
        // In browser, just log the error and throw (don't exit)
        console.error('Environment validation failed:')
        error.errors.forEach((err: z.ZodIssue) => {
          console.error(`   ${err.path.join('.')}: ${err.message}`)
        })
        console.error('\nPlease check your .env file and ensure all required variables are set.')
        throw new Error('Environment validation failed. Check console for details.')
      } else {
        // In server environment, log and exit
        logger.error('Environment validation failed:')
        error.errors.forEach((err: z.ZodIssue) => {
          logger.error(`   ${err.path.join('.')}: ${err.message}`)
        })
        logger.error('\nPlease check your .env file and ensure all required variables are set.')
        process.exit(1)
      }
    }
    throw error
  }
}

// Export validated environment (with client-side safety)
let envCache = null

export const env = (() => {
  // Prevent multiple validations
  if (envCache) return envCache

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined'

  if (isBrowser) {
    // In browser, use a minimal validation that doesn't exit
    try {
      const minimalEnv = envSchema.partial().parse(process.env || {})
      envCache = minimalEnv
      return minimalEnv
    } catch (error) {
      // Log error but don't crash the app
      console.warn('Environment validation warning (browser):', error instanceof Error ? error.message : String(error))
      envCache = {} // Return empty object to prevent crashes
      return {}
    }
  } else {
    // In server environment, do full validation
    envCache = validateEnv()
    return envCache
  }
})()

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Supabase - Server-side configuration
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // PayPal - Server-side only
  paypal: {
    clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    clientSecret: env.PAYPAL_CLIENT_SECRET || '',
    environment: env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox',
    isLive: (env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox') === 'live',
  },

  // Email - Server-side only
  email: {
    user: env.GMAIL_USER || '',
    appPassword: env.GMAIL_APP_PASSWORD || '',
  },

  // Google Maps - Server-side only
  googleMaps: {
    serverApiKey: env.GOOGLE_MAPS_API_KEY_SERVER || '',
  },

  // NextAuth - Server-side only
  nextauth: {
    secret: env.NEXTAUTH_SECRET || '',
    url: env.NEXTAUTH_URL || '',
  },

  // Security
  security: {
    // Rate limiting
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100, // 100 requests per window

    // CORS origins
    corsOrigins: env.NODE_ENV === 'production'
      ? ['https://pincloud.co', 'https://www.pincloud.co']
      : ['http://localhost:3000', 'http://localhost:3001'],

    // Security headers
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co https://*.paypal.com; frame-src 'self' https://*.paypal.com;",
  },

  // URLs
  urls: {
    baseUrl: env.NODE_ENV === 'production'
      ? 'https://pincloud.co'
      : 'http://localhost:3000',
  },
}

// Client-safe configuration (only expose what's necessary for client-side)
export const clientConfig = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  paypal: {
    clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    environment: env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox',
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
}

// Type exports
export type Config = typeof config
export type Env = typeof env 