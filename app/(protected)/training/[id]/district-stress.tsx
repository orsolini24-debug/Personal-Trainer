"use client"

import { useState } from "react"
import { updateDistrictStress } from "@/app/actions/training"
import { DistrictStress, District } from "@prisma/client"

const DISTRICTS = Object.values(District)

export default function DistrictStressForm({ sessionId, initialStress }: { sessionId: string, initialStress: DistrictStress[] }) {
  const [stress, setStress] = useState<Record<string, number>>(() => {
    const acc: Record<string, number> = {}
    initialStress.forEach(s => { acc[s.district] = s.intensity })
    return acc
  })

  const handleChange = async (district: District, val: number) => {
    const newVal = val === stress[district] ? 0 : val // Toggle off se cliccato lo stesso
    setStress(prev => ({ ...prev, [district]: newVal }))
    await updateDistrictStress(sessionId, district, newVal)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
      {DISTRICTS.map((d) => (
        <div key={d} className="flex items-center justify-between">
          <span className="text-sm font-medium">{d}</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(level => (
              <button
                key={level}
                onClick={() => handleChange(d, level)}
                className={`w-8 h-8 rounded-md text-xs font-semibold transition-colors ${
                  (stress[d] || 0) === level
                    ? level === 0 ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' 
                    : level === 1 ? 'bg-green-500 text-white'
                    : level === 2 ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="col-span-full mt-4 flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-sm"></div> 0 (Nullo)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> 1 (Lieve)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> 2 (Medio)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> 3 (Alto)</span>
      </div>
    </div>
  )
}