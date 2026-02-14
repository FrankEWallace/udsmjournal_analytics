import { useState, memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { motion } from "framer-motion";
import { countryData } from "@/lib/mock-data";
import { useMatomoCountries } from "@/hooks/useMatomoData";
import { MapSkeleton } from "@/components/ui/skeletons";

// Country coordinates lookup for Matomo data
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  TZ: { lat: -6.37, lng: 34.89 },
  KE: { lat: -0.02, lng: 37.91 },
  US: { lat: 37.09, lng: -95.71 },
  GB: { lat: 55.38, lng: -3.44 },
  ZA: { lat: -30.56, lng: 22.94 },
  NG: { lat: 9.08, lng: 8.68 },
  IN: { lat: 20.59, lng: 78.96 },
  DE: { lat: 51.17, lng: 10.45 },
  UG: { lat: 1.37, lng: 32.29 },
  ET: { lat: 9.15, lng: 40.49 },
  CA: { lat: 56.13, lng: -106.35 },
  AU: { lat: -25.27, lng: 133.78 },
  FR: { lat: 46.23, lng: 2.21 },
  CN: { lat: 35.86, lng: 104.20 },
  BR: { lat: -14.24, lng: -51.93 },
  RW: { lat: -1.94, lng: 29.87 },
  MW: { lat: -13.25, lng: 34.30 },
  ZM: { lat: -13.13, lng: 27.85 },
  // Add more as needed
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface InteractiveWorldMapProps {
  title?: string;
  subtitle?: string;
  showToggle?: boolean;
  animated?: boolean;
}

const InteractiveWorldMap = memo(({ title = "Global Reader Engagement", subtitle = "Download distribution by country", showToggle = true, animated = false }: InteractiveWorldMapProps) => {
  const [activeToggle, setActiveToggle] = useState<"24h" | "live">("24h");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  
  // Fetch real data from Matomo
  const { data: matomoCountries, isLoading, isRefetching } = useMatomoCountries(
    activeToggle === "live" ? "day" : "day",
    activeToggle === "live" ? "today" : "yesterday"
  );
  
  // Transform Matomo data to map format, fallback to mock data
  const mapData = useMemo(() => {
    if (matomoCountries && matomoCountries.length > 0) {
      return matomoCountries
        .filter(c => c.code && countryCoordinates[c.code.toUpperCase()])
        .map(c => ({
          country: c.label,
          code: c.code.toUpperCase(),
          downloads: c.nb_visits,
          lat: countryCoordinates[c.code.toUpperCase()].lat,
          lng: countryCoordinates[c.code.toUpperCase()].lng,
        }));
    }
    return countryData; // Mock fallback
  }, [matomoCountries]);
  
  const maxDownloads = Math.max(...mapData.map((c) => c.downloads), 1);

  if (isLoading) {
    return <MapSkeleton />;
  }

  const isUsingMockData = !matomoCountries || matomoCountries.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground flex items-center gap-2">
            {title}
            {isRefetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Refreshing..." />
            )}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            {subtitle}
            {isUsingMockData && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Demo Data</span>
            )}
          </p>
        </div>
        {showToggle && (
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setActiveToggle("24h")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeToggle === "24h" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setActiveToggle("live")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeToggle === "live" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
              Live
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-lg bg-secondary/30 overflow-hidden" style={{ aspectRatio: "2/1" }}>
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rpiKey || geo.id}
                    geography={geo}
                    fill="hsl(210 20% 90%)"
                    stroke="hsl(210 20% 85%)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "hsl(209 60% 80%)", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {mapData.map((c) => {
              const intensity = c.downloads / maxDownloads;
              const radius = 4 + intensity * 14;
              return (
                <Marker key={c.code} coordinates={[c.lng, c.lat]}>
                  <circle
                    r={radius}
                    fill={`hsl(209 100% ${60 - intensity * 28}% / 0.7)`}
                    stroke="hsl(209 100% 32%)"
                    strokeWidth={1}
                    className={`cursor-pointer transition-all ${animated ? "animate-pulse-glow" : ""}`}
                    style={{ filter: animated ? `drop-shadow(0 0 ${radius / 2}px hsl(209 100% 50% / 0.4))` : undefined }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top - 10,
                          content: `${c.country}: ${c.downloads.toLocaleString()} visits`,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {intensity > 0.3 && (
                    <text
                      textAnchor="middle"
                      y={radius + 12}
                      style={{ fontFamily: "Inter, sans-serif", fontSize: "7px", fill: "hsl(213 15% 50%)", fontWeight: 500 }}
                    >
                      {c.code}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(209 100% 55% / 0.7)" }} />
            Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: "hsl(209 100% 42% / 0.7)" }} />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full" style={{ background: "hsl(209 100% 32% / 0.7)" }} />
            High
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          {showToggle ? "Auto-refresh every 30 seconds" : "Live · Auto-refresh 3s"}
        </span>
      </div>
    </motion.div>
  );
});

InteractiveWorldMap.displayName = "InteractiveWorldMap";
export default InteractiveWorldMap;
