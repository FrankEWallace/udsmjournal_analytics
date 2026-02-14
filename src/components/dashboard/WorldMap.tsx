import { useState } from "react";
import { motion } from "framer-motion";
import { countryData } from "@/lib/mock-data";

const WorldMap = () => {
  const [activeToggle, setActiveToggle] = useState<"24h" | "live">("24h");
  const maxDownloads = Math.max(...countryData.map((c) => c.downloads));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground">Global Reader Engagement</h3>
          <p className="text-xs text-muted-foreground">Download distribution by country</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setActiveToggle("24h")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeToggle === "24h" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => setActiveToggle("live")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeToggle === "live" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            Live
          </button>
        </div>
      </div>

      {/* Simplified World Map as Data Grid */}
      <div className="relative rounded-lg bg-secondary/50 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {countryData.map((country, i) => {
            const intensity = country.downloads / maxDownloads;
            return (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                className="group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-card-hover"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{
                    background: `hsl(209 100% ${70 - intensity * 38}%)`,
                  }}
                >
                  {country.code}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{country.country}</p>
                  <p className="text-xs text-muted-foreground">{country.downloads.toLocaleString()} downloads</p>
                </div>
                {/* Intensity bar */}
                <div className="absolute bottom-0 left-0 h-0.5 rounded-b-lg transition-all" style={{ width: `${intensity * 100}%`, background: `hsl(209 100% ${70 - intensity * 38}%)` }} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Auto-refresh every 30 seconds</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          Connected
        </span>
      </div>
    </motion.div>
  );
};

export default WorldMap;
