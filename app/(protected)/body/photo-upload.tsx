"use client"

import { useRef, useState } from "react"
import { Camera, Image as ImageIcon } from "lucide-react"

export default function PhotoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Per ora mostriamo solo la preview locale, non la carichiamo nel server
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
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
    <section className="bg-[#111118] rounded-2xl p-6 border border-white/5 text-center relative overflow-hidden">
      <h3 className="font-medium text-[#f1f5f9] mb-4">Foto Progresso</h3>
      
      {photoPreview ? (
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-4 border border-white/10">
          <img src={photoPreview} alt="Progresso" className="w-full h-full object-cover" />
          <button 
            onClick={() => setPhotoPreview(null)}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-md backdrop-blur-md text-xs hover:bg-red-500 transition-colors"
          >
            Rimuovi
          </button>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] mx-auto mb-4 border border-[#3b82f6]/20">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
        >
          <Camera className="w-4 h-4" /> Fotocamera
        </button>
        <button 
          type="button" 
          onClick={triggerGallery}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a0a0f] hover:bg-white/5 border border-white/10 text-[#f1f5f9] rounded-lg text-sm font-medium transition-all"
        >
          <ImageIcon className="w-4 h-4" /> Galleria
        </button>
      </div>
      <p className="text-[10px] text-[#64748b] mt-3">Scegli Fotocamera per un accesso diretto, o carica dalla tua memoria.</p>
    </section>
  )
}