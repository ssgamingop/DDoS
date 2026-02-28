import AlertPanel from "./AlertPanel"
import TrendChart from "./TrendChart"
import { Building2, TrainFront, PlugZap } from "lucide-react"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarRight({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  // Calculate realistic infrastructure metrics based on Exact Built-up Area flooded
  const builtupVolume = displayData.exposed_builtup_km2 || ((displayData.flood_area || 10) * 0.05);

  // Roads: A standard urban grid has roughly 20km of road per km2 of pure built-up area.
  const roadsRisk = (builtupVolume * 20).toFixed(1)
  // Buildings: Usually 400 structures per km2 of pure built-up area
  const buildingsRisk = Math.floor(builtupVolume * 400)
  // Power grids: Usually 2 major substations per km2
  const powerGridsRisk = Math.max(1, Math.ceil(builtupVolume * 2))
  // Cost: Severe flooding causes massive damage, $250M per km2 of built-up land.
  const estCost = (builtupVolume * 250).toFixed(1)

  return (
    <div className="w-[280px] flex-shrink-0 p-4 space-y-4 bg-[#040814]/60 backdrop-blur-xl border-l border-[#1e293b]/50 z-20 flex flex-col h-full shadow-[-5px_0_30px_rgba(0,0,0,0.5)]">

      <div>
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-xl font-extrabold tracking-tight mb-1">
          Predictive Risk
        </h2>
        <div className="h-1 w-10 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mb-2" />
      </div>

      <AlertPanel risk={displayData.risk} reasons={displayData.reasons} confidence={displayData.confidence} />

      <div className="bg-gradient-to-b from-[#0f172a]/80 to-[#040814]/80 p-4 rounded-xl border border-cyan-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Flood Trend Analysis</p>
          <div className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/20">LIVE</div>
        </div>
        <div className="-ml-4">
          <TrendChart trendData={displayData.trend || mockData.trend} />
        </div>
      </div>

      <div className="bg-[#0f172a]/60 p-4 rounded-xl border border-gray-800/80 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Infrastructure Exposure</p>
          <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/50">EST: ${estCost}M</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <TrainFront size={16} className="text-cyan-500" /> Transit & Roads
            </div>
            <span className="font-mono text-cyan-300 text-sm">{roadsRisk} km</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Building2 size={16} className="text-orange-400" /> Commercial Bldgs
            </div>
            <span className="font-mono text-orange-300 text-sm">~{buildingsRisk}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <PlugZap size={16} className="text-yellow-400" /> Power Grids
            </div>
            <span className="font-mono text-yellow-300 text-sm">{powerGridsRisk} at risk</span>
          </div>
        </div>
      </div>

    </div>
  )
}
