import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { displayName } = await request.json()

    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    console.log('[create-corpus] API Key available:', !!apiKey)
    console.log('[create-corpus] Display Name:', displayName)

    if (!apiKey) {
      console.error('[create-corpus] Missing API key')
      return NextResponse.json(
        {
          error: 'Missing API key',
        },
        { status: 500 }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${apiKey}`
    console.log('[create-corpus] Calling Google API:', url.substring(0, 80) + '...')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName,
      }),
    })

    console.log('[create-corpus] Google API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[create-corpus] Error response:', errorText)

      let errorMessage = 'Failed to create FileSearchStore'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error?.message || errorMessage
      } catch (e) {
        // Response is not JSON
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[create-corpus] Success! Store ID:', data.name)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[create-corpus] Exception error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    )
  }
}
