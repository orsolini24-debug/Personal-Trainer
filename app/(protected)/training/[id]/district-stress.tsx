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
          <span className="text-sm font-medium text-primary">{d}</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(level => (
              <button
                key={level}
                onClick={() => handleChange(d, level)}
                className={`w-8 h-8 rounded-md text-xs font-semibold transition-colors ${
                  (stress[d] || 0) === level
                    ? level === 0 ? 'bg-elevated text-primary'
                    : level === 1 ? 'bg-positive text-white'
                    : level === 2 ? 'bg-warning text-white'
                    : 'bg-negative text-white'
                    : 'bg-base text-muted hover:bg-elevated hover:text-primary'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="col-span-full mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-elevated rounded-sm border border-border"></div> 0 (Nullo)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-positive rounded-sm"></div> 1 (Lieve)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-warning rounded-sm"></div> 2 (Medio)</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-negative rounded-sm"></div> 3 (Alto)</span>
      </div>
    </div>
  )
}
