import StatCard from "./StatCard"
import { FloodData, mockData } from "../data/mockData"

export default function SidebarLeft({ data }: { data: FloodData | null }) {
  const displayData = data || mockData

  return (
    <div className="w-80 p-4 space-y-4 bg-[#0b1220] border-r border-gray-800 z-10 flex flex-col h-full transform transition-all duration-300">

      <h2 className="text-cyan-400 text-xl font-bold mb-4">
        Climate Risk
      </h2>

      {data ? (
        <div className="text-sm text-cyan-500/70 mb-2 truncate">
          {data.region}
        </div>
      ) : (
        <div className="text-sm text-gray-500 mb-2">
          Default Data (Select a location)
        </div>
      )}

      <StatCard title="Affected Area" value={`${displayData.flood_area} km²`} />
      <StatCard title="Population" value={displayData.population} />
      {displayData.change && <StatCard title="Change" value={displayData.change} />}
      <StatCard title="Risk Level" value={displayData.risk} danger={displayData.risk === "High"} />

    </div>
  )
}
