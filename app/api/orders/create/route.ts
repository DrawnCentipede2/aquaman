import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Create a new order in the database
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { cartItems, totalAmount, processingFee, userLocation, userIp } = await request.json()
    
    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      )
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Create the order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalAmount,
        processing_fee: processingFee || 0.99,
        currency: 'USD',
        status: 'pending',
        user_location: userLocation,
        user_ip: userIp
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
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
      console.error('Error creating order items:', itemsError)
      // Clean up the order if items failed to create
      await supabase.from('orders').delete().eq('id', order.id)
      
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }
    
    // Return the created order
    return NextResponse.json({
      success: true,
      order: order
    })
    
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 