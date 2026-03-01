"use client"

import { Search, MapPin } from "lucide-react"
import type { FormEvent } from "react"

export default function TopBar({ onSearch, onSelectLocation }: { onSearch: (val: string) => void, onSelectLocation: (loc: { lat: number, lng: number }) => void }) {
    const locations = [
        { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
        { name: "Delhi", lat: 28.7041, lng: 77.1025 },
        { name: "Chennai", lat: 13.0827, lng: 80.2707 },
        { name: "Bihar", lat: 25.0961, lng: 85.3131 },
    ]

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const val = formData.get("search") as string
        if (val) onSearch(val)
    }

    return (
        <div className="pointer-events-none">
            <div className="glass-panel px-3 py-2.5 md:px-4 md:py-3 flex items-center gap-3 pointer-events-auto">
                <div className="hidden sm:flex items-center gap-2 text-white font-semibold whitespace-nowrap text-[15px] min-w-[170px]">
                    <span>🌍</span>
                    <span>DDos Dashboard</span>
                </div>

                <form onSubmit={handleSubmit} className="relative flex-1 w-full max-w-3xl mx-auto">
                    <input
                        name="search"
                        placeholder="Search any location..."
                        className="w-full px-9 py-2 rounded-full bg-black/35 border border-cyan-500/25 text-white text-[13px] outline-none placeholder-gray-300/80 focus:border-cyan-400 transition-colors"
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                </form>

                <div className="hidden lg:flex items-center gap-2 shrink-0">
                    {locations.map((loc) => (
                        <button
                            key={loc.name}
                            type="button"
                            className="px-2.5 py-1 rounded-full bg-black/30 border border-cyan-500/20 text-[12px] text-gray-200 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
                            onClick={() => onSelectLocation(loc)}
                        >
                            {loc.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="lg:hidden mt-2 glass-panel p-2 flex items-center gap-2 overflow-x-auto pointer-events-auto">
                <span className="text-[11px] uppercase tracking-wider text-gray-300 shrink-0 flex items-center gap-1">
                    <MapPin size={12} /> Zones
                </span>
                {locations.map((loc) => (
                    <button
                        key={loc.name}
                        type="button"
                        className="px-3 py-1.5 rounded-full bg-black/30 border border-cyan-500/20 text-xs text-gray-200 whitespace-nowrap"
                        onClick={() => onSelectLocation(loc)}
                    >
                        {loc.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
