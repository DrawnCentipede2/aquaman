import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { requireAuth, checkRateLimit, sanitizeInput, addSecurityHeaders } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Create a new order in the database
export async function POST(request: NextRequest) {
  // Get client IP for rate limiting and logging
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'

  try {

    if (!checkRateLimit(`order_create_${clientIP}`, 5, 15 * 60 * 1000)) { // 5 orders per 15 minutes
      logger.warn('Rate limit exceeded for order creation', { ip: clientIP })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      ))
    }

    // Try cookie-based auth first, but allow trusted email from body in fallback for PayPal flow
    let userEmail: string | null = null
    const authResult = await requireAuth(request)
    if (authResult.success && authResult.user?.email) {
      userEmail = authResult.user.email
    }

    // Parse and validate request body
    const body = await request.json()
    const { cartItems, totalAmount, processingFee, userLocation, userIp, customerEmail, userEmail: bodyUserEmail } = body

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      ))
    }

    if (!totalAmount || totalAmount <= 0 || totalAmount > 10000) { // Max order $10,000
      return addSecurityHeaders(NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      ))
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.id || !item.price || item.price <= 0) {
        return addSecurityHeaders(NextResponse.json(
          { error: 'Invalid cart item' },
          { status: 400 }
        ))
      }
    }

    // Sanitize inputs
    const sanitizedLocation = sanitizeInput(userLocation || '')
    const sanitizedUserIp = sanitizeInput(userIp || clientIP)

    // Create Supabase clients
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const admin = createAdminClient()
    
    // Resolve effective email (cookie-auth wins; then body-provided email)
    const effectiveEmail = userEmail || bodyUserEmail || customerEmail || null

    if (!effectiveEmail) {
      logger.warn('Order creation missing user email', { ip: clientIP })
      return addSecurityHeaders(NextResponse.json(
        { error: 'User email required' },
        { status: 400 }
      ))
    }

    // Create the order record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        total_amount: totalAmount,
        processing_fee: processingFee || 0.99,
        currency: 'USD',
        status: 'pending',
        user_location: sanitizedLocation,
        user_ip: sanitizedUserIp,
        customer_email: effectiveEmail,
        user_email: effectiveEmail
      })
      .select()
      .single()

    if (orderError) {
      logger.error('Failed to create order', { error: orderError, userEmail: effectiveEmail })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      ))
    }
    
    // Create order items for each cart item
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      pin_pack_id: item.id,
      price: item.price
    }))
    
    const { error: itemsError } = await admin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Clean up the order if items failed to create
      await admin.from('orders').delete().eq('id', order.id)

      logger.error('Failed to create order items', { error: itemsError, orderId: order.id })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      ))
    }

    logger.log('Order created successfully', { orderId: order.id, userEmail: effectiveEmail })

    // Return sanitized order data (remove sensitive payment details)
    const sanitizedOrder = {
      id: order.id,
      total_amount: order.total_amount,
      currency: order.currency,
      status: order.status,
      created_at: order.created_at,
      // Exclude sensitive data: paypal_order_id, paypal_payer_id, paypal_payment_id, customer_email
    }

    const response = NextResponse.json({
      success: true,
      order: sanitizedOrder
    })

    return addSecurityHeaders(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.error('Order creation error', { error: errorMessage, ip: clientIP })
    return addSecurityHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
} 