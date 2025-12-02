/**
 * Local storage service for managing generated questions
 */

import type { StoredSession, Question, GenerationParams, Corpus } from '@/types'

const QUESTIONS_STORAGE_KEY = 'quizfun_generated_questions'
const CORPUS_STORAGE_KEY = 'quizfun_corpus_list'

/**
 * Save generated questions in a session
 */
export function saveQuestions(session: StoredSession): void {
  try {
    const existing = getSessions()
    existing.push(session)
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Error saving questions:', error)
  }
}

/**
 * Get all stored sessions
 */
export function getSessions(): StoredSession[] {
  try {
    const data = localStorage.getItem(QUESTIONS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error getting sessions:', error)
    return []
  }
}

/**
 * Get the most recent session
 */
export function getCurrentSession(): StoredSession | null {
  const sessions = getSessions()
  return sessions.length > 0 ? sessions[sessions.length - 1] : null
}

/**
 * Get session by ID
 */
export function getSessionById(sessionId: string): StoredSession | null {
  const sessions = getSessions()
  return sessions.find((s) => s.id === sessionId) || null
}

/**
 * Update a question in a session
 */
export function updateQuestion(sessionId: string, questionIndex: number, updatedQuestion: Question): void {
  try {
    const sessions = getSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session && questionIndex >= 0 && questionIndex < session.questions.length) {
      session.questions[questionIndex] = updatedQuestion
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(sessions))
    }
  } catch (error) {
    console.error('Error updating question:', error)
  }
}

/**
 * Delete a question from a session
 */
export function deleteQuestion(sessionId: string, questionIndex: number): void {
  try {
    const sessions = getSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session && questionIndex >= 0 && questionIndex < session.questions.length) {
      session.questions.splice(questionIndex, 1)
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(sessions))
    }
  } catch (error) {
    console.error('Error deleting question:', error)
  }
}

/**
 * Delete multiple questions from a session
 */
export function deleteQuestions(sessionId: string, indices: number[]): void {
  try {
    const sessions = getSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      // Sort indices in descending order to avoid index shifting
      const sortedIndices = indices.sort((a, b) => b - a)
      sortedIndices.forEach((i) => {
        if (i >= 0 && i < session.questions.length) {
          session.questions.splice(i, 1)
        }
      })
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(sessions))
    }
  } catch (error) {
    console.error('Error deleting questions:', error)
  }
}

/**
 * Clear an entire session
 */
export function clearSession(sessionId: string): void {
  try {
    const sessions = getSessions().filter((s) => s.id !== sessionId)
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

/**
 * Export session to JSON
 */
export function exportSessionToJson(session: StoredSession): string {
  return JSON.stringify(
    {
      metadata: {
        subject: session.params.subject,
        grade: session.params.grade,
        unit: session.params.unit,
        topic: session.params.topic,
        totalQuestions: session.questions.length,
        generatedAt: session.generatedAt,
      },
      questions: session.questions,
    },
    null,
    2
  )
}

/**
 * Export questions to JSON
 */
export function exportQuestionsToJson(questions: Question[]): string {
  return JSON.stringify(
    {
      questions,
      metadata: {
        totalQuestions: questions.length,
        exportedAt: new Date().toISOString(),
      },
    },
    null,
    2
  )
}

/**
 * Save corpus to localStorage
 */
export function saveCorpus(corpus: Corpus): void {
  try {
    const existing = getCorpora()
    const index = existing.findIndex((c) => c.id === corpus.id)
    if (index > -1) {
      existing[index] = corpus
    } else {
      existing.push(corpus)
    }
    localStorage.setItem(CORPUS_STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Error saving corpus:', error)
  }
}

/**
 * Get all corpora
 */
export function getCorpora(): Corpus[] {
  try {
    const data = localStorage.getItem(CORPUS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error getting corpora:', error)
    return []
  }
}

/**
 * Get corpus by ID
 */
export function getCorpusById(corpusId: string): Corpus | null {
  const corpora = getCorpora()
  return corpora.find((c) => c.id === corpusId) || null
}

/**
 * Get corpus by name
 */
export function getCorpusByName(name: string): Corpus | null {
  const corpora = getCorpora()
  return corpora.find((c) => c.name === name) || null
}

/**
 * Add document to corpus
 */
export function addDocumentToCorpus(corpusId: string, document: any): void {
  try {
    const corpora = getCorpora()
    const corpus = corpora.find((c) => c.id === corpusId)
    if (corpus) {
      corpus.documents.push(document)
      saveCorpus(corpus)
    }
  } catch (error) {
    console.error('Error adding document to corpus:', error)
  }
}

/**
 * Remove document from corpus
 */
export function removeDocumentFromCorpus(corpusId: string, documentId: string): void {
  try {
    const corpora = getCorpora()
    const corpus = corpora.find((c) => c.id === corpusId)
    if (corpus) {
      corpus.documents = corpus.documents.filter((d) => d.id !== documentId)
      saveCorpus(corpus)
    }
  } catch (error) {
    console.error('Error removing document from corpus:', error)
  }
}

/**
 * Delete corpus
 */
export function deleteCorpus(corpusId: string): void {
  try {
    const corpora = getCorpora().filter((c) => c.id !== corpusId)
    localStorage.setItem(CORPUS_STORAGE_KEY, JSON.stringify(corpora))
  } catch (error) {
    console.error('Error deleting corpus:', error)
  }
}

/**
 * Clear all storage (careful!)
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(QUESTIONS_STORAGE_KEY)
    localStorage.removeItem(CORPUS_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}
