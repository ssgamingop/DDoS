import StatCard from "./StatCard"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarLeft({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  return (
    <div className="w-[350px] flex-shrink-0 p-6 space-y-6 bg-[#040814]/60 backdrop-blur-xl border-r border-[#1e293b]/50 z-20 flex flex-col h-full shadow-[5px_0_30px_rgba(0,0,0,0.5)]">

      <div>
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl font-extrabold tracking-tight mb-1">
          Climate Intelligence
        </h2>
        <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mb-4" />
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
        <StatCard title="Population" value={displayData.population} />
        {displayData.change && <StatCard title="Change" value={displayData.change} />}
        <StatCard title="Risk Level" value={displayData.risk} danger={displayData.risk === "High"} />
      </div>

    </div>
  )
}
