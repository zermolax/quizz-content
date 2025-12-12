import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const corpusStoreId = formData.get('corpusStoreId') as string

    if (!file || !corpusStoreId) {
      return NextResponse.json(
        { error: 'file and corpusStoreId are required' },
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

    // Step 1: Upload file to Files API
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/files?key=${apiKey}`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      return NextResponse.json(
        { error: error.error?.message || 'File upload failed' },
        { status: uploadResponse.status }
      )
    }

    const uploadedFile = await uploadResponse.json()
    const fileUri = uploadedFile.file.uri

    // Step 2: Import file into FileSearchStore
    const importResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${corpusStoreId}/documents:import?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importedFile: {
            mimeType: 'application/pdf',
            displayName: file.name,
          },
          fileUri,
        }),
      }
    )

    if (!importResponse.ok) {
      const error = await importResponse.json()
      return NextResponse.json(
        { error: error.error?.message || 'Import failed' },
        { status: importResponse.status }
      )
    }

    const importResult = await importResponse.json()
    return NextResponse.json(importResult)
  } catch (error) {
    console.error('Error in upload-document API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
