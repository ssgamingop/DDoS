import { mockData } from "../data/mockData"

export default function AlertPanel({ risk }: { risk: string }) {
  if (risk !== "High") return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-950/80 to-red-900/40 border border-red-500/50 p-5 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center gap-4 animate-pulse group">
      {/* Warning Icon Container */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
        <span className="text-red-400 font-bold text-xl leading-none">⚠</span>
      </div>

      <div className="flex flex-col">
        <span className="text-red-400 font-bold uppercase tracking-wider text-sm">Critical Alert</span>
        <span className="text-red-200 text-sm opacity-90">High Flood Risk Detected</span>
      </div>

      {/* Animated scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent -translate-y-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
    </div>
  )
}
