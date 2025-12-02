'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Trash2, Edit2, Save, X, Download, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { getSessions, updateQuestion, deleteQuestion, deleteQuestions, exportQuestionsToJson } from '@/services/storage'
import { validateQuestion } from '@/lib/validation'
import { DIFFICULTY_LEVELS, BLOOM_LEVELS, QUESTION_TYPES } from '@/lib/constants'
import type { Question, StoredSession, ValidationResult, Answer, MatchingPair, BlankOption, OrderingItem, CategorizationItem } from '@/types'

interface ExpandedQuestions {
  [key: number]: boolean
}

function DataPreview({ question }: { question: Question }) {
  switch (question.type) {
    case 'multiple_choice_single':
    case 'multiple_choice_multiple': {
      const answers = (question.data as any).answers || (question.data as any).options || []
      return (
        <div className="space-y-1">
          {answers.map((ans: Answer, i: number) => (
            <div key={i} className="text-xs p-2 bg-gray-50 rounded flex items-start gap-2">
              <span className={`font-semibold min-w-max ${ans.correct ? 'text-green-600' : 'text-gray-600'}`}>
                {ans.correct ? '✓' : '○'} {String.fromCharCode(65 + i)}:
              </span>
              <span className={ans.correct ? 'text-green-700 font-medium' : 'text-gray-700'}>{ans.text}</span>
            </div>
          ))}
        </div>
      )
    }

    case 'true_false': {
      const correctAnswer = (question.data as any).correctAnswer
      return (
        <div className="text-xs p-2 bg-blue-50 rounded">
          <span className="font-semibold">Răspuns corect:</span>{' '}
          <span className="text-blue-700 font-medium">{correctAnswer ? 'ADEVĂRAT' : 'FALS'}</span>
        </div>
      )
    }

    case 'matching': {
      const pairs = (question.data as any).pairs || []
      return (
        <div className="text-xs space-y-1">
          {pairs.map((pair: MatchingPair, i: number) => (
            <div key={i} className="p-2 bg-purple-50 rounded flex gap-2">
              <span className="text-purple-700 font-medium flex-1">{pair.left}</span>
              <span className="text-purple-600">→</span>
              <span className="text-purple-700 flex-1">{pair.right}</span>
            </div>
          ))}
        </div>
      )
    }

    case 'fill_in_blanks': {
      const blanks = (question.data as any).blanks || []
      return (
        <div className="text-xs space-y-1">
          <div className="p-2 bg-yellow-50 rounded">
            <span className="text-yellow-900 font-medium">Template:</span>
            <p className="text-yellow-800 mt-1">{(question.data as any).template}</p>
          </div>
          {blanks.map((blank: BlankOption, i: number) => (
            <div key={i} className="p-2 bg-yellow-50 rounded">
              <span className="text-yellow-700 font-medium">{{blank{i + 1}}}: </span>
              <span className="text-yellow-600">{blank.options[blank.correctIndex]} ✓</span>
              <span className="text-yellow-500 ml-2 text-xs">({blank.options.join(', ')})</span>
            </div>
          ))}
        </div>
      )
    }

    case 'ordering': {
      const items = (question.data as any).items || []
      return (
        <div className="text-xs space-y-1">
          {items
            .sort((a: OrderingItem, b: OrderingItem) => a.correctPosition - b.correctPosition)
            .map((item: OrderingItem, i: number) => (
              <div key={i} className="p-2 bg-green-50 rounded flex gap-2">
                <span className="text-green-700 font-bold min-w-max">{item.correctPosition}.</span>
                <span className="text-green-800">{item.text}</span>
              </div>
            ))}
        </div>
      )
    }

    case 'categorization': {
      const categories = (question.data as any).categories || []
      const items = (question.data as any).items || []
      return (
        <div className="text-xs space-y-2">
          {categories.map((cat: any) => (
            <div key={cat.id}>
              <div className="font-semibold text-orange-700 mb-1">{cat.name}:</div>
              <div className="space-y-1">
                {items
                  .filter((item: CategorizationItem) => item.correctCategory === cat.id)
                  .map((item: CategorizationItem) => (
                    <div key={item.id} className="p-2 bg-orange-50 rounded text-orange-800">
                      • {item.text}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    default:
      return <div className="text-xs text-gray-500">-</div>
  }
}

export default function ReviewPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(new Map())
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [expandedQuestions, setExpandedQuestions] = useState<ExpandedQuestions>({})

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      validateAllQuestions(selectedSession.questions)
    }
  }, [selectedSession])

  const loadSessions = () => {
    const stored = getSessions()
    setSessions(stored)
    if (stored.length > 0 && !selectedSession) {
      setSelectedSession(stored[stored.length - 1])
    }
  }

  const validateAllQuestions = (questions: Question[]) => {
    const results = new Map<number, ValidationResult>()
    questions.forEach((q, i) => {
      results.set(i, validateQuestion(q))
    })
    setValidationResults(results)
  }

  const handleEditQuestion = (index: number, question: Question) => {
    setEditingIndex(index)
    setEditingQuestion(JSON.parse(JSON.stringify(question)))
  }

  const handleSaveQuestion = () => {
    if (editingIndex !== null && editingQuestion && selectedSession) {
      updateQuestion(selectedSession.id, editingIndex, editingQuestion)

      const updated = { ...selectedSession }
      updated.questions[editingIndex] = editingQuestion
      setSelectedSession(updated)

      const result = validateQuestion(editingQuestion)
      setValidationResults((prev) => {
        const newMap = new Map(prev)
        newMap.set(editingIndex, result)
        return newMap
      })

      setEditingIndex(null)
      setEditingQuestion(null)
    }
  }

  const handleDeleteQuestion = (index: number) => {
    if (confirm('Sigur vrei să ștergi această întrebare?')) {
      if (selectedSession) {
        deleteQuestion(selectedSession.id, index)
        const updated = { ...selectedSession }
        updated.questions.splice(index, 1)
        setSelectedSession(updated)
        validateAllQuestions(updated.questions)
        setSelectedIndices(new Set())
      }
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return
    if (!confirm(`Sigur vrei să ștergi ${selectedIndices.size} întrebări?`)) return

    if (selectedSession) {
      const indicesToDelete = Array.from(selectedIndices).sort((a, b) => b - a)
      deleteQuestions(selectedSession.id, indicesToDelete)
      const updated = { ...selectedSession }
      indicesToDelete.forEach((i) => {
        updated.questions.splice(i, 1)
      })
      setSelectedSession(updated)
      validateAllQuestions(updated.questions)
      setSelectedIndices(new Set())
    }
  }

  const handleToggleSelect = (index: number) => {
    const newSet = new Set(selectedIndices)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedIndices(newSet)
  }

  const handleSelectAll = () => {
    if (selectedSession) {
      if (selectedIndices.size === selectedSession.questions.length) {
        setSelectedIndices(new Set())
      } else {
        setSelectedIndices(new Set(selectedSession.questions.map((_, i) => i)))
      }
    }
  }

  const toggleExpanded = (index: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleExport = () => {
    if (selectedSession) {
      const json = exportQuestionsToJson(selectedSession.questions)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `questions_${selectedSession.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (!selectedSession) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header title="Review Întrebări" description="Validare și editare" />
          <div className="px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nu există sesiuni de generare</p>
              <a href="/generate" className="text-blue-600 hover:underline font-semibold">
                Generează întrebări mai întâi →
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const filteredQuestions = selectedSession.questions.filter((q) => {
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false
    if (filterType && q.type !== filterType) return false
    return true
  })

  const validCount = Array.from(validationResults.values()).filter((r) => r.isValid).length
  const invalidCount = validationResults.size - validCount

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Review Întrebări"
          description="Validare, editare și pregătire pentru import"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Review' },
          ]}
        />

        <div className="px-8 py-8">
          {/* Session Info & Stats */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
                <p className="text-2xl font-bold text-gray-900">{selectedSession.questions.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-green-600 font-semibold uppercase">Valide</p>
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-xs text-red-600 font-semibold uppercase">Probleme</p>
                <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Easy</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'easy').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'medium').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Hard</p>
                <p className="text-2xl font-bold text-red-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'hard').length}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-wrap gap-2 items-center">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toate dificultățile</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toate tipurile</option>
              {Object.keys(QUESTION_TYPES).map((type) => (
                <option key={type} value={type}>
                  {QUESTION_TYPES[type as keyof typeof QUESTION_TYPES].label}
                </option>
              ))}
            </select>

            <div className="flex-1"></div>

            {selectedIndices.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Șterge ({selectedIndices.size})
              </button>
            )}

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Select All Row */}
          <div className="mb-2 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIndices.size === filteredQuestions.length && filteredQuestions.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Selectează toate ({filteredQuestions.length})
              </span>
            </label>
          </div>

          {/* Questions List - Compact Layout */}
          <div className="space-y-2">
            {filteredQuestions.map((question, displayIndex) => {
              const actualIndex = selectedSession.questions.indexOf(question)
              const validation = validationResults.get(actualIndex)
              const isSelected = selectedIndices.has(actualIndex)
              const isEditing = editingIndex === actualIndex
              const isExpanded = expandedQuestions[actualIndex]

              return (
                <div
                  key={actualIndex}
                  className={`bg-white rounded-lg shadow-sm border transition-all ${
                    isSelected ? 'border-blue-400 bg-blue-50' : isExpanded ? 'border-gray-300' : 'border-gray-200'
                  } ${validation?.isValid ? '' : 'border-red-300'}`}
                >
                  {/* Header Row - Compact */}
                  <div className="flex items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(actualIndex)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />

                    {/* Quick Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 flex-wrap items-center mb-1">
                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                          {QUESTION_TYPES[question.type as keyof typeof QUESTION_TYPES]?.label.split('(')[0].trim()}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            DIFFICULTY_LEVELS[question.difficulty as keyof typeof DIFFICULTY_LEVELS]?.color
                          }`}
                        >
                          {DIFFICULTY_LEVELS[question.difficulty as keyof typeof DIFFICULTY_LEVELS]?.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                          {BLOOM_LEVELS[question.bloomLevel as keyof typeof BLOOM_LEVELS]}
                        </span>
                        {validation && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            validation.isValid
                              ? 'bg-green-100 text-green-800 flex items-center gap-1'
                              : 'bg-red-100 text-red-800 flex items-center gap-1'
                          }`}>
                            {validation.isValid ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Valid
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" /> {validation.errors.length} erori
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-1">{question.question}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {question.competencyCode}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleExpanded(actualIndex)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title={isExpanded ? 'Ascunde' : 'Arată detalii'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleEditQuestion(actualIndex, question)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editează"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(actualIndex)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Șterge"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && !isEditing && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-3">
                      {/* Data Preview */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Răspunsuri/Date</p>
                        <DataPreview question={question} />
                      </div>

                      {/* Explanation */}
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Explicație</p>
                        <p className="text-sm text-gray-800">{question.explanation}</p>
                      </div>

                      {/* Validation Errors */}
                      {validation && !validation.isValid && (
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Erori detectate:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {validation.errors.map((error, i) => (
                              <li key={i} className="text-xs text-red-700">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Mode */}
                  {isEditing && editingQuestion && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Textul Întrebării</label>
                        <textarea
                          value={editingQuestion.question}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Competență</label>
                          <input
                            type="text"
                            value={editingQuestion.competencyCode}
                            onChange={(e) =>
                              setEditingQuestion({ ...editingQuestion, competencyCode: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1.1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Bloom</label>
                          <select
                            value={editingQuestion.bloomLevel}
                            onChange={(e) =>
                              setEditingQuestion({ ...editingQuestion, bloomLevel: e.target.value as any })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.keys(BLOOM_LEVELS).map((level) => (
                              <option key={level} value={level}>
                                {BLOOM_LEVELS[level as keyof typeof BLOOM_LEVELS]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Dificultate</label>
                          <select
                            value={editingQuestion.difficulty}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Explicație</label>
                        <textarea
                          value={editingQuestion.explanation}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="bg-blue-50 p-2 rounded border border-blue-200 text-xs text-blue-700">
                        <p className="font-semibold mb-1">💡 Sugestie:</p>
                        <p>Pentru a edita răspunsurile/opțiunile, editează JSON-ul direct prin Export sau contactează support.</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveQuestion}
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Salvează
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null)
                            setEditingQuestion(null)
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
