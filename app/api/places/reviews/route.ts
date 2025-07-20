import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('placeId')
    const maxResults = searchParams.get('maxResults') || '3'

    console.log('API: Fetching reviews for placeId:', placeId)

    if (!placeId) {
      console.log('API: No placeId provided')
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }

    // Get Google Places API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.log('API: Google Places API key not configured')
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    // Fetch reviews from Google Places API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
    )

    if (!response.ok) {
      console.log('API: Google Places API request failed:', response.status)
      throw new Error('Failed to fetch from Google Places API')
    }

    const data = await response.json()
    console.log('API: Google Places API response:', data)

    // Check if the API returned an error
    if (data.status !== 'OK') {
      console.log('API: Google Places API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}`, details: data.error_message },
        { status: 400 }
      )
    }

    // Extract reviews from the response
    const reviews = data.result?.reviews || []
    console.log('API: Found reviews:', reviews.length)

    // Return the reviews
    return NextResponse.json({
      reviews: reviews.slice(0, parseInt(maxResults)),
      placeId,
      total: reviews.length,
      status: data.status
    })

  } catch (error) {
    console.error('API: Error fetching place reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
} 