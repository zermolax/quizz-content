'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Trash2, Upload, Plus, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import {
  createFileSearchCorpus,
  uploadDocumentToFileSearch,
  listDocumentsInCorpus,
  deleteDocumentFromCorpus,
  deleteFileSearchCorpus,
  getFileSearchCorpusStats,
} from '@/services/fileSearch'
import { SUBJECTS, GRADES, DOCUMENT_TYPES } from '@/lib/constants'
import type { FileSearchCorpus, FileSearchDocument } from '@/types'

interface LocalCorpusData {
  id: string
  googleFileSearchStoreId: string
  displayName: string
  createdAt: string
}

export default function DocumentsPage() {
  const [corpora, setCorpora] = useState<FileSearchCorpus[]>([])
  const [selectedCorpus, setSelectedCorpus] = useState<FileSearchCorpus | null>(null)
  const [documents, setDocuments] = useState<FileSearchDocument[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCorpusName, setNewCorpusName] = useState('')
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadSubject, setUploadSubject] = useState('')
  const [uploadGrade, setUploadGrade] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Local storage key for corpus metadata
  const CORPORA_STORAGE_KEY = 'file_search_corpora'

  const loadCorpora = () => {
    try {
      const stored = localStorage.getItem(CORPORA_STORAGE_KEY)
      if (stored) {
        const parsedCorpora = JSON.parse(stored) as LocalCorpusData[]
        const converted = parsedCorpora.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          lastModified: new Date(c.createdAt),
          documentCount: 0,
          estimatedStorageBytes: 0,
          isActive: true,
          createdBy: 'user',
        }))
        setCorpora(converted)
        if (converted.length > 0 && !selectedCorpus) {
          selectCorpus(converted[0])
        }
      }
    } catch (err) {
      console.error('Error loading corpora:', err)
    }
  }

  useEffect(() => {
    loadCorpora()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectCorpus = async (corpus: FileSearchCorpus) => {
    setSelectedCorpus(corpus)
    setError(null)
    setDocuments([])
    setIsLoading(true)

    try {
      const docs = await listDocumentsInCorpus(corpus.googleFileSearchStoreId)
      setDocuments(docs)
    } catch (err) {
      setError(`Eroare la încărcarea documentelor: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCorpus = async () => {
    if (!newCorpusName.trim()) {
      setError('Introdu un nume pentru corpus')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newCorpus = await createFileSearchCorpus(newCorpusName)

      // Save to localStorage
      const updated = [...corpora, newCorpus]
      localStorage.setItem(
        CORPORA_STORAGE_KEY,
        JSON.stringify(
          updated.map((c) => ({
            id: c.id,
            googleFileSearchStoreId: c.googleFileSearchStoreId,
            displayName: c.displayName,
            createdAt: c.createdAt.toISOString(),
          }))
        )
      )

      setCorpora(updated)
      setSelectedCorpus(newCorpus)
      setNewCorpusName('')
      setShowCreateForm(false)
      setSuccess(`Corpus "${newCorpusName}" creat cu succes!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Eroare la crearea corpus-ului: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingFile(file)
      setError(null)
    }
  }

  const handleUploadDocument = async () => {
    if (!uploadingFile) {
      setError('Selectează un fișier')
      return
    }

    if (!selectedCorpus) {
      setError('Selectează un corpus')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const doc = await uploadDocumentToFileSearch(selectedCorpus.googleFileSearchStoreId, uploadingFile)

      // Reload documents list
      const updatedDocs = await listDocumentsInCorpus(selectedCorpus.googleFileSearchStoreId)
      setDocuments(updatedDocs)

      // Update corpus stats
      const stats = await getFileSearchCorpusStats(selectedCorpus.googleFileSearchStoreId)
      const updated = corpora.map((c) =>
        c.id === selectedCorpus.id ? { ...c, ...stats, documentCount: updatedDocs.length } : c
      )
      setCorpora(updated)
      setSelectedCorpus(updated.find((c) => c.id === selectedCorpus.id) || selectedCorpus)

      // Reset form
      setUploadingFile(null)
      setUploadSubject('')
      setUploadGrade('')
      setSuccess(`Document "${uploadingFile.name}" încărcat cu succes!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Eroare la încărcarea documentului: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    if (!selectedCorpus) return

    if (!confirm('Sigur vrei să ștergi acest document?')) return

    setIsLoading(true)
    setError(null)

    try {
      await deleteDocumentFromCorpus(selectedCorpus.googleFileSearchStoreId, documentId)

      // Reload documents
      const updatedDocs = await listDocumentsInCorpus(selectedCorpus.googleFileSearchStoreId)
      setDocuments(updatedDocs)

      // Update corpus stats
      const stats = await getFileSearchCorpusStats(selectedCorpus.googleFileSearchStoreId)
      const updated = corpora.map((c) =>
        c.id === selectedCorpus.id ? { ...c, ...stats, documentCount: updatedDocs.length } : c
      )
      setCorpora(updated)
      setSelectedCorpus(updated.find((c) => c.id === selectedCorpus.id) || selectedCorpus)

      setSuccess('Document șters cu succes!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Eroare la ștergerea documentului: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCorpus = async (corpus: FileSearchCorpus) => {
    if (!confirm(`Sigur vrei să ștergi corpus-ul "${corpus.displayName}" și toate documentele din el?`)) return

    setIsLoading(true)
    setError(null)

    try {
      await deleteFileSearchCorpus(corpus.googleFileSearchStoreId)

      // Remove from localStorage
      const updated = corpora.filter((c) => c.id !== corpus.id)
      localStorage.setItem(
        CORPORA_STORAGE_KEY,
        JSON.stringify(
          updated.map((c) => ({
            id: c.id,
            googleFileSearchStoreId: c.googleFileSearchStoreId,
            displayName: c.displayName,
            createdAt: c.createdAt.toISOString(),
          }))
        )
      )

      setCorpora(updated)
      if (selectedCorpus?.id === corpus.id) {
        setSelectedCorpus(updated[0] || null)
        setDocuments([])
      }

      setSuccess(`Corpus "${corpus.displayName}" șters cu succes!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Eroare la ștergerea corpus-ului: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Gestiune Corpus-uri (File Search)"
          description="Creează și gestionează corpus-uri de documente cu Gemini File Search API"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Documente' },
          ]}
        />

        <div className="px-8 py-8">
          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corpus List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Corpus-uri ({corpora.length}/10)</h3>
                </div>

                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {corpora.map((corpus) => (
                    <div
                      key={corpus.id}
                      className={`px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                        selectedCorpus?.id === corpus.id ? 'border-blue-600 bg-blue-50' : 'border-transparent'
                      }`}
                      onClick={() => selectCorpus(corpus)}
                    >
                      <p className="font-semibold text-sm text-gray-900">{corpus.displayName}</p>
                      <p className="text-xs text-gray-500">{corpus.documentCount || 0} documente</p>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-200">
                  {!showCreateForm ? (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Corpus Nou
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Biologie, Geografie, etc..."
                        value={newCorpusName}
                        onChange={(e) => setNewCorpusName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateCorpus}
                          disabled={isLoading || !newCorpusName.trim()}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                        >
                          {isLoading ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
                          Creează
                        </button>
                        <button
                          onClick={() => setShowCreateForm(false)}
                          disabled={isLoading}
                          className="flex-1 px-3 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {selectedCorpus && (
                  <div className="px-6 py-3 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteCorpus(selectedCorpus)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 disabled:bg-gray-100 text-red-600 font-medium rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Șterge Corpus
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Form & Document List */}
            <div className="lg:col-span-2">
              {selectedCorpus && (
                <>
                  {/* Upload Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Încarcă Document PDF</h3>

                    <div className="space-y-4">
                      {/* File Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fișier PDF</label>
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          {uploadingFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <p className="text-sm font-medium text-gray-900">{uploadingFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-8 h-8 text-gray-400" />
                              <p className="text-sm font-medium text-gray-700">Trage un PDF sau click aici</p>
                              <p className="text-xs text-gray-500">Maximum 100MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Button */}
                      <button
                        onClick={handleUploadDocument}
                        disabled={!uploadingFile || isLoading}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isLoading ? 'Se încarcă...' : 'Încarcă în Corpus'}
                      </button>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">
                        Documente ({documents.length}) {isLoading && <Loader className="w-4 h-4 animate-spin inline ml-2" />}
                      </h3>
                    </div>

                    {documents && documents.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {documents.map((doc) => (
                          <div key={doc.id} className="px-6 py-4 flex items-start justify-between hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 break-all">{doc.name}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Încărcat: {new Date(doc.uploadedAt).toLocaleString('ro-RO')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              disabled={isLoading}
                              className="ml-4 p-2 text-red-600 hover:bg-red-50 disabled:text-gray-400 rounded-lg transition-colors"
                              title="Șterge document"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          {isLoading ? 'Se încarcă documente...' : 'Nu există documente în acest corpus'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!selectedCorpus && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Creează un corpus pentru a în cepe</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-900 mb-2">ℹ️ Despre File Search</h4>
            <p className="text-blue-800 text-sm">
              Corpusurile pe care le creezi sunt persistente - poți reveni oricând să adaugi mai multe documente. Fiecare corpus
              poate conține până la miliarde de tokens de text. Limit: maxim 10 corpus-uri per proiect Google Cloud.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
