'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState } from 'react'
import { testGeminiConnection } from '@/services/gemini'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error'
  message: string
}

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : ''
  )
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [geminiTest, setGeminiTest] = useState<TestResult>({ status: 'idle', message: '' })

  const handleSaveGeminiKey = () => {
    if (!geminiKey.trim()) {
      alert('API Key nu poate fi gol')
      return
    }
    localStorage.setItem('gemini_api_key', geminiKey)
    alert('API Key salvat cu succes!')
  }

  const handleTestGemini = async () => {
    setGeminiTest({ status: 'testing', message: 'Se testează conexiunea...' })
    try {
      const result = await testGeminiConnection()
      setGeminiTest({
        status: result.success ? 'success' : 'error',
        message: result.message,
      })
    } catch (error) {
      setGeminiTest({
        status: 'error',
        message: `Eroare: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Setări"
          description="Configurare API keys și credențiale"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Setări' },
          ]}
        />

        <div className="px-8 py-8 max-w-2xl">
          {/* Gemini API Key Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gemini API Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative flex gap-2">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {showGeminiKey ? 'Ascunde' : 'Arată'}
                  </button>
                  <button
                    onClick={handleSaveGeminiKey}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Salvează
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Obțineți API key de la{' '}
                  <a
                    href="https://ai.google.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    ai.google.dev
                  </a>
                </p>
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  onClick={handleTestGemini}
                  disabled={geminiTest.status === 'testing' || !geminiKey.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {geminiTest.status === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Se testează...
                    </>
                  ) : (
                    'Test Conexiune'
                  )}
                </button>
              </div>

              {/* Test Result */}
              {geminiTest.status !== 'idle' && (
                <div
                  className={`p-4 rounded-lg flex gap-3 ${
                    geminiTest.status === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {geminiTest.status === 'success' ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        geminiTest.status === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {geminiTest.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Firebase Configuration Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Firebase Configuration</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Implementare viitoare</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Firebase configuration va fi adăugată în următoarea fază. Pentru MVP, întrebările vor fi salvate local
                  și pot fi importate manual.
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Informații Utile</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Gemini API Key se salvează în localStorage doar pentru MVP</li>
              <li>• Nu exponă API key-ul în Git sau variabile de mediu fără protecție</li>
              <li>• Vei putea conecta Firebase în pagina de Import</li>
              <li>• Toate configurările sunt locale în acest browser</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
