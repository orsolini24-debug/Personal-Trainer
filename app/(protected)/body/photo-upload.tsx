"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, Image as ImageIcon } from "lucide-react"

export default function PhotoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Cleanup object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Revoke previous URL before creating a new one
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      setPhotoPreview(url)
    }
  }

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPhotoPreview(null)
  }

  const triggerCamera = () => {
    if (fileInputRef.current) {
      // Imposta "capture" environment prima di scattare
      fileInputRef.current.removeAttribute("capture")
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }

  const triggerGallery = () => {
    if (fileInputRef.current) {
      // Rimuove l'attributo capture per aprire la galleria
      fileInputRef.current.removeAttribute("capture")
      fileInputRef.current.click()
    }
  }

  return (
    <section
      className="rounded-2xl p-6 text-center relative overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
    >
      <h3 className="font-medium mb-4" style={{ color: 'var(--fg-primary)' }}>Foto Progresso</h3>

      {photoPreview ? (
        <div
          className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-4"
          style={{ border: '1px solid var(--border-default)' }}
        >
          <img src={photoPreview} alt="Progresso" className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-md backdrop-blur-md text-xs transition-colors"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--fg-primary)' }}
          >
            Rimuovi
          </button>
        </div>
      ) : (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
          }}
        >
          <Camera className="w-6 h-6" />
        </div>
      )}

      {/* Input nascosto per file */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={triggerCamera}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all btn-primary"
        >
          <Camera className="w-4 h-4" /> Fotocamera
        </button>
        <button
          type="button"
          onClick={triggerGallery}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all btn-ghost"
        >
          <ImageIcon className="w-4 h-4" /> Galleria
        </button>
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'var(--fg-muted)' }}>Scegli Fotocamera per un accesso diretto, o carica dalla tua memoria.</p>
    </section>
  )
}