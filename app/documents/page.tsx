'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { Trash2, Upload, Plus, FileText } from 'lucide-react'
import { getCorpora, saveCorpus, removeDocumentFromCorpus, addDocumentToCorpus } from '@/services/storage'
import { SUBJECTS, GRADES, DOCUMENT_TYPES } from '@/lib/constants'
import type { Corpus } from '@/types'

export default function DocumentsPage() {
  const [corpora, setCorpora] = useState<Corpus[]>([])
  const [selectedCorpus, setSelectedCorpus] = useState<Corpus | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCorpusName, setNewCorpusName] = useState('')
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadSubject, setUploadSubject] = useState('')
  const [uploadGrade, setUploadGrade] = useState('')
  const [uploadType, setUploadType] = useState<'manual' | 'curriculum' | 'guide'>('manual')

  useEffect(() => {
    loadCorpora()
  }, [])

  const loadCorpora = () => {
    const stored = getCorpora()
    setCorpora(stored)
    if (stored.length > 0 && !selectedCorpus) {
      setSelectedCorpus(stored[0])
    }
  }

  const handleCreateCorpus = () => {
    if (!newCorpusName.trim()) {
      alert('Introdu un nume pentru corpus')
      return
    }

    const newCorpus: Corpus = {
      id: `corpus_${Date.now()}`,
      name: newCorpusName,
      displayName: newCorpusName,
      documents: [],
    }

    saveCorpus(newCorpus)
    setCorpora([...corpora, newCorpus])
    setSelectedCorpus(newCorpus)
    setNewCorpusName('')
    setShowCreateForm(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingFile(file)
    }
  }

  const handleUploadDocument = () => {
    if (!uploadingFile) {
      alert('Selectează un fișier')
      return
    }

    if (!uploadSubject || !uploadGrade) {
      alert('Selectează disciplina și clasa')
      return
    }

    if (!selectedCorpus) {
      alert('Selectează un corpus')
      return
    }

    const newDocument = {
      id: `doc_${Date.now()}`,
      name: uploadingFile.name,
      subject: uploadSubject,
      grade: parseInt(uploadGrade),
      type: uploadType,
      uploadedAt: new Date().toISOString(),
    }

    addDocumentToCorpus(selectedCorpus.id, newDocument)

    // Update local state
    const updatedCorpus = { ...selectedCorpus }
    updatedCorpus.documents.push(newDocument)
    setSelectedCorpus(updatedCorpus)

    // Reset form
    setUploadingFile(null)
    setUploadSubject('')
    setUploadGrade('')
    alert('Document încărcat cu succes!')
  }

  const handleRemoveDocument = (corpusId: string, documentId: string) => {
    if (confirm('Sigur vrei să ștergi acest document?')) {
      removeDocumentFromCorpus(corpusId, documentId)

      if (selectedCorpus?.id === corpusId) {
        const updated = {
          ...selectedCorpus,
          documents: selectedCorpus.documents.filter((d) => d.id !== documentId),
        }
        setSelectedCorpus(updated)
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header
          title="Gestiune Documente"
          description="Încarcă și organizează manuale și programe școlare"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Documente' },
          ]}
        />

        <div className="px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corpus List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Corpus-uri</h3>
                </div>

                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {corpora.map((corpus) => (
                    <button
                      key={corpus.id}
                      onClick={() => setSelectedCorpus(corpus)}
                      className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedCorpus?.id === corpus.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{corpus.displayName}</p>
                      <p className="text-xs text-gray-500">{corpus.documents?.length || 0} documente</p>
                    </button>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-200">
                  {!showCreateForm ? (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Corpus Nou
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nume corpus..."
                        value={newCorpusName}
                        onChange={(e) => setNewCorpusName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateCorpus}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Creează
                        </button>
                        <button
                          onClick={() => setShowCreateForm(false)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Form & Document List */}
            <div className="lg:col-span-2">
              {selectedCorpus && (
                <>
                  {/* Upload Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Încarcă Document</h3>

                    <div className="space-y-4">
                      {/* File Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fișier PDF
                        </label>
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                              <p className="text-xs text-gray-500">Maximum 50MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject Select */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Disciplina
                        </label>
                        <select
                          value={uploadSubject}
                          onChange={(e) => setUploadSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Selectează disciplina --</option>
                          {SUBJECTS.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Grade Select */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clasa
                        </label>
                        <select
                          value={uploadGrade}
                          onChange={(e) => setUploadGrade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Selectează clasa --</option>
                          {GRADES.map((grade) => (
                            <option key={grade.value} value={grade.value}>
                              {grade.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Document Type Select */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tip Document
                        </label>
                        <select
                          value={uploadType}
                          onChange={(e) => setUploadType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="manual">Manual</option>
                          <option value="curriculum">Programă școlară</option>
                          <option value="guide">Ghid metodologic</option>
                        </select>
                      </div>

                      {/* Upload Button */}
                      <button
                        onClick={handleUploadDocument}
                        disabled={!uploadingFile || !uploadSubject || !uploadGrade}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Încarcă în Corpus
                      </button>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">
                        Documente ({selectedCorpus.documents?.length || 0})
                      </h3>
                    </div>

                    {selectedCorpus.documents && selectedCorpus.documents.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {selectedCorpus.documents.map((doc) => (
                          <div key={doc.id} className="px-6 py-4 flex items-start justify-between hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 break-all">{doc.name}</p>
                              <div className="flex gap-3 mt-2">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {doc.subject}
                                </span>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                  Clasa {doc.grade}
                                </span>
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                  {DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES]}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(doc.uploadedAt).toLocaleString('ro-RO')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveDocument(selectedCorpus.id, doc.id)}
                              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        <p className="text-gray-600">Nu există documente în acest corpus</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
