import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const corpusStoreId = request.nextUrl.searchParams.get('corpusStoreId')

    if (!corpusStoreId) {
      return NextResponse.json(
        { error: 'corpusStoreId is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 500 }
      )
    }

    // Get corpus info
    const corpusResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${corpusStoreId}?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!corpusResponse.ok) {
      const error = await corpusResponse.json()
      return NextResponse.json(
        { error: error.error?.message || 'Failed to get corpus' },
        { status: corpusResponse.status }
      )
    }

    const corpusData = await corpusResponse.json()

    // Get documents count
    const docsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${corpusStoreId}/documents?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    let documentCount = 0
    if (docsResponse.ok) {
      const docsData = await docsResponse.json()
      documentCount = (docsData.documents || []).length
    }

    return NextResponse.json({
      googleFileSearchStoreId: corpusData.name,
      displayName: corpusData.displayName,
      documentCount,
      lastModified: corpusData.updateTime,
    })
  } catch (error) {
    console.error('Error in get-stats API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
