"use client"

import { format } from "date-fns"

export default function BodyHistory({ history }: { history: any[] }) {
  if (!history || history.length === 0) return <p className="text-zinc-500 text-sm">Nessun dato storico.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Peso</th>
            <th className="px-4 py-2">BF %</th>
            <th className="px-4 py-2">Vita</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log) => (
            <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <td className="px-4 py-2 font-medium">{format(new Date(log.date), "dd/MM")}</td>
              <td className="px-4 py-2 font-semibold">{log.weightKg ? `${log.weightKg} kg` : '-'}</td>
              <td className="px-4 py-2">{log.fatPct ? `${log.fatPct}%` : '-'}</td>
              <td className="px-4 py-2">{log.waistCm ? `${log.waistCm} cm` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}