import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('API route called:', request.url)
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  
  console.log('Query parameter:', query)

  // Test endpoint - if query is "test", return success
  if (query === 'test') {
    return NextResponse.json({ message: 'API route is working', query })
  }

  if (!query) {
    console.log('No query provided')
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  console.log('API key exists:', !!apiKey)
  
  if (!apiKey) {
    console.log('No API key configured')
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    // First, try to find the place using text search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    console.log('Searching with URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()
    console.log('Search response status:', searchData.status)

    if (searchData.status === 'OK' && searchData.results.length > 0) {
      // Get the first result (most relevant)
      const place = searchData.results[0]
      console.log('Found place:', place.name)
      
      // Now get detailed information using the place_id
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,types&key=${apiKey}`
      
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      if (detailsData.status === 'OK') {
        console.log('Returning detailed place data')
        return NextResponse.json(detailsData.result)
      } else {
        // If details fail, return the search result
        console.log('Details failed, returning search result')
        return NextResponse.json({
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types
        })
      }
    } else {
      console.log('No places found for query:', query)
      return NextResponse.json({ error: 'No places found for this query' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 