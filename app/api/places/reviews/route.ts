import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('placeId')
    const maxResults = searchParams.get('maxResults') || '3'

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }

    // Get Google Places API key from environment - server-side only
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_SERVER
    if (!apiKey) {
      // Log error but don't expose configuration details
      console.error('Google Maps API key not configured')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Fetch reviews from Google Places API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Places API')
    }

    const data = await response.json()

    // Check if the API returned an error
    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}`, details: data.error_message },
        { status: 400 }
      )
    }

    // Extract reviews from the response
    const reviews = data.result?.reviews || []

    // Return the reviews
    return NextResponse.json({
      reviews: reviews.slice(0, parseInt(maxResults)),
      placeId,
      total: reviews.length,
      status: data.status
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: errorMessage },
      { status: 500 }
    )
  }
} 