'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * File Search Corpus Service
 * Manages FileSearchStore operations via Gemini API
 */

interface FileSearchCorpus {
  id: string // Firestore doc ID
  googleFileSearchStoreId: string // "fileSearchStores/abc123"
  displayName: string // "Biologie Clasa 10"
  description?: string
  createdAt: Date
  createdBy?: string
  documentCount: number
  estimatedStorageBytes: number
  lastModified: Date
  isActive: boolean
}

interface FileSearchDocument {
  id: string // document ID in FileSearchStore
  name: string // file name
  mimeType?: string
  uploadedAt: Date
}

// Get API key from localStorage (user config) or env
const getApiKey = (): string => {
  const apiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key')
    : process.env.NEXT_PUBLIC_GEMINI_FILE_SEARCH_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }
  return apiKey
}

// Get Google Cloud Project ID
const getProjectId = (): string => {
  const projectId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID not configured')
  }
  return projectId
}

/**
 * Create a new FileSearchStore
 */
export async function createFileSearchCorpus(
  displayName: string,
  description?: string
): Promise<FileSearchCorpus> {
  try {
    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const response = await fetch('/api/file-search/create-corpus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create FileSearchStore: ${error.error || response.statusText}`)
    }

    const data = await response.json()

    // data.name format: "projects/{projectId}/fileSearchStores/{storeId}"
    const storeId = data.name.split('/').pop()

    const corpus: FileSearchCorpus = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      googleFileSearchStoreId: data.name,
      displayName,
      description,
      createdAt: new Date(),
      documentCount: 0,
      estimatedStorageBytes: 0,
      lastModified: new Date(),
      isActive: true,
    }

    console.log(`✓ Created FileSearchStore: ${displayName}`)
    return corpus
  } catch (error) {
    console.error('Error creating FileSearchStore:', error)
    throw error
  }
}

/**
 * Upload and import a document to a FileSearchStore
 */
export async function uploadDocumentToFileSearch(
  corpusFileSearchStoreId: string,
  file: File
): Promise<FileSearchDocument> {
  try {
    console.log(`Uploading file: ${file.name}...`)

    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('corpusStoreId', corpusFileSearchStoreId)

    const response = await fetch('/api/file-search/upload-document', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Upload failed: ${error.error || response.statusText}`)
    }

    const importResult = await response.json()
    const documentId = importResult.name.split('/').pop()

    console.log(`✓ Document imported successfully`)

    const document: FileSearchDocument = {
      id: documentId,
      name: file.name,
      mimeType: file.type,
      uploadedAt: new Date(),
    }

    return document
  } catch (error) {
    console.error('Error uploading document:', error)
    throw error
  }
}

/**
 * List all documents in a FileSearchStore
 */
export async function listDocumentsInCorpus(
  corpusFileSearchStoreId: string
): Promise<FileSearchDocument[]> {
  try {
    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const response = await fetch(
      `/api/file-search/list-documents?corpusStoreId=${encodeURIComponent(corpusFileSearchStoreId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to list documents: ${error.error || response.statusText}`)
    }

    const data = await response.json()

    const documents: FileSearchDocument[] = (data.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(),
      name: doc.displayName,
      mimeType: doc.mimeType,
      uploadedAt: new Date(doc.createTime),
    }))

    return documents
  } catch (error) {
    console.error('Error listing documents:', error)
    throw error
  }
}

/**
 * Delete a document from FileSearchStore
 */
export async function deleteDocumentFromCorpus(
  corpusFileSearchStoreId: string,
  documentId: string
): Promise<void> {
  try {
    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const response = await fetch('/api/file-search/delete-document', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpusStoreId: corpusFileSearchStoreId,
        documentId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to delete document: ${error.error || response.statusText}`)
    }

    console.log(`✓ Document deleted: ${documentId}`)
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

/**
 * Delete entire FileSearchStore (all documents)
 */
export async function deleteFileSearchCorpus(
  corpusFileSearchStoreId: string
): Promise<void> {
  try {
    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const response = await fetch('/api/file-search/delete-corpus', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpusStoreId: corpusFileSearchStoreId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to delete FileSearchStore: ${error.error || response.statusText}`)
    }

    console.log(`✓ FileSearchStore deleted`)
  } catch (error) {
    console.error('Error deleting FileSearchStore:', error)
    throw error
  }
}

/**
 * Get FileSearchStore metadata/stats
 */
export async function getFileSearchCorpusStats(
  corpusFileSearchStoreId: string
): Promise<Partial<FileSearchCorpus>> {
  try {
    // Use API proxy route instead of direct fetch (avoids CORS issues)
    const response = await fetch(
      `/api/file-search/get-stats?corpusStoreId=${encodeURIComponent(corpusFileSearchStoreId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get stats: ${error.error || response.statusText}`)
    }

    const data = await response.json()

    return {
      googleFileSearchStoreId: data.googleFileSearchStoreId,
      displayName: data.displayName,
      documentCount: data.documentCount,
      lastModified: new Date(data.lastModified),
    }
  } catch (error) {
    console.error('Error getting corpus stats:', error)
    throw error
  }
}

export type { FileSearchCorpus, FileSearchDocument }
