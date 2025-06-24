import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Complete an order after successful PayPal payment
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { 
      orderId, 
      paypalOrderId, 
      paypalPayerId, 
      paypalPaymentId,
      customerEmail,
      customerName,
      paymentDetails
    } = await request.json()
    
    // Validate required fields
    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { error: 'Order ID and PayPal Order ID are required' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Update the order with PayPal details and mark as completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        paypal_order_id: paypalOrderId,
        paypal_payer_id: paypalPayerId,
        paypal_payment_id: paypalPaymentId,
        customer_email: customerEmail,
        customer_name: customerName,
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }
    
    // Get order items to increment download counts
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('pin_pack_id')
      .eq('order_id', orderId)
    
    if (!itemsError && orderItems) {
      // Increment download count for each purchased pack
      for (const item of orderItems) {
        await supabase.rpc('increment_download_count', {
          pack_id: item.pin_pack_id
        })
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order completed successfully'
    })
    
  } catch (error) {
    console.error('Order completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 