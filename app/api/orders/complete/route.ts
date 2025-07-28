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
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError.message },
        { status: 500 }
      )
    }
    
    // Get order items to increment download counts
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('pin_pack_id')
      .eq('order_id', orderId)
    
    if (itemsError) {
      // Log error but continue processing
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: itemsError.message },
        { status: 500 }
      )
    } else if (orderItems && orderItems.length > 0) {
      // Increment download count for each purchased pack
      
      for (const item of orderItems) {
        try {
          // Try using RPC function first
          const { error: rpcError } = await supabase.rpc('increment_download_count', {
            pack_id: item.pin_pack_id
          })
          
          if (rpcError) {
            // Fallback: Get current count and increment
            const { data: currentPack, error: fetchError } = await supabase
              .from('pin_packs')
              .select('download_count')
              .eq('id', item.pin_pack_id)
              .single()
            
            if (fetchError) {
              // Continue processing other items even if one fails
              continue
            } else {
              const newCount = (currentPack.download_count || 0) + 1
              const { error: updateError } = await supabase
                .from('pin_packs')
                .update({ download_count: newCount })
                .eq('id', item.pin_pack_id)
              
              if (updateError) {
                // Continue processing other items even if one fails
                continue
              }
            }
            
            // Also try to insert download record manually
            try {
              await supabase
                .from('pack_downloads')
                .insert({
                  pin_pack_id: item.pin_pack_id,
                  download_type: 'purchase'
                })
            } catch (downloadError) {
              // Continue processing even if download record fails
            }
          }
        } catch (error) {
          // Continue processing other items even if one fails
        }
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order completed successfully'
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
} 