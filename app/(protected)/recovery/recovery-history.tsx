"use client"

import { format } from "date-fns"

export default function RecoveryHistory({ history }: { history: any[] }) {
  if (!history || history.length === 0) return <p className="text-zinc-500 text-sm">Nessun dato storico.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Score</th>
            <th className="px-4 py-2">HRV</th>
            <th className="px-4 py-2">RHR</th>
            <th className="px-4 py-2">TSB</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log) => {
            const isGoodScore = log.recoveryScore && log.recoveryScore >= 70
            const isBadScore = log.recoveryScore && log.recoveryScore < 40
            const isGoodTsb = log.tsb && log.tsb > -10
            const isBadTsb = log.tsb && log.tsb < -30

            return (
              <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <td className="px-4 py-2 font-medium">{format(new Date(log.date), "dd/MM")}</td>
                <td className={`px-4 py-2 font-semibold ${isGoodScore ? 'text-green-500' : (isBadScore ? 'text-red-500' : 'text-yellow-500')}`}>
                  {log.recoveryScore || '-'}
                </td>
                <td className="px-4 py-2">{log.hrv || '-'}</td>
                <td className="px-4 py-2">{log.rhr || '-'}</td>
                <td className={`px-4 py-2 ${isGoodTsb ? 'text-green-500' : (isBadTsb ? 'text-red-500' : 'text-yellow-500')}`}>
                  {log.tsb || '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}