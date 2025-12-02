import type { Question, ValidationResult } from '@/types'

const REQUIRED_FIELDS = [
  'type',
  'question',
  'competencyCode',
  'bloomLevel',
  'difficulty',
  'data',
  'explanation',
]

const VALID_TYPES = [
  'multiple_choice_single',
  'multiple_choice_multiple',
  'true_false',
  'matching',
  'fill_in_blanks',
  'ordering',
  'categorization',
  'structured_questions',
  'structured_essay',
]

const VALID_BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

/**
 * Validate a single question against the schema
 */
export function validateQuestion(question: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in question) || question[field] === undefined || question[field] === null) {
      errors.push(`Câmp obligatoriu lipsă: ${field}`)
    }
  }

  // Validate type
  if (question.type && !VALID_TYPES.includes(question.type)) {
    errors.push(`Tip invalid: ${question.type}`)
  }

  // Validate bloomLevel
  if (question.bloomLevel && !VALID_BLOOM_LEVELS.includes(question.bloomLevel)) {
    errors.push(`Nivel Bloom invalid: ${question.bloomLevel}`)
  }

  // Validate difficulty
  if (question.difficulty && !VALID_DIFFICULTIES.includes(question.difficulty)) {
    errors.push(`Dificultate invalidă: ${question.difficulty}`)
  }

  // Type-specific validation
  if (question.type && question.data) {
    const typeErrors = validateTypeSpecific(question.type, question.data)
    errors.push(...typeErrors)
  }

  // Question length warning
  if (question.question && question.question.length < 10) {
    warnings.push('Întrebarea pare prea scurtă (< 10 caractere)')
  }

  if (question.question && question.question.length > 500) {
    warnings.push('Întrebarea pare prea lungă (> 500 caractere)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Type-specific validation for data field
 */
function validateTypeSpecific(type: string, data: any): string[] {
  const errors: string[] = []

  switch (type) {
    case 'multiple_choice_single': {
      if (!data.answers || !Array.isArray(data.answers)) {
        errors.push('multiple_choice_single: lipsește array-ul answers')
      } else {
        if (data.answers.length !== 4) {
          errors.push(`multiple_choice_single: trebuie exact 4 răspunsuri (are ${data.answers.length})`)
        }
        const correctCount = data.answers.filter((a: any) => a.correct).length
        if (correctCount !== 1) {
          errors.push(`multiple_choice_single: trebuie exact 1 răspuns corect (are ${correctCount})`)
        }
        // Validate answers have text
        data.answers?.forEach((a: any, i: number) => {
          if (!a.text || typeof a.text !== 'string') {
            errors.push(`multiple_choice_single: răspunsul ${i + 1} nu are text valid`)
          }
        })
      }
      break
    }

    case 'true_false': {
      if (typeof data.correctAnswer !== 'boolean') {
        errors.push('true_false: correctAnswer trebuie să fie boolean')
      }
      break
    }

    case 'multiple_choice_multiple': {
      if (!data.options || !Array.isArray(data.options)) {
        errors.push('multiple_choice_multiple: lipsește array-ul options')
      } else {
        if (data.options.length < 4) {
          errors.push(`multiple_choice_multiple: trebuie minimum 4 opțiuni (are ${data.options.length})`)
        }
        const correctCount = data.options.filter((o: any) => o.correct).length
        if (correctCount < 2) {
          errors.push(`multiple_choice_multiple: trebuie minimum 2 răspunsuri corecte (are ${correctCount})`)
        }
      }
      break
    }

    case 'matching': {
      if (!data.pairs || !Array.isArray(data.pairs)) {
        errors.push('matching: lipsește array-ul pairs')
      } else if (data.pairs.length < 3) {
        errors.push(`matching: trebuie minimum 3 perechi (are ${data.pairs.length})`)
      } else {
        data.pairs.forEach((p: any, i: number) => {
          if (!p.left || !p.right) {
            errors.push(`matching: perechea ${i + 1} are câmpuri incomplete`)
          }
        })
      }
      break
    }

    case 'fill_in_blanks': {
      if (!data.template || typeof data.template !== 'string') {
        errors.push('fill_in_blanks: lipsește template-ul')
      }
      if (!data.blanks || !Array.isArray(data.blanks)) {
        errors.push('fill_in_blanks: lipsește array-ul blanks')
      } else {
        data.blanks.forEach((b: any, i: number) => {
          if (!b.options || !Array.isArray(b.options)) {
            errors.push(`fill_in_blanks: blank ${i + 1} nu are opțiuni`)
          }
          if (typeof b.correctIndex !== 'number' || b.correctIndex < 0) {
            errors.push(`fill_in_blanks: blank ${i + 1} nu are correctIndex valid`)
          }
        })
      }
      break
    }

    case 'ordering': {
      if (!data.items || !Array.isArray(data.items)) {
        errors.push('ordering: lipsește array-ul items')
      } else if (data.items.length < 3) {
        errors.push(`ordering: trebuie minimum 3 elemente (are ${data.items.length})`)
      } else {
        data.items.forEach((item: any, i: number) => {
          if (!item.text) {
            errors.push(`ordering: elementul ${i + 1} nu are text`)
          }
          if (typeof item.correctPosition !== 'number') {
            errors.push(`ordering: elementul ${i + 1} nu are correctPosition`)
          }
        })
      }
      break
    }

    case 'categorization': {
      if (!data.categories || !Array.isArray(data.categories)) {
        errors.push('categorization: lipsește array-ul categories')
      } else if (data.categories.length < 2) {
        errors.push('categorization: trebuie minimum 2 categorii')
      }

      if (!data.items || !Array.isArray(data.items)) {
        errors.push('categorization: lipsește array-ul items')
      } else if (data.items.length < 4) {
        errors.push(`categorization: trebuie minimum 4 elemente (are ${data.items.length})`)
      }
      break
    }

    case 'structured_questions': {
      if (!data.requirements || !Array.isArray(data.requirements)) {
        errors.push('structured_questions: lipsește array-ul requirements')
      } else if (data.requirements.length < 2) {
        errors.push('structured_questions: trebuie minimum 2 cerințe')
      }
      break
    }

    case 'structured_essay': {
      if (!data.essayPrompt || typeof data.essayPrompt !== 'string') {
        errors.push('structured_essay: lipsește essayPrompt')
      }
      if (!data.requiredElements || !Array.isArray(data.requiredElements)) {
        errors.push('structured_essay: lipsește array-ul requiredElements')
      }
      if (!data.constraints) {
        errors.push('structured_essay: lipsește constraints')
      }
      break
    }
  }

  return errors
}

/**
 * Validate all questions in a batch
 */
export function validateQuestions(questions: any[]): Map<number, ValidationResult> {
  const results = new Map<number, ValidationResult>()
  questions.forEach((q, i) => {
    results.set(i, validateQuestion(q))
  })
  return results
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(results: Map<number, ValidationResult>) {
  let validCount = 0
  let invalidCount = 0
  let warningCount = 0

  results.forEach((result) => {
    if (result.isValid) {
      validCount++
    } else {
      invalidCount++
    }
    if (result.warnings.length > 0) {
      warningCount++
    }
  })

  return {
    total: results.size,
    valid: validCount,
    invalid: invalidCount,
    withWarnings: warningCount,
  }
}
