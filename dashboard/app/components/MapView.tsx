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

export default function MapView({ setData, setAnalyzing }: { setData: (data: FloodData) => void, setAnalyzing: (val: boolean) => void }) {
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

            map.current?.addLayer({
                id: "flood-layer",
                type: "fill",
                source: "flood",
                paint: {
                    "fill-color": "#f60000ff",
                    "fill-opacity": 0.5
                }
            })

            // Click Interaction to Simulate AI Analysis
            map.current?.on("click", (e) => {
                const lng = e.lngLat.lng
                const lat = e.lngLat.lat

                // Add or update marker
                if (markerRef.current) {
                    markerRef.current.setLngLat([lng, lat])
                } else {
                    markerRef.current = new maplibregl.Marker({ color: "#00f5ff" })
                        .setLngLat([lng, lat])
                        .addTo(map.current!)
                }

                setAnalyzing(true)

                // Simulate AI Processing delay
                setTimeout(() => {
                    const fakeData = generateRisk(lat, lng)
                    setData(fakeData)
                    setAnalyzing(false)
                }, 1500)
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