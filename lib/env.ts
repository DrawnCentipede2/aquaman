import { z } from 'zod'
import { logger } from '@/lib/logger'

// Environment variable schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // PayPal
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().min(1, 'PayPal client ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PayPal client secret is required'),
  NEXT_PUBLIC_PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live'], {
    errorMap: () => ({ message: 'PayPal environment must be sandbox or live' })
  }),
  
  // Email
  GMAIL_USER: z.string().email('Invalid Gmail user email'),
  GMAIL_APP_PASSWORD: z.string().min(1, 'Gmail app password is required'),
  
  // Optional
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:')
      error.errors.forEach((err: z.ZodIssue) => {
        logger.error(`   ${err.path.join('.')}: ${err.message}`)
      })
      logger.error('\nPlease check your .env file and ensure all required variables are set.')
      process.exit(1)
    }
    throw error
  }
}

// Export validated environment
export const env = validateEnv()

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Supabase
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // PayPal
  paypal: {
    clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    environment: env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT,
    isLive: env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === 'live',
  },
  
  // Email
  email: {
    user: env.GMAIL_USER,
    appPassword: env.GMAIL_APP_PASSWORD,
  },
  
  // Google Maps (optional)
  googleMaps: {
    apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  
  // Security
  security: {
    // Rate limiting
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100, // 100 requests per window
    
    // CORS origins
    corsOrigins: env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://www.yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
  
  // URLs
  urls: {
    baseUrl: env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com'
      : 'http://localhost:3000',
  },
}

// Type exports
export type Config = typeof config
export type Env = typeof env 