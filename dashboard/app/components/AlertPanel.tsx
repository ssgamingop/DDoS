import { mockData } from "../data/mockData"

export default function AlertPanel({ risk, reasons, confidence }: { risk: string, reasons?: string[], confidence?: number }) {
  if (risk !== "High" && risk !== "Moderate") return null

  const isHigh = risk === "High"
  const colorName = isHigh ? "red" : "orange"
  const bgColor = isHigh ? "from-red-950/80 to-red-900/40" : "from-orange-950/80 to-orange-900/40"
  const borderColor = isHigh ? "border-red-500/50" : "border-orange-500/50"
  const textColor = isHigh ? "text-red-400" : "text-orange-400"

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgColor} border ${borderColor} p-5 rounded-xl shadow-lg flex flex-col gap-3 group`}>
      <div className="flex items-center gap-4">
        {/* Warning Icon Container */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${isHigh ? 'bg-red-500/20' : 'bg-orange-500/20'} flex items-center justify-center border ${borderColor} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
          <span className={`${textColor} font-bold text-xl leading-none`}>⚠</span>
        </div>

        <div className="flex flex-col">
          <span className={`${textColor} font-bold uppercase tracking-wider text-sm`}>
            {isHigh ? "Critical Alert" : "Elevated Risk"}
          </span>
          <span className={`${isHigh ? 'text-red-200' : 'text-orange-200'} text-sm opacity-90`}>
            {risk} Flood Risk Detected
          </span>
          <span className={`${textColor} text-xs mt-1 opacity-75 font-mono`}>
            Confidence: {confidence ? `${confidence}%` : "92%"}
          </span>
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="mt-2 text-xs text-gray-300 space-y-1 bg-black/30 p-3 rounded-lg border border-white/10">
          <strong className={textColor}>AI Insights:</strong>
          <ul className="list-disc pl-4 mt-1 opacity-90 leading-tight">
            {reasons.map((reason, idx) => (
              <li key={idx} className="mb-1">{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
