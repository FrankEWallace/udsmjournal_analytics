import { useState, useEffect } from "react";
import { Activity, Download, Eye, Zap } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import InteractiveWorldMap from "@/components/dashboard/InteractiveWorldMap";

const LiveEngagement = () => {
  const [downloadsPerMin, setDownloadsPerMin] = useState(14);
  const [activeReaders, setActiveReaders] = useState(238);

  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadsPerMin((v) => Math.max(5, v + Math.floor(Math.random() * 5 - 2)));
      setActiveReaders((v) => Math.max(100, v + Math.floor(Math.random() * 20 - 10)));
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

      {/* Live World Map */}
      <InteractiveWorldMap
        title="Real-Time Global Activity"
        subtitle="Live reader engagement across the world"
        showToggle={false}
        animated
      />
    </div>
  );
};

export default LiveEngagement;
