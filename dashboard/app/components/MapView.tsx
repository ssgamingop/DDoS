"use client"

import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
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
                    }
                },
                layers: [
                    {
                        id: "satellite-layer",
                        type: "raster",
                        source: "satellite"
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

            // 🧠 4. ADD HEATMAP (BIG VISUAL UPGRADE)
            map.current?.addLayer({
                id: "flood-layer",
                type: "heatmap",
                source: "flood",
                paint: {
                    "heatmap-intensity": 1,
                    "heatmap-radius": 30,
                    "heatmap-opacity": 0.8
                }
            })

            // Click Interaction to Simulate AI Analysis
            map.current?.on("click", (e) => {
                const lng = e.lngLat.lng
                const lat = e.lngLat.lat

                // 🧠 5. ADD SCANNING ANIMATION (AI FEEL)
                if (markerRef.current) markerRef.current.remove()

                const el = document.createElement("div")
                el.className = "scan-ring"
                markerRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map.current!)

                setAnalyzing(true)

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
                            population: Math.floor(Math.random() * 250000) + 5000,
                            change: `+${apiData.expansion_percentage}%`,
                            risk: riskString,
                            lat,
                            lng,
                            reasons: apiData.reasons,
                            confidence: Math.floor(Math.random() * 20) + 80,
                            trend: [
                                { day: "Past Baseline", flood: apiData.past_water_km2 },
                                { day: "Recent Obvs", flood: apiData.recent_water_km2 }
                            ]
                        }
                        setData(mappedData)
                        setAnalyzing(false)

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

                        // 🧠 9. COLOR BASED ON RISK
                        const colorMap: Record<string, string> = {
                            Low: "rgba(0, 255, 0, 0.8)",
                            Moderate: "rgba(255, 170, 0, 0.8)",
                            High: "rgba(255, 0, 0, 0.8)"
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

                            if (map.current?.getLayer("flood-layer")) {
                                map.current?.setPaintProperty("flood-layer", "heatmap-color", [
                                    "interpolate", ["linear"], ["heatmap-density"],
                                    0, "rgba(0,0,0,0)",
                                    1, riskColor
                                ])
                            }
                        }
                    })
                    .catch(err => {
                        console.error("API Error", err)
                        setAnalyzing(false)
                    })
            })
        })

        return () => {
            map.current?.remove()
            map.current = null
        }

    }, [])

    return (
        <div className="w-full h-full absolute inset-0 bg-[#000000] overflow-hidden">
            {/* Fake Stars Background Illusion */}
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)", backgroundSize: "120px 120px", backgroundPosition: "20px 20px" }} />

            <div ref={mapContainer} className="w-full h-full cursor-crosshair z-10" />

            {/* 🧠 6. ADD "PROCESSING LOGS" (VERY POWERFUL) */}
            {analyzing && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-md border border-cyan-500/50 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
                    <div className="text-cyan-400 text-sm font-mono flex flex-col items-center">
                        <span className="animate-pulse">Fetching Sentinel-2 Data...</span>
                        <span className="animate-pulse animation-delay-500 text-cyan-500/80">Running NDWI Flood Model...</span>
                        <span className="animate-pulse animation-delay-1000 text-cyan-600/60">Generating AI Insights...</span>
                    </div>
                </div>
            )}

            {/* Floating Auto-Zoom Dropdown */}
            <div className="absolute top-4 right-4 z-40 bg-[#0b1220]/90 backdrop-blur border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                <div className="flex items-center gap-2 mb-2 px-2 pt-1 text-cyan-400 font-medium text-sm">
                    <MapPin size={16} /> Global Risk Zones
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