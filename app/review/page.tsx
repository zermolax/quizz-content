'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Trash2, Edit2, Save, X, Download, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { getSessions, updateQuestion, deleteQuestion, deleteQuestions, exportQuestionsToJson } from '@/services/storage'
import { validateQuestion } from '@/lib/validation'
import { DIFFICULTY_LEVELS, BLOOM_LEVELS, QUESTION_TYPES } from '@/lib/constants'
import type { Question, StoredSession, ValidationResult } from '@/types'

export default function ReviewPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(new Map())
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

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
      setSelectedSession(stored[stored.length - 1]) // Select latest
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
    setEditingQuestion(JSON.parse(JSON.stringify(question))) // Deep copy
  }

  const handleSaveQuestion = () => {
    if (editingIndex !== null && editingQuestion && selectedSession) {
      updateQuestion(selectedSession.id, editingIndex, editingQuestion)

      // Update local state
      const updated = { ...selectedSession }
      updated.questions[editingIndex] = editingQuestion
      setSelectedSession(updated)

      // Revalidate
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
          {/* Session Info */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedSession.params.subject} - Clasa {selectedSession.params.grade}
                </h3>
                <p className="text-gray-600">{selectedSession.params.unit}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(selectedSession.generatedAt).toLocaleString('ro-RO')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{selectedSession.questions.length}</p>
                <p className="text-sm text-gray-600">Întrebări totale</p>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validCount}</div>
                <div className="text-xs text-green-700 mt-1">Valide</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                <div className="text-xs text-red-700 mt-1">Cu probleme</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'easy').length}
                </div>
                <div className="text-xs text-blue-700 mt-1">Easy</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'medium').length} / Hard:{' '}
                  {selectedSession.questions.filter((q) => q.difficulty === 'hard').length}
                </div>
                <div className="text-xs text-yellow-700 mt-1">Medium / Hard</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
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
              </div>

              <div className="flex-1"></div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedIndices.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Șterge ({selectedIndices.size})
                  </button>
                )}

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

            {/* Question Cards */}
            {filteredQuestions.map((question, displayIndex) => {
              // Find actual index in original array
              const actualIndex = selectedSession.questions.indexOf(question)
              const validation = validationResults.get(actualIndex)
              const isSelected = selectedIndices.has(actualIndex)
              const isEditing = editingIndex === actualIndex

              return (
                <div
                  key={actualIndex}
                  className={`bg-white rounded-lg shadow-sm border transition-all ${
                    isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  } ${validation?.isValid ? '' : 'border-red-300'}`}
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(actualIndex)}
                      className="w-5 h-5 text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-start gap-3 flex-wrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                          {QUESTION_TYPES[question.type as keyof typeof QUESTION_TYPES]?.label || question.type}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            DIFFICULTY_LEVELS[question.difficulty as keyof typeof DIFFICULTY_LEVELS]?.color
                          }`}
                        >
                          {DIFFICULTY_LEVELS[question.difficulty as keyof typeof DIFFICULTY_LEVELS]?.label ||
                            question.difficulty}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {BLOOM_LEVELS[question.bloomLevel as keyof typeof BLOOM_LEVELS] || question.bloomLevel}
                        </span>

                        {validation && !validation.isValid && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Problemă
                          </span>
                        )}
                        {validation && validation.isValid && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <p className="text-sm text-gray-700 mt-3 line-clamp-2">{question.question}</p>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditQuestion(actualIndex, question)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editează"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(actualIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Șterge"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Editor */}
                  {isEditing && editingQuestion && (
                    <div className="px-6 py-4 bg-gray-50 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Textul Întrebării</label>
                        <textarea
                          value={editingQuestion.question}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Explicație</label>
                        <textarea
                          value={editingQuestion.explanation}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Competență</label>
                          <input
                            type="text"
                            value={editingQuestion.competencyCode}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, competencyCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bloom</label>
                          <select
                            value={editingQuestion.bloomLevel}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, bloomLevel: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.keys(BLOOM_LEVELS).map((level) => (
                              <option key={level} value={level}>
                                {BLOOM_LEVELS[level as keyof typeof BLOOM_LEVELS]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dificultate</label>
                          <select
                            value={editingQuestion.difficulty}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveQuestion}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Salvează
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null)
                            setEditingQuestion(null)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Validation Errors */}
                  {validation && !validation.isValid && !isEditing && (
                    <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                      <p className="text-sm font-semibold text-red-900 mb-2">Erori detectate:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, i) => (
                          <li key={i} className="text-sm text-red-700">
                            {error}
                          </li>
                        ))}
                      </ul>
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
