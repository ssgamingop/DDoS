"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { mockData } from "../data/mockData";

const GlobeConfig = dynamic(() => import('react-globe.gl'), { ssr: false })

export default function InteractiveGlobe() {
  const globeRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.5
      globeRef.current.controls().enableZoom = false
    }
  }, [])

  if (!mounted) return null

  // Safely extract coordinates for the globe points
  const points = mockData.coordinates ? [
    {
      lat: mockData.coordinates[0][1],
      lng: mockData.coordinates[0][0],
      size: 0.4,
      color: 'red',
      label: 'Selected Risk Zone'
    }
  ] : []

  // Safely extract coordinates for the globe polygons
  const polygons = mockData.coordinates ? [
    {
      coords: mockData.coordinates,
      color: 'rgba(255, 0, 0, 0.5)'
    }
  ] : []

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent mix-blend-screen opacity-60">
      <GlobeConfig
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude={0.1}
        polygonsData={polygons}
        polygonGeoJsonGeometry={(d: any) => ({
          type: 'Polygon',
          coordinates: [d.coords]
        })}
        polygonCapColor="color"
        polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
        polygonStrokeColor={() => '#111'}
        polygonAltitude={0.01}
      />
    </div>
  )
}
