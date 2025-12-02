'use client'

import { GoogleGenerativeAI, FileMetadataWithRenaming } from '@google/generative-ai'
import type { Corpus, CorpusDocument, Question } from '@/types'

let genAI: GoogleGenerativeAI | null = null

const initializeGemini = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not configured')
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Upload a file to Gemini and create/add to corpus
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
    const client = initializeGemini()

    // TODO: Implement actual Gemini File Search API integration
    // For MVP, we'll create a mock structure
    console.log(`Uploading ${file.name} to corpus ${corpusName}`)

    // Generate a document ID
    const documentId = `doc_${Date.now()}`

    return {
      documentId,
      name: file.name,
    }
  } catch (error) {
    console.error('Error uploading document to Gemini:', error)
    throw error
  }
}

/**
 * Create or get existing corpus
 */
export async function getOrCreateCorpus(
  name: string,
  displayName: string
): Promise<{ id: string; name: string; displayName: string }> {
  try {
    const client = initializeGemini()

    // TODO: Implement actual Gemini File Search API corpus creation
    // For MVP, we'll create a mock structure
    console.log(`Creating/getting corpus ${name}`)

    return {
      id: `corpus_${Date.now()}`,
      name,
      displayName,
    }
  } catch (error) {
    console.error('Error creating corpus:', error)
    throw error
  }
}

/**
 * Generate questions using Gemini
 */
export async function generateQuestionsWithGemini(params: {
  subject: string
  grade: number
  unit: string
  topic?: string
  itemTypes: string[]
  difficulty: { easy: number; medium: number; hard: number }
  totalCount: number
  corpusName?: string
}): Promise<Question[]> {
  try {
    const client = initializeGemini()
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build the prompt
    const prompt = buildGenerationPrompt(params)

    console.log('Sending prompt to Gemini...')

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON from response
    const questions = parseQuestionsJson(text)

    return questions
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

/**
 * Build generation prompt based on parameters
 */
function buildGenerationPrompt(params: {
  subject: string
  grade: number
  unit: string
  topic?: string
  itemTypes: string[]
  difficulty: { easy: number; medium: number; hard: number }
  totalCount: number
  corpusName?: string
}): string {
  const { subject, grade, unit, topic, itemTypes, difficulty, totalCount } = params

  const easyCount = Math.round(totalCount * (difficulty.easy / 100))
  const mediumCount = Math.round(totalCount * (difficulty.medium / 100))
  const hardCount = totalCount - easyCount - mediumCount

  const itemTypesStr = itemTypes.map((t) => `- ${t}`).join('\n')

  return `Tu ești un profesor experimentat care creează întrebări pentru platforma educațională QuizFun.app.

CONTEXT:
- Disciplina: ${subject}
- Clasa: ${grade}
- Unitatea de învățare: ${unit}
${topic ? `- Tema specifică: ${topic}` : ''}

CERINȚĂ:
Generează ${totalCount} întrebări distribuite astfel:
- ${easyCount} întrebări EASY (recunoaștere, identificare directă)
- ${mediumCount} întrebări MEDIUM (înțelegere, aplicare)
- ${hardCount} întrebări HARD (analiză, evaluare)

TIPURI DE ITEMI DE GENERAT:
${itemTypesStr}

REGULI IMPORTANTE:
1. Fiecare întrebare trebuie să aibă toate câmpurile obligatorii: type, question, competencyCode, bloomLevel, difficulty, data, explanation
2. Pentru multiple_choice_single: exact 4 răspunsuri, exact 1 corect, răspunsul corect plasat aleatoriu
3. Pentru true_false: adevărat sau fals, afirmație clară
4. Pentru toate tipurile: distractorii sunt plauzibili dar clar greșiți
5. Explicațiile sunt educative și ajută înțelegerea
6. Verifică de 3 ori corectitudinea faptică

COMPETENȚE: Folosește coduri ca 1.1, 1.2, 2.1, 2.2, 3.1, etc.

FORMAT OUTPUT OBLIGATORIU:
Returnează DOAR un JSON valid (fără text adițional):
{
  "questions": [
    {
      "type": "multiple_choice_single|true_false|matching|fill_in_blanks|ordering|categorization",
      "question": "Textul întrebării",
      "competencyCode": "1.1",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "difficulty": "easy|medium|hard",
      "data": { ... },
      "explanation": "Explicația detaliată",
      "requiresAI": false,
      "timeAllocation": "standard",
      "requiresKeyboard": false,
      "hints": []
    }
  ]
}

EXEMPLE PENTRU STRUCTURA DATA:

Multiple Choice Single:
"data": {
  "answers": [
    { "text": "Răspuns A", "correct": true },
    { "text": "Răspuns B", "correct": false },
    { "text": "Răspuns C", "correct": false },
    { "text": "Răspuns D", "correct": false }
  ],
  "shuffleAnswers": true
}

True/False:
"data": {
  "correctAnswer": true
}

Matching:
"data": {
  "pairs": [
    { "id": "p1", "left": "Element 1", "right": "Potrivire 1" },
    { "id": "p2", "left": "Element 2", "right": "Potrivire 2" }
  ],
  "shuffleRight": true
}

Fill in Blanks:
"data": {
  "template": "Textul cu {{blank1}} și {{blank2}}",
  "blanks": [
    { "id": "blank1", "options": ["Opțiune A", "Opțiune B", "Opțiune C", "Opțiune D"], "correctIndex": 0 },
    { "id": "blank2", "options": ["Opțiune X", "Opțiune Y", "Opțiune Z"], "correctIndex": 1 }
  ]
}

Ordering:
"data": {
  "items": [
    { "id": "e1", "text": "Evenimentul 1", "correctPosition": 1 },
    { "id": "e2", "text": "Evenimentul 2", "correctPosition": 2 }
  ],
  "shuffleOnDisplay": true
}

Categorization:
"data": {
  "categories": [
    { "id": "cat1", "name": "Cauze" },
    { "id": "cat2", "name": "Consecințe" }
  ],
  "items": [
    { "id": "i1", "text": "Element 1", "correctCategory": "cat1" },
    { "id": "i2", "text": "Element 2", "correctCategory": "cat2" }
  ],
  "shuffleItems": true
}

IMPORTANT: Returnează DOAR JSON valid, nimic altceva!`
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
