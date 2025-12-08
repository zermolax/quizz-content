'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { generateQuestionsWithGemini } from '@/services/gemini'
import { saveQuestions } from '@/services/storage'
import { validateQuestions, getValidationSummary } from '@/lib/validation'
import { SUBJECTS, GRADES, QUESTION_TYPES, DEFAULT_DIFFICULTY } from '@/lib/constants'
import type { Question, GenerationParams, QuestionType, Corpus, FileSearchCorpus } from '@/types'

interface GenerationState {
  status: 'idle' | 'generating' | 'validating' | 'success' | 'error'
  message: string
  progress: number
}

export default function GeneratePage() {
  // Form state
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [unit, setUnit] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedCorpus, setSelectedCorpus] = useState('')
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [useGeneralKnowledge, setUseGeneralKnowledge] = useState(true)

  // Difficulty distribution
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY)

  // Selected item types
  const [selectedItemTypes, setSelectedItemTypes] = useState<QuestionType[]>([
    'multiple_choice_single',
    'true_false',
    'matching',
  ])

  // Generation state
  const [generation, setGeneration] = useState<GenerationState>({
    status: 'idle',
    message: '',
    progress: 0,
  })

  const [fileSearchCorpora, setFileSearchCorpora] = useState<FileSearchCorpus[]>([])
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [selectedFileSearchCorpus, setSelectedFileSearchCorpus] = useState<FileSearchCorpus | null>(null)

  useEffect(() => {
    loadFileSearchCorpora()
  }, [])

  const loadFileSearchCorpora = () => {
    try {
      const stored = localStorage.getItem('file_search_corpora')
      if (stored) {
        const parsedCorpora = JSON.parse(stored) as Array<{
          id: string
          googleFileSearchStoreId: string
          displayName: string
          createdAt: string
        }>
        const converted: FileSearchCorpus[] = parsedCorpora.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          lastModified: new Date(c.createdAt),
          documentCount: 0,
          estimatedStorageBytes: 0,
          isActive: true,
          createdBy: 'user',
        }))
        setFileSearchCorpora(converted)
        if (converted.length > 0) {
          setSelectedFileSearchCorpus(converted[0])
        }
      }
    } catch (err) {
      console.error('Error loading File Search corpora:', err)
    }
  }

  const handleToggleItemType = (type: QuestionType) => {
    setSelectedItemTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleDifficultyChange = (key: 'easy' | 'medium' | 'hard', value: number) => {
    setDifficulty((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Normalize difficulty to sum to 100
  const normalizeDifficulty = () => {
    const total = difficulty.easy + difficulty.medium + difficulty.hard
    if (total === 0) return DEFAULT_DIFFICULTY

    return {
      easy: Math.round((difficulty.easy / total) * 100),
      medium: Math.round((difficulty.medium / total) * 100),
      hard: 100 - Math.round((difficulty.easy / total) * 100) - Math.round((difficulty.medium / total) * 100),
    }
  }

  const validateFormInputs = (): boolean => {
    if (!subject.trim()) {
      setGeneration({ status: 'error', message: 'Selectează disciplina', progress: 0 })
      return false
    }

    if (!grade.trim()) {
      setGeneration({ status: 'error', message: 'Selectează clasa', progress: 0 })
      return false
    }

    if (!unit.trim()) {
      setGeneration({ status: 'error', message: 'Introdu unitatea de învățare', progress: 0 })
      return false
    }

    if (selectedItemTypes.length === 0) {
      setGeneration({ status: 'error', message: 'Selectează cel puțin un tip de item', progress: 0 })
      return false
    }

    if (totalQuestions < 5 || totalQuestions > 100) {
      setGeneration({ status: 'error', message: 'Numărul de întrebări trebuie să fie între 5 și 100', progress: 0 })
      return false
    }

    return true
  }

  const handleGenerate = async () => {
    if (!validateFormInputs()) {
      return
    }

    const normalizedDifficulty = normalizeDifficulty()

    const params: GenerationParams = {
      subject,
      grade: parseInt(grade),
      unit,
      topic: topic || undefined,
      itemTypes: selectedItemTypes,
      difficulty: normalizedDifficulty,
      totalCount: totalQuestions,
      useGeneralKnowledge,
    }

    try {
      setGeneration({
        status: 'generating',
        message: 'Se generează întrebări cu Gemini AI...',
        progress: 30,
      })

      const questions = await generateQuestionsWithGemini(params, selectedFileSearchCorpus || undefined)

      setGeneration({
        status: 'validating',
        message: 'Se validează schema JSON...',
        progress: 70,
      })

      // Validate all questions
      const validationResults = validateQuestions(questions)
      const summary = getValidationSummary(validationResults)

      setGeneratedQuestions(questions)

      // Save to localStorage
      const sessionId = `session_${Date.now()}`
      saveQuestions({
        id: sessionId,
        generatedAt: new Date().toISOString(),
        params,
        questions,
      })

      setGeneration({
        status: 'success',
        message: `✅ Generate ${questions.length} întrebări (${summary.valid} valide, ${summary.invalid} cu probleme)`,
        progress: 100,
      })
    } catch (error) {
      setGeneration({
        status: 'error',
        message: `Eroare: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0,
      })
    }
  }

  const subjectData = SUBJECTS.find((s) => s.id === subject)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Generare Întrebări"
          description="Configurează parametrii și lansează generarea cu Gemini AI"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Generare' },
          ]}
        />

        <div className="px-8 py-8 max-w-4xl mx-auto">
          {/* Info Box */}
          {generation.status === 'idle' && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Cum funcționează</p>
                <p className="text-sm text-blue-700 mt-1">
                  1. Completează parametrii de generare 2. Alege tipurile de itemi 3. Setează distribuția dificultății
                  4. Click &quot;Generează&quot; și așteaptă rezultatul
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Step 1: Context */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Context</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplina *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value)
                      setSelectedCorpus('')
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Selectează disciplina --</option>
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clasa *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Selectează clasa --</option>
                    {GRADES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unitatea de Învățare *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Primul Război Mondial"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Topic */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema Specifică (opțional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cauzele și consecințele"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Item Types */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Tipuri de Itemi</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(QUESTION_TYPES).map(([typeKey, typeData]) => (
                  <label key={typeKey} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={selectedItemTypes.includes(typeKey as QuestionType)}
                      onChange={() => handleToggleItemType(typeKey as QuestionType)}
                      className="w-5 h-5 text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{typeData.label}</p>
                      <p className="text-xs text-gray-600">{typeData.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Quantity & Distribution */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Distribuție Dificultate</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Total Întrebări: <span className="text-lg font-bold text-blue-600">{totalQuestions}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Easy */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Ușoare (Easy)</label>
                    <span className="text-sm font-bold text-green-600">
                      {difficulty.easy}% ({Math.round(totalQuestions * (difficulty.easy / 100))})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={difficulty.easy}
                    onChange={(e) => handleDifficultyChange('easy', parseInt(e.target.value))}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Medium */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Medii (Medium)</label>
                    <span className="text-sm font-bold text-yellow-600">
                      {difficulty.medium}% ({Math.round(totalQuestions * (difficulty.medium / 100))})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={difficulty.medium}
                    onChange={(e) => handleDifficultyChange('medium', parseInt(e.target.value))}
                    className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Hard */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Grele (Hard)</label>
                    <span className="text-sm font-bold text-red-600">
                      {difficulty.hard}% ({Math.round(totalQuestions * (difficulty.hard / 100))})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={difficulty.hard}
                    onChange={(e) => handleDifficultyChange('hard', parseInt(e.target.value))}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: File Search Corpus Selection */}
            {fileSearchCorpora.length > 0 && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Corpus File Search (Opțional)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selectează un corpus:</label>
                  <select
                    value={selectedFileSearchCorpus?.id || ''}
                    onChange={(e) => {
                      const corpus = fileSearchCorpora.find((c) => c.id === e.target.value)
                      setSelectedFileSearchCorpus(corpus || null)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Nu folosi corpus --</option>
                    {fileSearchCorpora.map((corpus) => (
                      <option key={corpus.id} value={corpus.id}>
                        {corpus.displayName} ({corpus.documentCount || 0} documente)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-2">
                    Dacă selectezi un corpus, Gemini va folosi documentele din acesta pentru a genera întrebări.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Advanced Options */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Opțiuni Avansate</h3>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={useGeneralKnowledge}
                  onChange={(e) => setUseGeneralKnowledge(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Folosește cunoștințe generale AI</p>
                  <p className="text-xs text-gray-600">
                    Dacă dezactivezi, AI va folosi DOAR documentele din corpus (dacă selectat)
                  </p>
                </div>
              </label>
            </div>

            {/* Generation Progress */}
            {generation.status !== 'idle' && (
              <div className="mb-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  {generation.status === 'generating' || generation.status === 'validating' ? (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="font-semibold text-gray-900">{generation.message}</p>
                    </>
                  ) : generation.status === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-600">{generation.message}</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-red-600">{generation.message}</p>
                    </>
                  )}
                </div>

                {(generation.status === 'generating' || generation.status === 'validating') && (
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generation.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Questions Info */}
            {generatedQuestions.length > 0 && (
              <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  ✅ {generatedQuestions.length} întrebări generate cu succes!
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-green-900">Easy:</span>
                    <span className="ml-2 text-green-700">
                      {generatedQuestions.filter((q) => q.difficulty === 'easy').length}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-yellow-900">Medium:</span>
                    <span className="ml-2 text-yellow-700">
                      {generatedQuestions.filter((q) => q.difficulty === 'medium').length}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-red-900">Hard:</span>
                    <span className="ml-2 text-red-700">
                      {generatedQuestions.filter((q) => q.difficulty === 'hard').length}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <a
                    href="/review"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Mergi la Review →
                  </a>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {generation.status === 'idle' || generation.status === 'error' ? (
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-lg"
              >
                <Sparkles className="w-5 h-5" />
                🚀 Generează Întrebări
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
