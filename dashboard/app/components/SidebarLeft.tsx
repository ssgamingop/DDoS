import StatCard from "./StatCard"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarLeft({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  return (
    <div className="w-[280px] flex-shrink-0 p-4 space-y-4 bg-[#040814]/60 backdrop-blur-xl border-r border-[#1e293b]/50 z-20 flex flex-col h-full shadow-[5px_0_30px_rgba(0,0,0,0.5)]">

      <div>
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-xl font-extrabold tracking-tight mb-1">
          Climate Intelligence
        </h2>
        <div className="h-1 w-10 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mb-2" />
      </div>

      {data ? (
        <div className="p-3 rounded-lg bg-[#0f172a]/80 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.05)] mb-2 overflow-hidden">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-medium">Selected Sector</div>
          <div className="text-sm text-cyan-400 font-semibold truncate flex items-center gap-2">
            <span className="w-2 h-2 flex-shrink-0 rounded-full bg-cyan-400 animate-pulse" />
            <span className="truncate">{data.region}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#0f172a]/50 border border-gray-800 border-dashed mb-2 flex items-center justify-center">
          <div className="text-sm text-gray-500 italic">
            Awaiting Selection...
          </div>
        </div>
      )}

      <div className="space-y-3 flex-1">
        <StatCard title="Affected Area" value={`${displayData.flood_area} km²`} />
        {displayData.change && <StatCard title="Change" value={displayData.change} />}
        <StatCard title="Population at Risk" value={displayData.population} />

        {/* Elevation Extracted from GEE API */}
        <StatCard title="Terrain Elevation" value={displayData.elevation_m !== undefined ? `~${Math.round(displayData.elevation_m)}m` : "~45m (Safe)"} />

        <StatCard title="Risk Level" value={displayData.risk} danger={displayData.risk === "High"} />
      </div>

      <div className="mt-auto pt-4 border-t border-[#1e293b]/50">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="uppercase tracking-widest font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live Telemetry
          </span>
          <span className="font-mono text-cyan-700">ONLINE</span>
        </div>
        <div className="bg-[#0f172a]/40 rounded-lg p-3 border border-[#1e293b]/50 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Sensor Engine:</span>
            <span className="text-cyan-400 font-mono">Sentinel-2 SR</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Resolution:</span>
            <span className="text-cyan-400 font-mono">10m / pixel</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Cloud Threshold:</span>
            <span className="text-cyan-400 font-mono">&lt; 80%</span>
          </div>
        </div>
      </div>

    </div>
  )
}
