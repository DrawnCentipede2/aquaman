import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Returns purchased pin packs for a given user email (completed orders only)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get completed orders for either user_email or customer_email matching the provided email
    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select('id')
      .eq('status', 'completed')
      .or(`user_email.eq.${email},customer_email.eq.${email}`)

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ packs: [] })
    }

    const orderIds = orders.map(o => o.id)

    // Get order items for these orders
    const { data: orderItems, error: itemsError } = await admin
      .from('order_items')
      .select('pin_pack_id')
      .in('order_id', orderIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ packs: [] })
    }

    const packIds = Array.from(new Set(orderItems.map(i => i.pin_pack_id)))

    // Fetch pack details
    const { data: packs, error: packsError } = await admin
      .from('pin_packs')
      .select('*')
      .in('id', packIds)

    if (packsError) {
      return NextResponse.json({ error: packsError.message }, { status: 500 })
    }

    return NextResponse.json({ packs: packs || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


