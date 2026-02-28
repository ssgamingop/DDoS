import AlertPanel from "./AlertPanel"
import TrendChart from "./TrendChart"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarRight({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  return (
    <div className="w-80 p-4 space-y-4 bg-[#0b1220] border-l border-gray-800 z-10 flex flex-col h-full transform transition-all duration-300">

      <h2 className="text-cyan-400 text-xl font-bold mb-4">
        Analytics
      </h2>

      <AlertPanel risk={displayData.risk} />

      <div className="bg-[#0b1220] p-4 rounded-xl border border-gray-800 flex-1 relative overflow-hidden">
        <p className="text-gray-400 mb-2">Flood Trend</p>
        <TrendChart trendData={displayData.trend || mockData.trend} />
      </div>

    </div>
  )
}
