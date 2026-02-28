"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FloodData } from "./data/mockData"
import SidebarLeft from "./components/SidebarLeft"
import SidebarRight from "./components/SidebarRight"
import dynamic from "next/dynamic"
import { Globe } from "lucide-react"

const MapView = dynamic(() => import("./components/MapView"), { ssr: false })
const HistoryPanel = dynamic(() => import("./components/HistoryPanel"), { ssr: false })

export default function Page() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [data, setData] = useState<FloodData | null>(null)

  useEffect(() => {
    setTimeout(() => setInitialLoading(false), 2000)
  }, [])

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
              className="text-xl tracking-widest uppercase font-semibold glow"
            >
              Fetching satellite data...
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-sm text-gray-400 mt-2"
            >
              Processing flood detection...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-screen w-screen flex bg-[#05070d] text-white overflow-hidden relative">

        {analyzing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0b1220]/80 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Globe className="text-cyan-400" size={20} />
            </motion.div>
            <span className="text-cyan-400 font-medium tracking-wide">Processing satellite data...</span>
          </div>
        )}

        <SidebarLeft data={data} />

        <div className="flex-grow relative z-0">
          <HistoryPanel />
          <MapView setData={setData} setAnalyzing={setAnalyzing} analyzing={analyzing} />
        </div>

        <SidebarRight data={data} />

      </div>
    </>
  )
}
