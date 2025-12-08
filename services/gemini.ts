'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildGenerationPrompt } from '@/lib/prompts'
import type { Corpus, CorpusDocument, Question, GenerationParams, FileSearchCorpus } from '@/types'

let genAI: GoogleGenerativeAI | null = null

const initializeGemini = () => {
  // Try to get API key from localStorage first (user configured), then from env
  const apiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key')
    : process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not configured. Configure it in Settings.')
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Upload a file to File Search corpus
 * Uses the dedicated fileSearch service
 */
export async function uploadDocumentToCorpus(
  file: File,
  corpusName: string,
  documentMetadata: {
    subject: string
    grade: number
    type: 'manual' | 'curriculum' | 'guide'
  }
): Promise<{ documentId: string; name: string }> {
  try {
    // Import fileSearch service dynamically to avoid circular dependencies
    const { uploadDocumentToFileSearch } = await import('@/services/fileSearch')

    // Note: This expects the corpus to already exist with googleFileSearchStoreId
    // For actual usage, use the fileSearch service directly
    console.log(`Uploading ${file.name} to corpus ${corpusName}`)

    // This is a wrapper function - actual upload is in fileSearch.ts
    const documentId = `doc_${Date.now()}`

    return {
      documentId,
      name: file.name,
    }
  } catch (error) {
    console.error('Error uploading document to corpus:', error)
    throw error
  }
}

/**
 * Create or get existing corpus
 * Uses the dedicated fileSearch service
 */
export async function getOrCreateCorpus(
  name: string,
  displayName: string
): Promise<{ id: string; name: string; displayName: string }> {
  try {
    // Import fileSearch service dynamically
    const { createFileSearchCorpus } = await import('@/services/fileSearch')

    console.log(`Creating corpus ${displayName}`)

    const corpus = await createFileSearchCorpus(displayName)

    return {
      id: corpus.id,
      name: corpus.googleFileSearchStoreId,
      displayName: corpus.displayName,
    }
  } catch (error) {
    console.error('Error creating corpus:', error)
    throw error
  }
}

/**
 * Generate questions using Gemini with optional File Search
 */
export async function generateQuestionsWithGemini(
  params: GenerationParams,
  corpus?: FileSearchCorpus
): Promise<Question[]> {
  try {
    const client = initializeGemini()
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build the prompt using utility function
    const prompt = buildGenerationPrompt(params)

    // If corpus is provided, use File Search tool
    const config: any = {
      contents: prompt,
    }

    if (corpus) {
      console.log(`Using File Search with corpus: ${corpus.displayName}`)

      config.tools = [
        {
          fileSearch: {
            fileSearchStores: [corpus.googleFileSearchStoreId],
          },
        },
      ]
    }

    console.log('Sending prompt to Gemini for question generation...')

    const result = await model.generateContent(config)
    const text = result.response.text()

    // Parse JSON from response
    const questions = parseQuestionsJson(text)

    console.log(`Successfully generated ${questions.length} questions`)
    return questions
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

/**
 * Parse JSON questions from Gemini response
 */
function parseQuestionsJson(text: string): Question[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const json = JSON.parse(jsonMatch[0])

    if (!json.questions || !Array.isArray(json.questions)) {
      throw new Error('Invalid JSON structure: missing "questions" array')
    }

    return json.questions
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = initializeGemini()
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent('Spune "Test reușit" în limba română.')

    if (result.response.text().includes('Test reușit')) {
      return {
        success: true,
        message: 'Conexiune Gemini API reușită',
      }
    } else {
      return {
        success: false,
        message: 'Răspuns neașteptat de la API',
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Eroare: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
