'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Tesseract from 'tesseract.js'

export default function RibOcrUpload({ onRibExtracted }) {
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const extractRibFromText = (text) => {
    // Nettoyer le texte: enlever espaces, tirets, etc.
    const cleanText = text.replace(/[\s\-_]/g, '')
    
    // Chercher une séquence de 20 chiffres consécutifs
    const ribPattern = /\d{20}/g
    const matches = cleanText.match(ribPattern)
    
    if (matches && matches.length > 0) {
      return matches[0]
    }
    
    // Chercher des patterns alternatifs (avec espaces/tirets)
    const ribPatternAlt = /(\d[\s\-_]?){20}/g
    const matchesAlt = text.match(ribPatternAlt)
    
    if (matchesAlt && matchesAlt.length > 0) {
      const cleaned = matchesAlt[0].replace(/[\s\-_]/g, '')
      if (cleaned.length === 20 && /^\d+$/.test(cleaned)) {
        return cleaned
      }
    }
    
    return null
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setStatus('error')
      setMessage('Veuillez sélectionner une image valide')
      setTimeout(() => setStatus(null), 3000)
      return
    }

    setProcessing(true)
    setStatus(null)
    setMessage('Analyse de l\'image en cours...')

    try {
      const result = await Tesseract.recognize(file, 'fra', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            setMessage(`Extraction du texte... ${progress}%`)
          }
        },
      })

      const extractedText = result.data.text
      const rib = extractRibFromText(extractedText)

      if (rib) {
        setStatus('success')
        setMessage(`RIB extrait: ${rib}`)
        onRibExtracted(rib)
        setTimeout(() => setStatus(null), 3000)
      } else {
        setStatus('error')
        setMessage('Aucun RIB valide (20 chiffres) trouvé dans l\'image')
        setTimeout(() => setStatus(null), 4000)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      setStatus('error')
      setMessage('Erreur lors de l\'analyse de l\'image')
      setTimeout(() => setStatus(null), 3000)
    } finally {
      setProcessing(false)
      // Reset input pour permettre le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            processing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Scanner RIB
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {status && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            status === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {processing && (
        <div className="text-xs text-gray-500 italic">{message}</div>
      )}
    </div>
  )
}
