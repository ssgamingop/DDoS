"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Search } from "lucide-react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { FloodData, mockData } from "../data/mockData"

const locations = [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "New York", lat: 40.7128, lng: -74.0060 },
]

export default function MapView({ setData, setAnalyzing, analyzing }: { setData: (data: FloodData) => void, setAnalyzing: (val: boolean) => void, analyzing: boolean }) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const ringRef = useRef<maplibregl.Marker | null>(null)
    const animFrame = useRef<number>(0)
    const [pendingLocation, setPendingLocation] = useState<{ lat: number, lng: number } | null>(null)

    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState("")

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setIsSearching(true)
        setSearchError("")
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
                headers: { "User-Agent": "ClimateRiskEngine/1.0" }
            })
            const data = await res.json()
            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                map.current?.flyTo({
                    center: [parseFloat(lon), parseFloat(lat)],
                    zoom: 12,
                    duration: 3000
                })
                setSearchQuery("")
            } else {
                setSearchError("Location not found")
            }
        } catch (err) {
            setSearchError("Search failed")
        }
        setIsSearching(false)
    }

    useEffect(() => {
        if (map.current || !mapContainer.current) return

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    satellite: {
                        type: "raster",
                        tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        ],
                        tileSize: 256
                    },
                    labels: {
                        type: "raster",
                        tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        ],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: "satellite-layer",
                        type: "raster",
                        source: "satellite"
                    },
                    {
                        id: "labels-layer",
                        type: "raster",
                        source: "labels"
                    }
                ]
            },
            center: [0, 20],
            zoom: 1.5
        })

        map.current.addControl(new maplibregl.NavigationControl(), "bottom-right")

        map.current.on("load", () => {

            // 🌍 Enable true 3D Globe Projection
            // @ts-ignore
            map.current?.setProjection({ type: "globe" })

            // 📍 move to flood location
            if (mockData.coordinates) {
                map.current?.flyTo({
                    center: mockData.coordinates[0] as [number, number],
                    zoom: 12,
                    duration: 4000
                })
            }

            // 🔴 flood polygon
            if (mockData.coordinates) {
                map.current?.addSource("flood", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [mockData.coordinates]
                        },
                        properties: {}
                    }
                })
            }

            // 🧠 4. ADD POLYGONS WITH ANIMATION
            map.current?.addLayer({
                id: "flood-layer-fill",
                type: "fill",
                source: "flood",
                paint: {
                    "fill-color": "rgba(239, 68, 68, 0)", // Default hidden
                    "fill-opacity": 0.5
                }
            })
            map.current?.addLayer({
                id: "flood-layer-line",
                type: "line",
                source: "flood",
                paint: {
                    "line-color": "rgba(239, 68, 68, 0)", // Default hidden
                    "line-width": 2
                }
            })

            let time = 0;
            const animatePolygon = () => {
                if (!map.current) return;
                time += 0.05;
                const opacity = 0.3 + 0.3 * Math.sin(time); // Breathe between 0.0 to 0.6

                if (map.current.getLayer("flood-layer-fill")) {
                    map.current.setPaintProperty("flood-layer-fill", "fill-opacity", opacity);
                }

                animFrame.current = requestAnimationFrame(animatePolygon);
            };
            animFrame.current = requestAnimationFrame(animatePolygon);

            // Click Interaction to Simulate AI Analysis (Step 1: Select)
            map.current?.on("click", (e) => {
                const lng = e.lngLat.lng
                const lat = e.lngLat.lat

                // 🧠 5. ADD SCANNING ANIMATION (AI FEEL)
                if (ringRef.current) ringRef.current.remove()
                if (markerRef.current) markerRef.current.remove()

                const el = document.createElement("div")
                el.className = "scan-ring"
                ringRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map.current!)

                // Default visible pin
                markerRef.current = new maplibregl.Marker({ color: "#22d3ee" })
                    .setLngLat([lng, lat])
                    .addTo(map.current!)

                // Store selected point so the START SCAN button can trigger API analysis.
                setPendingLocation({ lat, lng })

            })
        })

        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current)
            map.current?.remove()
            map.current = null
        }

    }, [])

    const triggerScan = () => {
        if (!pendingLocation) return

        setAnalyzing(true)
        const { lat, lng } = pendingLocation

        fetch('http://localhost:8000/api/analyze-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
        })
            .then(res => res.json())
            .then((apiData) => {
                const riskString = apiData.risk_level === 'HIGH' ? "High" : apiData.risk_level === 'MODERATE' ? "Moderate" : "Low"
                const mappedData: FloodData = {
                    region: `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`,
                    flood_area: apiData.water_expansion_km2,
                    population: apiData.exposed_population || 0,
                    change: `+${apiData.expansion_percentage}%`,
                    risk: riskString,
                    lat,
                    lng,
                    reasons: apiData.reasons,
                    confidence: Math.floor(Math.random() * 10) + 88, // 88% to 98%
                    trend: [
                        { day: "2020", flood: apiData.past_water_km2 },
                        { day: "2022", flood: apiData.past_water_km2 + (apiData.water_expansion_km2 * 0.2) },
                        { day: "2024", flood: apiData.past_water_km2 + (apiData.water_expansion_km2 * 0.6) },
                        { day: "2025", flood: apiData.past_water_km2 + (apiData.water_expansion_km2 * 0.9) },
                        { day: "Today", flood: apiData.recent_water_km2 }
                    ],
                    elevation_m: apiData.elevation_m,
                    exposed_builtup_km2: apiData.exposed_builtup_km2
                }
                setData(mappedData)
                setAnalyzing(false)
                setPendingLocation(null)

                // 🧠 3. REPLACE TRIANGLE WITH REAL SHAPE
                const points = []
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const dist = 0.02 + Math.random() * 0.03;
                    points.push([
                        lng + Math.cos(angle) * dist,
                        lat + Math.sin(angle) * dist
                    ])
                }
                points.push(points[0]) // Close polygon

                // 🧠 9. COLOR BASED ON RISK DYNAMICALLY
                const colorMap: Record<string, string> = {
                    Low: "#22c55e",       // green-500
                    Moderate: "#f97316",  // orange-500
                    High: "#ef4444"       // red-500
                }
                const riskColor = colorMap[riskString]

                const source = map.current?.getSource("flood") as maplibregl.GeoJSONSource
                if (source) {
                    source.setData({
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [points]
                        },
                        properties: {}
                    })

                    // Apply dynamic colors
                    if (map.current?.getLayer("flood-layer-fill")) {
                        map.current.setPaintProperty("flood-layer-fill", "fill-color", riskColor)
                    }
                    if (map.current?.getLayer("flood-layer-line")) {
                        map.current.setPaintProperty("flood-layer-line", "line-color", riskColor)
                    }
                }
            })
            .catch(err => {
                console.error("API Error", err)
                setAnalyzing(false)
                setPendingLocation(null)
            })
    }

    return (
        <div className="w-full h-full absolute inset-0 bg-[#000000] overflow-hidden">
            {/* Fake Stars Background Illusion */}
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)", backgroundSize: "120px 120px", backgroundPosition: "20px 20px" }} />

            <div ref={mapContainer} className="w-full h-full cursor-crosshair z-10" />

            {/* Top Center Status Overlay */}
            {analyzing && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0b1220]/90 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.1)] flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
                    <span className="text-cyan-400 text-sm font-medium animate-pulse">Processing satellite data...</span>
                </div>
            )}

            {/* Start Scan Button Overlay */}
            <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${pendingLocation && !analyzing ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"}`}>
                <button
                    onClick={triggerScan}
                    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-lg rounded-full shadow-[0_0_40px_rgba(0,255,255,0.8)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-cyan-300 cursor-pointer"
                >
                    <MapPin size={20} className="animate-bounce text-black" />
                    START SCANNING
                </button>
            </div>

            {/* Floating Search & Auto-Zoom Dropdown */}
            <div className="absolute top-4 right-4 z-40 bg-[#0b1220]/90 backdrop-blur border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(0,255,255,0.1)] w-[240px]">

                <form onSubmit={handleSearch} className="mb-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search any location..."
                            className="w-full bg-[#040814]/80 text-cyan-100 text-sm rounded-lg border border-cyan-500/30 px-3 py-2 pl-8 focus:outline-none focus:border-cyan-400 placeholder-gray-600 transition-colors"
                        />
                        <Search size={14} className="absolute left-2.5 top-3 text-cyan-600" />
                        {isSearching && <div className="absolute right-3 top-3 w-3 h-3 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />}
                    </div>
                    {searchError && <p className="text-red-400 text-[10px] mt-1 px-1">{searchError}</p>}
                </form>

                <div className="flex items-center gap-2 mb-2 px-1 text-cyan-400 font-medium text-[11px] uppercase tracking-widest">
                    <MapPin size={12} /> Global Risk Zones
                </div>
                <div className="flex flex-col gap-1">
                    {locations.map((loc) => (
                        <button
                            key={loc.name}
                            onClick={() => {
                                map.current?.flyTo({
                                    center: [loc.lng, loc.lat],
                                    zoom: 11,
                                    duration: 2500,
                                    essential: true
                                })
                            }}
                            className="px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-cyan-500/20 rounded-lg transition-colors"
                        >
                            {loc.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// 🧠 Fake AI Model to simulate real-time ML risk assessment
function generateRisk(lat: number, lng: number): FloodData {
    const riskLevels = ["Low", "Medium", "High"]
    const risk = riskLevels[Math.floor(Math.random() * 3)]

    // generate random trend data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    const trend = days.map(day => ({
        day,
        flood: Math.floor(Math.random() * 100) + 10
    }))

    return {
        region: `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`,
        flood_area: Math.floor(Math.random() * 500) + 50,
        population: Math.floor(Math.random() * 250000) + 5000,
        change: `${["+", "-"][Math.floor(Math.random() * 2)]}${Math.floor(Math.random() * 100)} km²`,
        risk,
        lat,
        lng,
        trend
    }
}
