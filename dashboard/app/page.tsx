"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe } from "lucide-react"
import dynamic from "next/dynamic"
import { FloodData } from "./data/types"

import TopBar from "./components/TopBar"
import LeftPanel from "./components/LeftPanel"
import RightPanel from "./components/RightPanel"
import BottomBar from "./components/BottomBar"

const MapView = dynamic(() => import("./components/MapView"), { ssr: false })

export default function Page() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [data, setData] = useState<FloodData | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // State for user's selected map point
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null)

  useEffect(() => {
    setTimeout(() => setInitialLoading(false), 2000)
  }, [])

  // Geocode Search handler
  const handleSearch = async (val: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=1`, {
        headers: { "User-Agent": "ClimateRiskEngine/1.0" }
      })
      const results = await res.json()
      if (results && results.length > 0) {
        const { lat, lon } = results[0]
        setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lon) })
        setData(null) // clear previous data on new selection
        setAnalysisError(null)
      }
    } catch (err) {
      console.error("Search failed", err)
    }
  }

  // Handle Location click from Global Risk Zones in TopBar
  const handleSelectPredefined = (loc: { lat: number, lng: number }) => {
    setSelectedLocation({ lat: loc.lat, lng: loc.lng })
    setData(null)
    setAnalysisError(null)
  }

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setData(null)
    setAnalysisError(null)
  }

  // Core API logic moved to the exact parent component
  const triggerScan = async () => {
    if (!selectedLocation) return
    setAnalyzing(true)
    setAnalysisError(null)

    const { lat, lng } = selectedLocation
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      const res = await fetch(`${API_BASE}/api/analyze-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      })
      const apiData = await res.json()
      if (!res.ok) {
        const detail = typeof apiData?.detail === "string" ? apiData.detail : "Analysis request failed."
        throw new Error(detail)
      }

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
        trend: [
          { day: "Past", flood: Number(apiData.past_water_km2 || 0) },
          { day: "Recent", flood: Number(apiData.recent_water_km2 || 0) }
        ],
        elevation_m: apiData.elevation_m,
        exposed_builtup_km2: apiData.exposed_builtup_km2,
        coordinates: apiData.coordinates || []
      }
      setData(mappedData)
    } catch (err) {
      console.error("API Error", err)
      setData(null)
      setAnalysisError(err instanceof Error ? err.message : "Unable to complete analysis. Please retry.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {initialLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070d] text-cyan-400"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mb-8"
            >
              <Globe size={64} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl tracking-widest uppercase font-semibold"
            >
              Initializing Climate Engine...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-screen h-screen bg-black relative overflow-hidden text-white transition-opacity duration-500">

        {/* Noise Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />

        {/* MAP / GLOBE View */}
        <div className="absolute inset-0 z-0">
          <MapView
            selectedLocation={selectedLocation}
            onLocationSelect={handleMapClick}
            data={data}
          />
        </div>

        {/* MAP DIM EFFECT via CSS class */}
        <div className="map-overlay" />

        {/* BACKGROUND OVERLAY (CRITICAL) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none z-10" />

        {!initialLoading && (
          <>
            <div className="absolute inset-0 z-20 flex flex-col px-4 pt-4 pb-24 md:px-6 pointer-events-none">
              <TopBar onSearch={handleSearch} onSelectLocation={handleSelectPredefined} />

              <div className="mt-4 hidden lg:grid flex-1 grid-cols-[minmax(0,410px)_1fr_minmax(0,340px)] gap-5 pointer-events-none">
                <div className="pointer-events-auto self-start">
                  <RightPanel data={data} selectedLocation={selectedLocation} analysisError={analysisError} />
                </div>
                <div />
                <div className="pointer-events-auto self-start justify-self-end">
                  <LeftPanel data={data} selectedLocation={selectedLocation} analysisError={analysisError} />
                </div>
              </div>

              <div className="mt-3 space-y-3 lg:hidden pointer-events-auto overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                <RightPanel data={data} selectedLocation={selectedLocation} analysisError={analysisError} />
                <LeftPanel data={data} selectedLocation={selectedLocation} analysisError={analysisError} />
              </div>
            </div>

            {analysisError && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-40 px-4 py-2 rounded-lg border border-rose-400/35 bg-rose-950/70 backdrop-blur text-rose-100 text-sm max-w-[min(90vw,620px)] text-center">
                {analysisError}
              </div>
            )}

            <BottomBar
              analyzing={analyzing}
              selectedLocation={selectedLocation}
              onScan={triggerScan}
            />
          </>
        )}
      </div>
    </>
  )
}
