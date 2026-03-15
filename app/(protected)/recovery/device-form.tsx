"use client"

import { useState } from "react"
import { saveUserDevice } from "@/app/actions/recovery"
import { Ecosystem } from "@prisma/client"
import { useRouter } from "next/navigation"

export default function DeviceForm({ devices }: { devices: any[] }) {
  const router = useRouter()
  const primaryDevice = devices.find(d => d.isPrimary) || devices[0]
  
  const [ecosystem, setEcosystem] = useState<Ecosystem>(primaryDevice?.ecosystem || Ecosystem.SUUNTO)
  const [deviceModel, setDeviceModel] = useState(primaryDevice?.deviceModel || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await saveUserDevice({
      ecosystem,
      deviceModel,
      isPrimary: true
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Il mio Device</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ecosistema</label>
          <select 
            value={ecosystem} 
            onChange={e=>setEcosystem(e.target.value as Ecosystem)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
          >
            {Object.values(Ecosystem).map(eco => (
              <option key={eco} value={eco}>{eco.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modello (opzionale)</label>
          <input 
            type="text" 
            value={deviceModel} 
            onChange={e=>setDeviceModel(e.target.value)}
            placeholder="es. Suunto Race"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50">
          {loading ? "Salvataggio..." : "Salva Device"}
        </button>
      </form>
    </div>
  )
}