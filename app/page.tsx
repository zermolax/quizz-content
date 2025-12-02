'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { FileUp, Sparkles, CheckSquare, Upload, BarChart3, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getSessions, getCorpora } from '@/services/storage'
import { useState, useEffect } from 'react'

interface Stats {
  totalDocuments: number
  totalGeneratedQuestions: number
  totalSessions: number
  recentSessions: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalGeneratedQuestions: 0,
    totalSessions: 0,
    recentSessions: [],
  })

  useEffect(() => {
    const sessions = getSessions()
    const corpora = getCorpora()

    let totalDocuments = 0
    corpora.forEach((corpus) => {
      totalDocuments += corpus.documents?.length || 0
    })

    let totalQuestions = 0
    sessions.forEach((session) => {
      totalQuestions += session.questions.length
    })

    setStats({
      totalDocuments,
      totalGeneratedQuestions: totalQuestions,
      totalSessions: sessions.length,
      recentSessions: sessions.slice(-5).reverse(),
    })
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Dashboard"
          description="Bine ai venit în QuizFun Content Manager"
        />

        <div className="px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Documents Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Documente Încărcate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDocuments}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">PDF-uri în corpus-uri</p>
            </div>

            {/* Questions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Întrebări Generate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalGeneratedQuestions}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">În localStorage (non-importate)</p>
            </div>

            {/* Sessions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Sesiuni Generare</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSessions}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Generări anterioare</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Acțiuni Rapide</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                href="/documents"
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <FileUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Documente</p>
                  <p className="text-xs text-gray-500">Încarcă PDF-uri</p>
                </div>
              </Link>

              <Link
                href="/generate"
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all"
              >
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Generare</p>
                  <p className="text-xs text-gray-500">Creează întrebări</p>
                </div>
              </Link>

              <Link
                href="/review"
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Review</p>
                  <p className="text-xs text-gray-500">Validare și editare</p>
                </div>
              </Link>

              <Link
                href="/import"
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 hover:border-green-400 hover:shadow-md transition-all"
              >
                <Upload className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Import</p>
                  <p className="text-xs text-gray-500">Salvează în DB</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Sessions */}
          {stats.recentSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sesiuni Recente</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {stats.recentSessions.map((session, index) => (
                    <div key={index} className="px-6 py-4 flex items-start justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {session.params.subject} - Clasa {session.params.grade}
                        </p>
                        <p className="text-sm text-gray-600">{session.params.unit}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.generatedAt).toLocaleString('ro-RO')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{session.questions.length} întrebări</p>
                        <p className="text-xs text-gray-500">
                          {session.questions.filter((q: any) => q.difficulty === 'easy').length} easy,{' '}
                          {session.questions.filter((q: any) => q.difficulty === 'medium').length} medium,{' '}
                          {session.questions.filter((q: any) => q.difficulty === 'hard').length} hard
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Primii pași</p>
              <p className="text-sm text-blue-700 mt-1">
                1. Configurează API keys în <Link href="/settings" className="underline font-semibold">Setări</Link>
                {' '}2. Încarcă documente în <Link href="/documents" className="underline font-semibold">Documente</Link>
                {' '}3. Generează întrebări în <Link href="/generate" className="underline font-semibold">Generare</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
