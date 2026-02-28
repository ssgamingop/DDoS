import AlertPanel from "./AlertPanel"
import TrendChart from "./TrendChart"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarRight({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  return (
    <div className="w-[350px] flex-shrink-0 p-6 space-y-6 bg-[#040814]/60 backdrop-blur-xl border-l border-[#1e293b]/50 z-20 flex flex-col h-full shadow-[-5px_0_30px_rgba(0,0,0,0.5)]">

      <div>
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl font-extrabold tracking-tight mb-1">
          Predictive Risk
        </h2>
        <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mb-4" />
      </div>

      <AlertPanel risk={displayData.risk} />

      <div className="bg-gradient-to-b from-[#0f172a]/80 to-[#040814]/80 p-5 rounded-xl border border-cyan-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex-1 relative overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Flood Trend Analysis</p>
          <div className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/20">LIVE</div>
        </div>
        <div className="flex-1 -ml-4">
          <TrendChart trendData={displayData.trend || mockData.trend} />
        </div>
      </div>

    </div>
  )
}
