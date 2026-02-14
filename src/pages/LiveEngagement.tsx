import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Download, Eye, Zap } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import { countryData } from "@/lib/mock-data";

const LiveEngagement = () => {
  const [downloadsPerMin, setDownloadsPerMin] = useState(14);
  const [activeReaders, setActiveReaders] = useState(238);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadsPerMin((v) => v + Math.floor(Math.random() * 5 - 2));
      setActiveReaders((v) => Math.max(100, v + Math.floor(Math.random() * 20 - 10)));
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold font-heading text-foreground">Live Engagement</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-xs font-medium text-success">Live updating…</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Downloads / min" value={downloadsPerMin} icon={Download} delay={0} accent />
        <KpiCard label="Active Readers" value={activeReaders} icon={Eye} delay={0.05} />
        <KpiCard label="Sessions Today" value={1842} icon={Activity} trend={5.3} delay={0.1} />
        <KpiCard label="Peak This Hour" value={42} icon={Zap} delay={0.15} />
      </div>

      {/* Live Country Feed */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold font-heading text-foreground">Real-Time Global Activity</h3>
          <span className="text-xs text-muted-foreground">Auto-refresh: 3s</span>
        </div>
        <div className="space-y-2">
          {countryData.slice(0, 8).map((c, i) => {
            const liveDownloads = c.downloads + tick * Math.floor(Math.random() * 3);
            return (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {c.code}
                  </div>
                  <span className="text-sm font-medium text-foreground">{c.country}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">{liveDownloads.toLocaleString()}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default LiveEngagement;
