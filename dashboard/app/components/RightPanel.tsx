"use client"

import { FloodData } from "../data/types"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts"

const chartCardClass = "rounded-lg border border-cyan-500/20 bg-black/35 p-2.5"

function clampTo100(value: number) {
    return Math.max(0, Math.min(100, value))
}

export default function RightPanel({
    data,
    selectedLocation,
    analysisError,
}: {
    data: FloodData | null
    selectedLocation: { lat: number, lng: number } | null
    analysisError: string | null
}) {
    const hasLiveSelection = Boolean(data)
    const hasSelection = Boolean(selectedLocation)
    const statusLabel = hasLiveSelection ? "LIVE" : analysisError ? "ERROR" : "IDLE"
    const statusClass = hasLiveSelection
        ? "border-cyan-400/40 text-cyan-300"
        : analysisError
            ? "border-rose-400/40 text-rose-200"
            : "border-gray-500/40 text-gray-400"

    const trendData = (data?.trend || []).map((point) => ({
        label: point.day,
        water: Number(point.flood) || 0,
    }))

    const baseline = trendData[0]?.water || 0
    const latest = trendData[trendData.length - 1]?.water || data?.flood_area || 0
    const expansionPct = baseline > 0 ? ((latest - baseline) / baseline) * 100 : (latest > 0 ? 100 : 0)

    const elevation = data?.elevation_m || 0
    const builtup = data?.exposed_builtup_km2 || 0
    const population = data?.population || 0

    const exposureData = [
        { name: "Flood", value: Number((data?.flood_area || 0).toFixed(2)) },
        { name: "Built-up", value: Number(builtup.toFixed(2)) },
        { name: "Population (K)", value: Number((population / 1000).toFixed(1)) },
    ]

    const driverData = [
        { metric: "Expansion", value: clampTo100(expansionPct) },
        { metric: "Low Terrain", value: clampTo100(100 - elevation * 2) },
        { metric: "Population", value: clampTo100(population / 5000) },
        { metric: "Built-up", value: clampTo100(builtup * 120) },
        { metric: "Water Load", value: clampTo100(latest * 2) },
    ]

    return (
        <div className="w-full max-w-[410px] glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-cyan-400 text-base font-semibold tracking-wide">Predictive Risk</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass}`}>
                    {statusLabel}
                </span>
            </div>

            {hasLiveSelection && data?.risk?.toLowerCase() === "high" && (
                <div className="bg-red-500/12 border border-red-500/35 p-2.5 rounded-md flex gap-2 items-center">
                    <div className="text-red-400 text-lg">!</div>
                    <div>
                        <div className="text-red-400 font-bold text-[11px] tracking-widest">CRITICAL ALERT</div>
                        <p className="text-[10px] text-red-200/80 mt-0.5 leading-tight">High expansion detected over vulnerable terrain.</p>
                    </div>
                </div>
            )}

            {!hasLiveSelection ? (
                <div className="rounded-lg border border-cyan-500/20 bg-black/35 p-4 text-sm text-gray-300 space-y-2">
                    <p className="text-cyan-300 font-medium">No calculated analytics yet.</p>
                    <p>
                        {analysisError
                            ? `Last analysis failed: ${analysisError}`
                            : hasSelection
                                ? "Press START SCANNING to fetch satellite-calculated results."
                                : "Select a map location and press START SCANNING."}
                    </p>
                </div>
            ) : (
                <>
                    <div className={chartCardClass}>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold">Water Trend</p>
                            <span className="text-[10px] text-cyan-300">Derived from backend output</span>
                        </div>
                        <div className="h-36 xl:h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        formatter={(value) => [Number(value ?? 0).toFixed(4), "Water km²"]}
                                        contentStyle={{
                                            backgroundColor: "rgba(3,7,18,0.95)",
                                            border: "1px solid rgba(34,211,238,0.3)",
                                            borderRadius: "8px",
                                            color: "#e2e8f0",
                                        }}
                                    />
                                    <Area type="monotone" dataKey="water" stroke="#22d3ee" strokeWidth={2.5} fill="url(#waterFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className={chartCardClass}>
                            <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold mb-1.5">Risk Drivers</p>
                            <div className="h-36 xl:h-44 relative -mx-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={driverData} outerRadius="60%" cx="50%" cy="50%">
                                        <PolarGrid stroke="rgba(148,163,184,0.25)" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 9 }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={chartCardClass}>
                            <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold mb-1.5">Exposure</p>
                            <div className="h-36 xl:h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={exposureData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={0} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(3,7,18,0.95)",
                                                border: "1px solid rgba(34,211,238,0.3)",
                                                borderRadius: "8px",
                                                color: "#e2e8f0",
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#06b6d4" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
