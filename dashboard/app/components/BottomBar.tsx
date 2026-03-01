"use client"
import { MapPin } from "lucide-react"

export default function BottomBar({ analyzing, selectedLocation, onScan }: { analyzing: boolean, selectedLocation: { lat: number, lng: number } | null, onScan: () => void }) {
    return (
        <>
            {/* Scan Button */}
            <div className={`absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${selectedLocation && !analyzing ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"}`}>
                <button
                    onClick={onScan}
                    disabled={!selectedLocation || analyzing}
                    className="px-6 py-2.5 md:px-8 md:py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <MapPin size={20} className="animate-bounce text-black" />
                    START SCANNING
                </button>
            </div>

            {/* Logs Overlay Screen */}
            {analyzing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[2px] transition-opacity duration-300">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-6 shadow-lg shadow-black/40" />
                    <div className="text-cyan-400 text-base tracking-widest uppercase font-bold font-mono animate-pulse">
                        Fetching satellite data...
                    </div>
                    <div className="text-sm text-cyan-300/70 mt-3 font-mono">
                        Running detection model...
                    </div>
                    <div className="text-xs text-gray-200 mt-2 font-mono">
                        Generating insights...
                    </div>
                </div>
            )}
        </>
    )
}
