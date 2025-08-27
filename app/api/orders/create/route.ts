import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Require authentication
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      logger.warn('Unauthorized order creation attempt', { ip: clientIP })
      return authResult.response!
    }

    const user = authResult.user

    // Parse and validate request body
    const body = await request.json()
    const { cartItems, totalAmount, processingFee, userLocation, userIp } = body

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

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Create the order record with authenticated user's email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalAmount,
        processing_fee: processingFee || 0.99,
        currency: 'USD',
        status: 'pending',
        user_location: sanitizedLocation,
        user_ip: sanitizedUserIp,
        customer_email: user.email, // Use authenticated user's email
        user_email: user.email // PinCloud user email for account linking
      })
      .select()
      .single()

    if (orderError) {
      logger.error('Failed to create order', { error: orderError, userEmail: user.email })
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
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Clean up the order if items failed to create
      await supabase.from('orders').delete().eq('id', order.id)

      logger.error('Failed to create order items', { error: itemsError, orderId: order.id })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      ))
    }

    logger.log('Order created successfully', { orderId: order.id, userEmail: user.email })

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