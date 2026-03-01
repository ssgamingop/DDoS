"use client"
import { FloodData } from "../data/types"

export default function LeftPanel({
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

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case "high": return "text-[var(--risk-high)]"
            case "medium": case "moderate": return "text-[var(--risk-moderate)]"
            default: return "text-[var(--risk-low)]"
        }
    }

    const valueOrDash = (value: string) => (hasLiveSelection ? value : "--")

    return (
        <div className="w-full max-w-[340px] glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-cyan-400 text-base font-semibold tracking-wide">Climate Int.</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="space-y-0.5">
                <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold">Selected Sector</p>
                <p className="text-[13px] text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {hasSelection && selectedLocation
                        ? `Lat ${selectedLocation.lat.toFixed(4)}, Lng ${selectedLocation.lng.toFixed(4)}`
                        : "No location selected"}
                </p>
                {!hasLiveSelection && !analysisError && (
                    <p className="text-[11px] text-gray-400">Select location and run scan for calculated output.</p>
                )}
            </div>

            <div className="border-t border-cyan-500/20 pt-3 space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-200">Affected Area</span>
                    <span className="text-white font-medium">{valueOrDash(`${data?.flood_area.toFixed(3)} km²`)}</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-200">Change</span>
                    <span className="text-cyan-400 font-medium">{valueOrDash(data?.change || "0%")}</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-200">Pop. at Risk</span>
                    <span className="text-white font-medium">{valueOrDash((data?.population || 0).toLocaleString())}</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-200">Elevation</span>
                    <span className="text-white font-medium">{valueOrDash(`~${Math.round(data?.elevation_m || 0)} m`)}</span>
                </div>

                <div className="pt-2">
                    <p className="text-[10px] text-gray-200 mb-0.5 uppercase">Risk Level</p>
                    {hasLiveSelection ? (
                        <p className={`text-xl font-bold tracking-wider uppercase ${getRiskColor(data?.risk || "low")}`}>
                            {data?.risk}
                        </p>
                    ) : (
                        <p className="text-xl font-bold tracking-wider uppercase text-gray-500">--</p>
                    )}
                </div>
            </div>

            {/* WHY PANEL (Risk Drivers) */}
            <div className="border-t border-cyan-500/20 pt-3 space-y-2">
                <p className="text-[10px] text-gray-200 mb-1 uppercase tracking-widest font-semibold flex items-center justify-between">
                    Risk Drivers
                    <span className="text-cyan-400 font-normal normal-case text-[9px] border border-cyan-500/30 px-1 py-0.5 rounded">AI Analysis</span>
                </p>
                <ul className="text-[11px] text-gray-300 space-y-1.5 pl-3 list-disc marker:text-cyan-500">
                    {hasLiveSelection && data?.reasons && data.reasons.length > 0 ? (
                        data.reasons.slice(0, 4).map((reason, idx) => (
                            <li key={`${idx}-${reason}`}>{reason}</li>
                        ))
                    ) : (
                        <li>Run analysis to view calculated risk drivers from satellite data.</li>
                    )}
                </ul>
            </div>

            {/* DATA SOURCE PANEL */}
            <div className="border border-cyan-500/20 bg-black/40 p-2.5 rounded-lg space-y-1 mt-2">
                <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold mb-1">Data Source</p>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Satellite:</span>
                    <span className="text-cyan-300 font-mono">Sentinel-2 / Landsat</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Method:</span>
                    <span className="text-white">MNDWI + DEM + Pop</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Resolution:</span>
                    <span className="text-white">30m/pixel</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Last updated:</span>
                    <span className={`${hasLiveSelection ? "text-green-400" : "text-gray-400"} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasLiveSelection ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
                        {hasLiveSelection ? "calculated" : "awaiting scan"}
                    </span>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 text-[9px] text-cyan-100/85 rounded-md mt-2 leading-tight flex gap-2 items-start opacity-90">
                <span className="text-cyan-300 mt-0.5">i</span>
                <p>Dashboard shows only backend-calculated results. No synthetic fallback values are displayed.</p>
            </div>
        </div>
    )
}
