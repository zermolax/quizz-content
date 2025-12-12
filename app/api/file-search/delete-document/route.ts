import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const { corpusStoreId, documentId } = await request.json()

    if (!corpusStoreId || !documentId) {
      return NextResponse.json(
        { error: 'corpusStoreId and documentId are required' },
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

    const documentPath = `${corpusStoreId}/documents/${documentId}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${documentPath}?key=${apiKey}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok && response.status !== 204) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || 'Failed to delete document' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete-document API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
