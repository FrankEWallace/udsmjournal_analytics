import { Activity, Download, Eye, Zap, RefreshCw } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import InteractiveWorldMap from "@/components/dashboard/InteractiveWorldMap";
import { useMatomoLiveCounters, useMatomoRealtime } from "@/hooks/useMatomoData";
import { KpiCardSkeleton, ConnectionBadge } from "@/components/ui/skeletons";

const LiveEngagement = () => {
  // Fetch real-time data from Matomo (2s refresh)
  const { data: liveCounters, isLoading: isLoadingCounters, isRefetching: isRefetchingCounters } = useMatomoLiveCounters();
  const { data: realtimeData, isLoading: isLoadingRealtime, isRefetching: isRefetchingRealtime } = useMatomoRealtime();
  
  const isLoading = isLoadingCounters || isLoadingRealtime;
  const isRefetching = isRefetchingCounters || isRefetchingRealtime;
  
  // Use API data or fallback to reasonable defaults
  const activeVisitors = liveCounters?.visitors || realtimeData?.visitors.length || 0;
  const actionsPerMinute = liveCounters?.actions || 0;
  const visitsToday = liveCounters?.visits || 0;
  const sessionsToday = realtimeData?.visitors.length || visitsToday;
  
  // Calculate peak from recent visitors
  const peakThisHour = Math.max(activeVisitors, sessionsToday > 0 ? Math.ceil(sessionsToday / 24) : 0);
  
  const isUsingMockData = !liveCounters;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Live Engagement
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-medium text-success">
              {isUsingMockData ? "Demo mode" : "Live updating…"}
            </span>
          </div>
        </div>
        <ConnectionBadge 
          connected={!isUsingMockData} 
          label={isUsingMockData ? "Demo Data" : "Matomo Live"}
          loading={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Actions / min" value={actionsPerMinute} icon={Download} delay={0} accent />
          <KpiCard label="Active Visitors" value={activeVisitors} icon={Eye} delay={0.05} />
          <KpiCard label="Sessions Today" value={sessionsToday} icon={Activity} delay={0.1} />
          <KpiCard label="Peak This Hour" value={peakThisHour} icon={Zap} delay={0.15} />
        </div>
      )}

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
