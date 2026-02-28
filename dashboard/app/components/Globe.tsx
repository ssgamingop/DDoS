"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import { mockData } from "../data/mockData";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center">
      {size.width > 0 && size.height > 0 && (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="rgba(0,0,0,0)"
          width={size.width}
          height={size.height}
          pointsData={[
            {
              lat: mockData.coordinates[0][1],
              lng: mockData.coordinates[0][0],
              size: 0.4,
              color: "red",
            },
          ]}
          pointAltitude="size"
          pointColor="color"
          onGlobeReady={() => {
            const globe = globeRef.current as any;
            if (!globe) return;
            const controls = globe.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.enablePan = false;
            globe.pointOfView({ lat: mockData.coordinates[0][1], lng: mockData.coordinates[0][0], altitude: 2.2 }, 1000);
          }}
        />
      )}
    </div>
  );
}
