// Validation utilities for API security
import { z } from 'zod'
import { logger } from './logger'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per window

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetTime: record.resetTime }
}

// Input validation schemas
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  bio: z.string().max(1000, 'Bio too long').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City too long').optional(),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country too long').optional(),
  occupation: z.string().max(200, 'Occupation too long').optional(),
  social_links: z.record(z.string().url('Invalid URL')).optional()
})

export const pinPackSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  price: z.number().min(0, 'Price cannot be negative').max(999.99, 'Price too high'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City too long'),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country too long'),
  categories: z.array(z.string().min(1, 'Category cannot be empty')).max(10, 'Too many categories').optional(),
  pin_count: z.number().int().min(1, 'Must have at least 1 pin').max(100, 'Too many pins').optional()
})

export const pinSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  google_maps_url: z.string().url('Invalid Google Maps URL'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City too long').optional(),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country too long').optional()
})

export const orderSchema = z.object({
  cartItems: z.array(z.object({
    id: z.string().uuid('Invalid pack ID'),
    title: z.string().min(1, 'Title is required'),
    price: z.number().min(0, 'Price cannot be negative'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    pin_count: z.number().int().min(1, 'Pin count must be positive')
  })).min(1, 'At least one item required'),
  totalAmount: z.number().min(0.01, 'Total amount must be positive'),
  processingFee: z.number().min(0, 'Processing fee cannot be negative').optional(),
  userLocation: z.string().max(200, 'Location too long').optional(),
  userIp: z.string().max(45, 'IP address too long').optional(),
  customerEmail: z.string().email('Invalid customer email').optional(),
  userEmail: z.string().email('Invalid user email')
})

export const contactSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long')
})

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateGoogleMapsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('google') && urlObj.hostname.includes('maps')
  } catch {
    return false
  }
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

// Validation error handler
export function handleValidationError(error: z.ZodError): { status: number; message: string } {
  const firstError = error.errors[0]
  return {
    status: 400,
    message: firstError ? firstError.message : 'Validation failed'
  }
}

// Input sanitization middleware
export function sanitizeInput<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Security logging
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  userEmail?: string,
  ip?: string
): void {
  logger.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    userEmail,
    ip,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
  })
}

// CSRF protection
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken
}

// Password strength validation (for future use)
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// File upload validation
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { isValid: boolean; error?: string } {
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large' }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' }
  }
  
  return { isValid: true }
}

// Export all schemas for use in API routes
export const schemas = {
  user: userSchema,
  pinPack: pinPackSchema,
  pin: pinSchema,
  order: orderSchema,
  contact: contactSchema
} 