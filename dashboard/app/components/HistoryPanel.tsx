import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

type HistoryRecord = {
    timestamp: string;
    lat: number;
    lng: number;
    risk_level: string;
    water_expansion_km2: number;
}

export default function HistoryPanel() {
    const [history, setHistory] = useState<HistoryRecord[]>([])
    const [loading, setLoading] = useState(true)

    // Poll the backend history every 5 seconds
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/history")
                const data = await res.json()
                setHistory(data)
                setLoading(false)
            } catch (error) {
                console.error("Failed to fetch history:", error)
            }
        }

        fetchHistory()
        const interval = setInterval(fetchHistory, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="absolute top-4 left-4 z-40 bg-[#040814]/70 backdrop-blur border border-cyan-500/20 rounded-xl shadow-xl w-[350px] overflow-hidden">
            <div className="bg-[#0f172a]/90 px-4 py-3 border-b border-cyan-500/10 flex items-center justify-between">
                <h3 className="text-cyan-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                    <Clock size={16} /> Audit State Log
                </h3>
                <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
            </div>

            <div className="p-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="text-gray-500 text-xs italic p-4 text-center">Loading state table...</div>
                ) : history.length === 0 ? (
                    <div className="text-gray-500 text-xs italic p-4 text-center">No calculations on record.</div>
                ) : (
                    <div className="space-y-2">
                        {history.map((record, index) => {
                            const date = new Date(record.timestamp)
                            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

                            let riskColor = "text-green-400"
                            if (record.risk_level === "HIGH") riskColor = "text-red-400"
                            if (record.risk_level === "MODERATE") riskColor = "text-orange-400"

                            return (
                                <div key={index} className="bg-black/40 rounded px-3 py-2 border border-white/5 hover:border-cyan-500/30 transition-colors flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500">{timeStr}</span>
                                        <span className="text-xs text-gray-300">
                                            [{record.lat.toFixed(2)}, {record.lng.toFixed(2)}]
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-bold ${riskColor}`}>{record.risk_level}</span>
                                        <span className="text-[10px] text-gray-400">+{record.water_expansion_km2.toFixed(1)} km²</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
