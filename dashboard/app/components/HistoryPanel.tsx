import { useEffect, useState } from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"

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

    const [isOpen, setIsOpen] = useState(false)

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
        <div className="absolute bottom-6 left-[300px] z-40 bg-[#040814]/70 backdrop-blur border border-cyan-500/20 rounded-xl shadow-xl w-[320px] overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#0f172a]/90 px-3 py-3 border-b border-cyan-500/10 flex items-center justify-between hover:bg-[#1e293b]/90 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-cyan-500" />
                    <h3 className="text-cyan-400 font-bold text-xs tracking-widest uppercase">
                        Audit State Log
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </div>
            </button>

            {isOpen && (
                <div className="p-2 max-h-[250px] overflow-y-auto no-scrollbar bg-[#0b1220]/80">
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
                                    <div key={index} className="bg-black/40 rounded px-2 py-1.5 border border-white/5 hover:border-cyan-500/30 transition-colors flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500">{timeStr}</span>
                                            <span className="text-[11px] text-gray-300">
                                                [{record.lat.toFixed(2)}, {record.lng.toFixed(2)}]
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[11px] font-bold ${riskColor}`}>{record.risk_level}</span>
                                            <span className="text-[9px] text-gray-400">+{record.water_expansion_km2.toFixed(1)} km²</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
