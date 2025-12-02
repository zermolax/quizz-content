/**
 * Question types - all supported item types
 */
export type QuestionType =
  | 'multiple_choice_single'
  | 'multiple_choice_multiple'
  | 'true_false'
  | 'matching'
  | 'fill_in_blanks'
  | 'ordering'
  | 'categorization'
  | 'structured_questions'
  | 'structured_essay'

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type StimulusType = 'text' | 'image' | 'map' | 'chart' | 'table' | 'audio'

export type TimeAllocation = 'standard' | 'extended' | 'unlimited'

/**
 * Base question structure
 */
export interface BaseQuestion {
  type: QuestionType
  question: string
  competencyCode: string
  bloomLevel: BloomLevel
  difficulty: Difficulty
  explanation: string
  stimulus?: {
    type: StimulusType
    content: string
    source?: string
    mediaUrl?: string
  }
  instructions?: string
  hints?: string[]
  requiresAI: boolean
  timeAllocation: TimeAllocation
  requiresKeyboard: boolean
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Multiple Choice Single
 */
export interface Answer {
  text: string
  correct: boolean
}

export interface MultipleChoiceSingleQuestion extends BaseQuestion {
  type: 'multiple_choice_single'
  data: {
    answers: Answer[]
    shuffleAnswers: boolean
  }
}

/**
 * Multiple Choice Multiple
 */
export interface MultipleOption {
  text: string
  correct: boolean
}

export interface MultipleChoiceMultipleQuestion extends BaseQuestion {
  type: 'multiple_choice_multiple'
  data: {
    options: MultipleOption[]
    minCorrect: number
    scoringMode: 'all_or_nothing' | 'partial_credit'
    shuffleOptions: boolean
  }
}

/**
 * True/False
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false'
  data: {
    correctAnswer: boolean
  }
}

/**
 * Matching
 */
export interface MatchingPair {
  id: string
  left: string
  right: string
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  data: {
    pairs: MatchingPair[]
    shuffleRight: boolean
  }
}

/**
 * Fill in Blanks
 */
export interface BlankOption {
  id: string
  options: string[]
  correctIndex: number
}

export interface FillInBlanksQuestion extends BaseQuestion {
  type: 'fill_in_blanks'
  data: {
    template: string
    blanks: BlankOption[]
  }
}

/**
 * Ordering
 */
export interface OrderingItem {
  id: string
  text: string
  correctPosition: number
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering'
  data: {
    items: OrderingItem[]
    shuffleOnDisplay: boolean
  }
}

/**
 * Categorization
 */
export interface CategorizationCategory {
  id: string
  name: string
}

export interface CategorizationItem {
  id: string
  text: string
  correctCategory: string
}

export interface CategorizationQuestion extends BaseQuestion {
  type: 'categorization'
  data: {
    categories: CategorizationCategory[]
    items: CategorizationItem[]
    shuffleItems: boolean
  }
}

/**
 * Structured Questions
 */
export interface RubricLevel {
  points: number
  description: string
}

export interface RubricCriterion {
  criteria: string
  levels: RubricLevel[]
}

export interface Requirement {
  id: string
  text: string
  bloomLevel: BloomLevel
  maxPoints: number
  expectedLength: number
  rubric: RubricCriterion
}

export interface StructuredQuestionData {
  requirements: Requirement[]
  totalPoints: number
}

export interface StructuredQuestion extends BaseQuestion {
  type: 'structured_questions'
  data: StructuredQuestionData
  rubric?: any
}

/**
 * Structured Essay
 */
export interface StructuredEssayData {
  essayPrompt: string
  requiredElements: string[]
  constraints: {
    minWords: number
    maxWords: number
    requiredStructure: boolean
  }
}

export interface RubricScore {
  id: string
  name: string
  maxPoints: number
  description: string
  levels: RubricLevel[]
}

export interface StructuredEssay extends BaseQuestion {
  type: 'structured_essay'
  data: StructuredEssayData
  rubric: {
    totalPoints: number
    criteria: RubricScore[]
  }
}

/**
 * Union type for all question types
 */
export type Question =
  | MultipleChoiceSingleQuestion
  | MultipleChoiceMultipleQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | FillInBlanksQuestion
  | OrderingQuestion
  | CategorizationQuestion
  | StructuredQuestion
  | StructuredEssay

/**
 * Generation parameters
 */
export interface GenerationParams {
  subject: string
  grade: number
  unit: string
  topic?: string
  itemTypes: QuestionType[]
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
  totalCount: number
  useGeneralKnowledge: boolean
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Storage session
 */
export interface StoredSession {
  id: string
  generatedAt: string
  params: GenerationParams
  questions: Question[]
}

/**
 * Gemini corpus
 */
export interface Corpus {
  id: string
  name: string
  displayName: string
  documents: CorpusDocument[]
}

/**
 * Corpus document
 */
export interface CorpusDocument {
  id: string
  name: string
  subject: string
  grade: number
  type: 'manual' | 'curriculum' | 'guide'
  uploadedAt: string
}

/**
 * Firebase theme
 */
export interface FirebaseTheme {
  id: string
  slug: string
  name: string
  description: string
  subjectId: string
  gradeLevel: number
  unitNumber: number
  topics: string[]
  targetCompetencies: string[]
  icon?: string
  color?: string
}

/**
 * Firebase subject
 */
export interface FirebaseSubject {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  availableGrades: number[]
  supportsSubjectiveItems: boolean
}
