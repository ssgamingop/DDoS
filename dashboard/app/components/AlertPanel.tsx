import { mockData } from "../data/mockData"

export default function AlertPanel({ risk }: { risk: string }) {
  if (risk !== "High") return null

  return (
    <div className="bg-red-950/40 border border-red-500 p-5 rounded-xl text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center gap-3 animate-pulse">
      <span className="text-xl">⚠</span> High Flood Risk Detected
    </div>
  )
}
