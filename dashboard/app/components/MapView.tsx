"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { FloodData } from "../data/types"

interface MapViewProps {
    selectedLocation: { lat: number, lng: number } | null
    onLocationSelect: (lat: number, lng: number) => void
    data: FloodData | null
}

export default function MapView({ selectedLocation, onLocationSelect, data }: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)

    // Track markers to easily update/remove them
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const animFrame = useRef<number>(0)

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

        map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")

        map.current.on("load", () => {
            map.current?.setProjection({
                type: "globe"
            })


            // Setup empty flood source & layers immediately
            map.current?.addSource("flood", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: []
                }
            })

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

            // Animate polygon opacity
            let time = 0;
            const animatePolygon = () => {
                if (!map.current) return;
                time += 0.05;
                const opacity = 0.3 + 0.3 * Math.sin(time);
                if (map.current.getLayer("flood-layer-fill")) {
                    map.current.setPaintProperty("flood-layer-fill", "fill-opacity", opacity);
                }
                animFrame.current = requestAnimationFrame(animatePolygon);
            };
            animFrame.current = requestAnimationFrame(animatePolygon);

            // Emit clicks up to parent instead of managing state locally
            map.current?.on("click", (e) => {
                onLocationSelect(e.lngLat.lat, e.lngLat.lng)
            })
        })

        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current)
            map.current?.remove()
            map.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // React to selectedLocation changes (flyTo and place marker)
    useEffect(() => {
        if (!map.current || !selectedLocation) return

        const { lat, lng } = selectedLocation

        map.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            duration: 3000,
            essential: true
        })

        if (markerRef.current) markerRef.current.remove()

        const markerEl = document.createElement("div")
        markerEl.className = "risk-marker"

        markerRef.current = new maplibregl.Marker({ element: markerEl, anchor: "bottom" })
            .setLngLat([lng, lat])
            .addTo(map.current!)

    }, [selectedLocation])

    // React to data changes (draw polygons)
    useEffect(() => {
        if (!map.current) return

        const source = map.current.getSource("flood") as maplibregl.GeoJSONSource
        if (!source) return

        const clearFloodLayer = () => {
            source.setData({
                type: "FeatureCollection",
                features: []
            })
            if (map.current?.getLayer("flood-layer-fill")) {
                map.current.setPaintProperty("flood-layer-fill", "fill-color", "rgba(239, 68, 68, 0)")
            }
            if (map.current?.getLayer("flood-layer-line")) {
                map.current.setPaintProperty("flood-layer-line", "line-color", "rgba(239, 68, 68, 0)")
            }
        }

        if (!data || !data.coordinates || data.coordinates.length === 0) {
            clearFloodLayer()
            return
        }

        source.setData({
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: data.coordinates
            },
            properties: {}
        })

        // DYNAMIC COLORS based on Unified Risk Tokens
        const riskString = data.risk.toLowerCase()
        let riskColorVar = "--risk-low"
        if (riskString === "high") riskColorVar = "--risk-high"
        else if (riskString === "medium" || riskString === "moderate") riskColorVar = "--risk-moderate"

        // Reading the explicit computed root variable using JS so WebGL can render it organically.
        const computedColor = getComputedStyle(document.documentElement).getPropertyValue(riskColorVar).trim() || "#22c55e"

        if (map.current.getLayer("flood-layer-fill")) {
            map.current.setPaintProperty("flood-layer-fill", "fill-color", computedColor)
        }
        if (map.current.getLayer("flood-layer-line")) {
            map.current.setPaintProperty("flood-layer-line", "line-color", computedColor)
        }

    }, [data])

    return (
        <div className="w-full h-full absolute inset-0 bg-black overflow-hidden z-0">
            {/* Space Background Illusion */}
            <div className="absolute inset-0 opacity-60 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(1.5px 1.5px at 10% 20%, white, transparent),
                        radial-gradient(2px 2px at 30% 10%, rgba(255, 255, 255, 0.8), transparent),
                        radial-gradient(1px 1px at 40% 60%, rgba(255, 255, 255, 0.5), transparent),
                        radial-gradient(2.5px 2.5px at 70% 30%, rgba(255, 255, 255, 0.9), transparent),
                        radial-gradient(1px 1px at 90% 80%, rgba(255, 255, 255, 0.4), transparent),
                        radial-gradient(1.5px 1.5px at 20% 80%, rgba(255, 255, 255, 0.7), transparent),
                        radial-gradient(2px 2px at 60% 80%, rgba(255, 255, 255, 0.6), transparent),
                        radial-gradient(1px 1px at 80% 50%, rgba(255, 255, 255, 0.5), transparent),
                        radial-gradient(2px 2px at 50% 40%, rgba(255, 255, 255, 0.8), transparent)
                    `,
                    backgroundSize: "250px 250px",
                    backgroundRepeat: "repeat"
                }}
            />

            <div ref={mapContainer} className="absolute inset-0 w-full h-full cursor-crosshair z-10" />
        </div>
    )
}
