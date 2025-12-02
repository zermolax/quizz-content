/**
 * Gemini prompts for question generation
 * Based on QuizFun_Ghid_Generare_Continut.md
 */

import type { GenerationParams } from '@/types'

/**
 * Build the main generation prompt based on parameters
 */
export function buildGenerationPrompt(params: GenerationParams): string {
  const {
    subject,
    grade,
    unit,
    topic,
    itemTypes,
    difficulty,
    totalCount,
    useGeneralKnowledge,
  } = params

  // Calculate question distribution
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
${useGeneralKnowledge ? '- Folosești cunoștințe generale și din manuale' : '- Folosești DOAR documentele din corpus'}

CERINȚĂ:
Generează ${totalCount} întrebări distribuite așa:
- ${easyCount} întrebări EASY (recunoaștere, identificare directă, pentru elevi cu dificultăți)
- ${mediumCount} întrebări MEDIUM (înțelegere, aplicare, pentru elevul mediu)
- ${hardCount} întrebări HARD (analiză, evaluare, pentru performanță)

TIPURI DE ITEMI DE GENERAT:
${itemTypesStr}

REGULI IMPORTANTE:
1. FIECARE întrebare trebuie să aibă EXACT aceste câmpuri:
   - type: ${itemTypes[0]}
   - question: "Textul clar și fără ambiguități"
   - competencyCode: "1.1" (coduri din programă)
   - bloomLevel: "remember|understand|apply|analyze|evaluate|create"
   - difficulty: "easy|medium|hard"
   - data: { ... } (structură specifică tipului)
   - explanation: "Explicația educativă"
   - requiresAI: false
   - timeAllocation: "standard"
   - requiresKeyboard: false
   - hints: []

2. Pentru ALEGERE MULTIPLĂ SIMPLĂ:
   - EXACT 4 răspunsuri
   - EXACT 1 corect
   - Răspunsul corect plasat ALEATORIU (nu mereu pe poziția 1)
   - Distractorii sunt plauzibili dar clar greșiți

3. Pentru TRUE/FALSE:
   - Afirmația este CLAR adevărată sau CLAR falsă
   - Fără ambiguități sau negații duble

4. Pentru POTRIVIRE:
   - Minimum 3 perechi, maximum 5
   - Elementele din stânga și dreapta sunt distincte

5. Pentru COMPLETARE SPAȚII:
   - Fiecare spațiu gol ({{blank1}}, {{blank2}}) are 3-4 opțiuni dropdown
   - Variante plauzibile dar distincte

6. Pentru ORDONARE:
   - 4-6 elemente pentru ordonat
   - Ordinea cronologică sau cauzală
   - Pozițiile corecte sunt claare

7. Pentru CATEGORIZARE:
   - 2-3 categorii
   - 4-8 elemente de sortat
   - Fiecare categorie are minimum 2 elemente

8. VERIFICĂ DE 3 ORI corectitudinea faptică!

9. Explicația ajută elevul să înțeleagă de ce răspunsul este corect

COMPETENȚE: Folosește coduri din programă: 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, etc.

NIVELURI BLOOM:
- "remember": Amintire fapte, date, concepte simple
- "understand": Explicare, clasificare, comparație
- "apply": Utilizare în contexte noi
- "analyze": Destrămarea în componente, relații cauza-efect
- "evaluate": Apreciere, critică, argumentare
- "create": Sinteză, proiectare, creație

FORMAT OBLIGATORIU:
Returnează DOAR JSON valid (fără text adițional):

{
  "questions": [
    {
      "type": "...",
      "question": "...",
      "competencyCode": "1.1",
      "bloomLevel": "...",
      "difficulty": "...",
      "data": { ... },
      "explanation": "...",
      "requiresAI": false,
      "timeAllocation": "standard",
      "requiresKeyboard": false,
      "hints": []
    }
  ]
}

EXEMPLE DE DATA PE TIP:

Multiple Choice Single:
"data": {
  "answers": [
    { "text": "Opțiune corectă", "correct": true },
    { "text": "Opțiune greșită 1", "correct": false },
    { "text": "Opțiune greșită 2", "correct": false },
    { "text": "Opțiune greșită 3", "correct": false }
  ],
  "shuffleAnswers": true
}

True/False:
"data": { "correctAnswer": true }

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
    { "id": "blank1", "options": ["A", "B", "C", "D"], "correctIndex": 0 },
    { "id": "blank2", "options": ["X", "Y", "Z"], "correctIndex": 1 }
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
    { "id": "cat1", "name": "Categoria 1" },
    { "id": "cat2", "name": "Categoria 2" }
  ],
  "items": [
    { "id": "i1", "text": "Element 1", "correctCategory": "cat1" },
    { "id": "i2", "text": "Element 2", "correctCategory": "cat2" }
  ],
  "shuffleItems": true
}

IMPORTANT: RETURNEAZA DOAR JSON VALID, NIMIC ALTCEVA!`
}

/**
 * Build extraction prompt for learning units
 */
export function buildUnitExtractionPrompt(subject: string, grade: number): string {
  return `Analizează programa școlară pentru disciplina ${subject}, clasa a ${grade}-a.

Extrage TOATE unitățile de învățare în ordinea din programă.

Pentru fiecare unitate, returnează:
1. Numărul unității (1, 2, 3...)
2. Titlul exact al unității
3. Temele/subtemele incluse (lista)
4. Competențele specifice vizate (codurile: 1.1, 1.2, 2.1, etc.)
5. Ore estimate

Format JSON:

{
  "subject": "${subject}",
  "gradeLevel": ${grade},
  "units": [
    {
      "unitNumber": 1,
      "title": "Titlu exact din programă",
      "topics": ["Tema 1", "Tema 2"],
      "competencies": ["1.1", "1.2", "2.1"],
      "estimatedHours": 8
    }
  ]
}

IMPORTANT: Titluri EXACTE din programă, nu parafrazări!`
}

/**
 * Build competency extraction prompt
 */
export function buildCompetencyExtractionPrompt(subject: string, grade: number): string {
  return `Din programa școlară pentru ${subject}, clasa a ${grade}-a, extrage TOATE competențele specifice.

Pentru fiecare competență, returnează:
1. Codul (ex: 1.1, 1.2, 2.1)
2. Domeniul/categoria mare
3. Descrierea completă
4. Exemple de activități de învățare (dacă sunt în programă)

Format JSON:

{
  "subject": "${subject}",
  "gradeLevel": ${grade},
  "competencies": [
    {
      "code": "1.1",
      "domain": "Domeniu mare",
      "description": "Descriere completă a competenței",
      "activities": ["Activitate 1", "Activitate 2"]
    }
  ]
}

Codul competenței trebuie să fie EXACT din programă!`
}

/**
 * Build validation prompt for generated questions
 */
export function buildValidationPrompt(questionJson: string, questionType: string): string {
  return `Validează următoarea întrebare ${questionType} din perspectivă pedagogică:

${questionJson}

Verifică:
1. Corectitudine faptică (100% corect?)
2. Claritate formulare (fără ambiguități?)
3. Dificultate potrivită nivelului?
4. Răspuns clar distinct de distractori?
5. Explicație completă și educativă?

Returnează JSON:

{
  "isValid": true/false,
  "score": 0-100,
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": ["Sugestie 1"]
}`
}

/**
 * Build AI evaluation prompt for subjective answers
 */
export function buildEvaluationPrompt(
  question: string,
  rubric: string,
  studentAnswer: string
): string {
  return `Evaluează răspunsul elevului folosind rubrica dată.

ÎNTREBAREA:
${question}

RUBRICA:
${rubric}

RĂSPUNSUL ELEVULUI:
${studentAnswer}

Returnează evaluare JSON cu:
- score: punctajul obținut
- maxScore: punctaj maxim
- criteriaScores: array cu scor per criteriu
- feedback: feedback constructiv pentru elev

Format JSON:

{
  "score": 8,
  "maxScore": 10,
  "criteriaScores": [
    { "criterion": "Conținut", "score": 4, "maxScore": 4, "feedback": "..." },
    { "criterion": "Argumentare", "score": 2, "maxScore": 3, "feedback": "..." }
  ],
  "overallFeedback": "Feedback general pe 2-3 linii"
}`
}

/**
 * Get recommended question types for a subject
 */
export function getRecommendedQuestionTypesForSubject(subject: string): string[] {
  const objectiveTypes = [
    'multiple_choice_single',
    'multiple_choice_multiple',
    'true_false',
    'matching',
    'fill_in_blanks',
    'ordering',
    'categorization',
  ]

  // Subjects that support AI-based evaluation
  const aiSupportedSubjects = ['romana', 'istorie', 'geografie', 'educatie_civica', 'engleaza', 'franceza']

  const result = [...objectiveTypes]

  if (aiSupportedSubjects.includes(subject)) {
    result.push('structured_questions', 'structured_essay')
  }

  return result
}
