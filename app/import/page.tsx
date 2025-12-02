'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2, Code } from 'lucide-react'
import { getSessions, clearSession, getSessionById } from '@/services/storage'
import { DIFFICULTY_LEVELS } from '@/lib/constants'
import type { StoredSession } from '@/types'

interface ImportState {
  status: 'idle' | 'importing' | 'success' | 'error'
  message: string
  importedCount: number
  importedIds: string[]
}

export default function ImportPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(null)
  const [themeName, setThemeName] = useState('')
  const [markAsActive, setMarkAsActive] = useState(true)
  const [importState, setImportState] = useState<ImportState>({
    status: 'idle',
    message: '',
    importedCount: 0,
    importedIds: [],
  })
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const stored = getSessions()
    setSessions(stored)
    if (stored.length > 0 && !selectedSession) {
      setSelectedSession(stored[stored.length - 1])
      setThemeName(`${stored[stored.length - 1].params.unit}`)
    }
  }

  const handleImport = async () => {
    if (!selectedSession) {
      setImportState({ status: 'error', message: 'Selectează o sesiune', importedCount: 0, importedIds: [] })
      return
    }

    if (!themeName.trim()) {
      setImportState({ status: 'error', message: 'Introdu numele temei', importedCount: 0, importedIds: [] })
      return
    }

    setImportState({
      status: 'importing',
      message: 'Se importă în Firestore...',
      importedCount: 0,
      importedIds: [],
    })

    // Simulate Firebase import
    setTimeout(() => {
      const importedIds = selectedSession.questions.map((_, i) => `doc_${Date.now()}_${i}`)

      setImportState({
        status: 'success',
        message: `✅ Importate ${selectedSession.questions.length} întrebări cu succes!`,
        importedCount: selectedSession.questions.length,
        importedIds,
      })
    }, 1500)
  }

  const handleExportRawJson = () => {
    if (!selectedSession) return

    const json = JSON.stringify(
      {
        metadata: {
          subject: selectedSession.params.subject,
          grade: selectedSession.params.grade,
          themeId: `theme_${Date.now()}`,
          themeName: themeName || selectedSession.params.unit,
          generatedAt: selectedSession.generatedAt,
          totalQuestions: selectedSession.questions.length,
        },
        questions: selectedSession.questions,
      },
      null,
      2
    )

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearSession = () => {
    if (!selectedSession) return
    if (confirm('Sigur vrei să ștergi sesiunea din localStorage?')) {
      clearSession(selectedSession.id)
      loadSessions()
      setSelectedSession(null)
      setImportState({ status: 'idle', message: '', importedCount: 0, importedIds: [] })
    }
  }

  if (!selectedSession) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header title="Import în Firestore" description="Salvare și transfer de date" />
          <div className="px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nu există sesiuni de generat</p>
              <a href="/generate" className="text-blue-600 hover:underline font-semibold">
                Generează întrebări mai întâi →
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Import în Firestore"
          description="Salvare și transfer de întrebări în baza de date"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Import' },
          ]}
        />

        <div className="px-8 py-8 max-w-4xl mx-auto">
          {/* Session Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Selectează Sesiune</h3>

            {sessions.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <select
                  value={selectedSession.id}
                  onChange={(e) => {
                    const session = getSessionById(e.target.value)
                    if (session) {
                      setSelectedSession(session)
                      setThemeName(session.params.unit)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.params.subject} - Clasa {session.params.grade} - {session.params.unit} ({' '}
                      {session.questions.length} întrebări)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Pre-Import Summary */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Sumar Pre-Import</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{selectedSession.questions.length}</div>
                <div className="text-xs text-blue-700 mt-1">Întrebări totale</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'easy').length}
                </div>
                <div className="text-xs text-green-700 mt-1">Easy (recunoaștere)</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'medium').length}
                </div>
                <div className="text-xs text-yellow-700 mt-1">Medium (înțelegere)</div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {selectedSession.questions.filter((q) => q.difficulty === 'hard').length}
                </div>
                <div className="text-xs text-red-700 mt-1">Hard (analiză)</div>
              </div>
            </div>

            {/* Difficulty Distribution */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">Distribuție tip de itemi:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(selectedSession.questions.map((q) => q.type))).map((type) => {
                  const count = selectedSession.questions.filter((q) => q.type === type).length
                  return (
                    <span
                      key={type}
                      className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded"
                    >
                      {type}: {count}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Firebase Configuration */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Configurare Destinație</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Temă (Firestore)
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="Ex: Primul Război Mondial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aceasta va crea o colecție "themes" în Firestore dacă nu există
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="markActive"
                  checked={markAsActive}
                  onChange={(e) => setMarkAsActive(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="markActive" className="text-sm font-medium text-gray-700">
                  Marchează întrebările ca active în Firestore
                </label>
              </div>
            </div>
          </div>

          {/* Import Status */}
          {importState.status !== 'idle' && (
            <div className="mb-8 p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-4">
                {importState.status === 'importing' ? (
                  <>
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">{importState.message}</p>
                      <div className="mt-3 w-64 bg-gray-300 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </>
                ) : importState.status === 'success' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-green-900">{importState.message}</p>
                      {importState.importedIds.length > 0 && (
                        <p className="text-xs text-green-700 mt-2">
                          Primele ID-uri importate: {importState.importedIds.slice(0, 3).join(', ')}...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <p className="font-semibold text-red-900">{importState.message}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Raw JSON Option */}
          <div className="mb-8">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <Code className="w-4 h-4" />
              {showRawJson ? 'Ascunde' : 'Arată'} JSON brut
            </button>

            {showRawJson && (
              <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>
                  {JSON.stringify(
                    {
                      metadata: {
                        subject: selectedSession.params.subject,
                        grade: selectedSession.params.grade,
                        themeName,
                        totalQuestions: selectedSession.questions.length,
                      },
                      questions: selectedSession.questions.slice(0, 2),
                    },
                    null,
                    2
                  )}
                </pre>
                {selectedSession.questions.length > 2 && (
                  <p className="text-gray-500 mt-2">... și {selectedSession.questions.length - 2} alte întrebări</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {importState.status !== 'importing' && (
              <>
                <button
                  onClick={handleImport}
                  disabled={!themeName.trim() || importState.status === 'importing'}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Importă în Firestore
                </button>

                <button
                  onClick={handleExportRawJson}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  📥 Export JSON (backup)
                </button>

                <button
                  onClick={handleClearSession}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  🗑️ Șterge Sesiune
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Implementare pe MVP</p>
              <p className="text-sm text-blue-700 mt-1">
                Pe MVP, import-ul este simulat. În producție, va crea o colecție "themes" în Firestore și va importa
                întrebările în colecția "questions" cu referințe corecte.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
