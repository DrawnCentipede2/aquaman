import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  // Test endpoint - if query is "test", return success
  if (query === 'test') {
    return NextResponse.json({ message: 'API route is working', query })
  }

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    // First, try to find the place using text search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status === 'OK' && searchData.results.length > 0) {
      // Get the first result (most relevant)
      const place = searchData.results[0]
      
      // Now get detailed information using the place_id
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,types&key=${apiKey}`
      
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      if (detailsData.status === 'OK') {
        return NextResponse.json({
          ...detailsData.result,
          place_id: place.place_id // Include the place_id for reviews
        })
      } else {
        // If details fail, return the search result
        return NextResponse.json({
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types,
          place_id: place.place_id // Include the place_id for reviews
        })
      }
    } else {
      return NextResponse.json({ error: 'No places found for this query' }, { status: 404 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
} 