import type { QuestionType, BloomLevel, Difficulty } from '@/types'

/**
 * Question types
 */
export const QUESTION_TYPES: Record<QuestionType, { label: string; description: string }> = {
  multiple_choice_single: {
    label: 'Alegere multiplă (1 răspuns)',
    description: 'Selectează răspunsul corect din 4 opțiuni',
  },
  multiple_choice_multiple: {
    label: 'Alegere multiplă (răspunsuri multiple)',
    description: 'Selectează toate răspunsurile corecte',
  },
  true_false: {
    label: 'Adevărat/Fals',
    description: 'Decide dacă afirmația este adevărată sau falsă',
  },
  matching: {
    label: 'Potrivire',
    description: 'Potrivește elementele din stânga cu cele din dreapta',
  },
  fill_in_blanks: {
    label: 'Completare spații',
    description: 'Completează spațiile goale cu termenii potriviți',
  },
  ordering: {
    label: 'Ordonare',
    description: 'Ordonează elementele în ordinea corectă (de obicei cronologică)',
  },
  categorization: {
    label: 'Categorizare',
    description: 'Grupează elementele în categorii date',
  },
  structured_questions: {
    label: 'Întrebări structurate (cu AI)',
    description: 'Răspunde la mai multe cerințe gradate',
  },
  structured_essay: {
    label: 'Eseu structurat (cu AI)',
    description: 'Redactează un eseu pe baza cerințelor',
  },
}

/**
 * Bloom levels
 */
export const BLOOM_LEVELS: Record<BloomLevel, string> = {
  remember: 'Amintire',
  understand: 'Înțelegere',
  apply: 'Aplicare',
  analyze: 'Analiză',
  evaluate: 'Evaluare',
  create: 'Creare',
}

/**
 * Difficulty levels
 */
export const DIFFICULTY_LEVELS: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Ușoară', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medie', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Grea', color: 'bg-red-100 text-red-800' },
}

/**
 * Document types
 */
export const DOCUMENT_TYPES = {
  manual: 'Manual',
  curriculum: 'Programă școlară',
  guide: 'Ghid metodologic',
}

/**
 * Time allocations
 */
export const TIME_ALLOCATIONS = {
  standard: '30 secunde',
  extended: '2-5 minute',
  unlimited: 'Fără limită',
}

/**
 * Subjects (Romanian curriculum)
 */
export const SUBJECTS = [
  { id: 'matematica', name: 'Matematică', icon: '📐', supportsAI: false },
  { id: 'romana', name: 'Limba și Literatura Română', icon: '📚', supportsAI: true },
  { id: 'istorie', name: 'Istorie', icon: '📜', supportsAI: true },
  { id: 'geografie', name: 'Geografie', icon: '🗺️', supportsAI: true },
  { id: 'fizica', name: 'Fizică', icon: '⚛️', supportsAI: false },
  { id: 'chimie', name: 'Chimie', icon: '🧪', supportsAI: false },
  { id: 'biologie', name: 'Biologie', icon: '🔬', supportsAI: false },
  { id: 'informatica', name: 'Informatică', icon: '💻', supportsAI: false },
  { id: 'educatie_civica', name: 'Educație Civică', icon: '🏛️', supportsAI: true },
  { id: 'engleaza', name: 'Limba Engleză', icon: '🌐', supportsAI: true },
  { id: 'franceza', name: 'Limba Franceză', icon: '🇫🇷', supportsAI: true },
]

/**
 * Grade levels
 */
export const GRADES = [
  { value: 5, label: 'Clasa V' },
  { value: 6, label: 'Clasa VI' },
  { value: 7, label: 'Clasa VII' },
  { value: 8, label: 'Clasa VIII' },
  { value: 9, label: 'Clasa IX' },
  { value: 10, label: 'Clasa X' },
  { value: 11, label: 'Clasa XI' },
  { value: 12, label: 'Clasa XII' },
]

/**
 * Objective items (don't require AI for evaluation)
 */
export const OBJECTIVE_ITEMS: QuestionType[] = [
  'multiple_choice_single',
  'multiple_choice_multiple',
  'true_false',
  'matching',
  'fill_in_blanks',
  'ordering',
  'categorization',
]

/**
 * Subjective items (require AI for evaluation)
 */
export const SUBJECTIVE_ITEMS: QuestionType[] = [
  'structured_questions',
  'structured_essay',
]

/**
 * Default distribution for difficulty
 */
export const DEFAULT_DIFFICULTY = {
  easy: 40,
  medium: 40,
  hard: 20,
}
