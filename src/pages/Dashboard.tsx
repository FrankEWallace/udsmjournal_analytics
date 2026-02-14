import { BookOpen, Download, FileText, GitBranch, Quote, TrendingUp, ExternalLink, Users, Clock, CheckCircle } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import InteractiveWorldMap from "@/components/dashboard/InteractiveWorldMap";
import CitationChart from "@/components/dashboard/CitationChart";
import CitationTimeline from "@/components/dashboard/CitationTimeline";
import { DashboardSkeleton, ErrorState, DataFreshness, ConnectionBadge } from "@/components/ui/skeletons";
import { useFastStatsDashboard, useFastStatsConnection } from "@/hooks/useOJSData";
import { useMatomoConnection } from "@/hooks/useMatomoData";
import { getAggregatedStats } from "@/lib/mock-data";

const Dashboard = () => {
  // Fetch real data from Fast Stats API
  const { 
    data: apiData, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useFastStatsDashboard();
  
  // Connection status checks
  const { data: fastStatsConnection } = useFastStatsConnection();
  const { data: matomoConnection } = useMatomoConnection();
  
  // Use API data if available, otherwise fall back to mock data
  const useMockData = !apiData || error;
  const mockStats = getAggregatedStats();
  
  // Normalize data for display
  const stats = useMockData ? {
    totalJournals: mockStats.totalJournals,
    totalPapers: mockStats.totalPapers,
    totalDownloads: mockStats.totalDownloads,
    totalCitations: mockStats.totalCitations,
    totalInternal: mockStats.totalInternal,
    totalExternal: mockStats.totalExternal,
    avgGrowth: mockStats.avgGrowth,
    totalUsers: 0,
    acceptanceRate: 0,
    avgDaysToDecision: 0,
  } : {
    totalJournals: apiData.journals?.length || 0,
    totalPapers: apiData.totalPublications || 0,
    totalDownloads: apiData.totalDownloads || 0,
    totalCitations: apiData.totalCitations || 0,
    totalInternal: Math.round((apiData.totalCitations || 0) * 0.6), // Estimate
    totalExternal: Math.round((apiData.totalCitations || 0) * 0.4), // Estimate
    avgGrowth: apiData.acceptanceRate || 0,
    totalUsers: apiData.totalUsers || 0,
    acceptanceRate: apiData.acceptanceRate || 0,
    avgDaysToDecision: apiData.avgDaysToDecision || 0,
  };

  // Show loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with status indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">System Overview</h1>
          <p className="text-sm text-muted-foreground">
            {useMockData ? (
              <span className="text-yellow-600">Using demo data · API not connected</span>
            ) : (
              <>Aggregated analytics across all {stats.totalJournals} UDSM journals</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DataFreshness 
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined} 
            isRefetching={isRefetching} 
          />
          <div className="flex items-center gap-3">
            <ConnectionBadge 
              connected={fastStatsConnection?.connected || false} 
              label="OJS" 
              loading={!fastStatsConnection}
            />
            <ConnectionBadge 
              connected={matomoConnection?.connected || false} 
              label="Matomo" 
              loading={!matomoConnection}
            />
          </div>
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && !useMockData && (
        <ErrorState 
          title="API Connection Issue"
          message={error.message || "Unable to fetch live data. Showing cached data."}
          onRetry={() => refetch()}
        />
      )}

      {/* KPI Cards - Primary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          label="Total Journals" 
          value={stats.totalJournals} 
          icon={BookOpen} 
          trend={4.0} 
          delay={0} 
        />
        <KpiCard 
          label="Published Papers" 
          value={stats.totalPapers} 
          icon={FileText} 
          trend={8.2} 
          delay={0.05} 
        />
        <KpiCard 
          label="Total Downloads" 
          value={stats.totalDownloads} 
          icon={Download} 
          trend={12.5} 
          delay={0.1} 
          accent 
        />
        <KpiCard 
          label="Total Citations" 
          value={stats.totalCitations} 
          icon={Quote} 
          trend={stats.avgGrowth} 
          delay={0.15} 
        />
      </div>

      {/* KPI Cards - Secondary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          label="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          delay={0.2} 
        />
        <KpiCard 
          label="Acceptance Rate" 
          value={`${stats.acceptanceRate}%`} 
          icon={CheckCircle} 
          delay={0.25}
          accent 
        />
        <KpiCard 
          label="Avg Days to Decision" 
          value={stats.avgDaysToDecision} 
          icon={Clock} 
          delay={0.3} 
        />
        <KpiCard 
          label="Citation Growth" 
          value={`${stats.avgGrowth}%`} 
          icon={TrendingUp} 
          delay={0.35}
          accent 
        />
      </div>

      {/* World Map - Uses Matomo data for real-time, mock for fallback */}
      <InteractiveWorldMap />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CitationChart data={apiData?.topPublications} />
        <CitationTimeline data={apiData?.viewsTimeline} />
      </div>
    </div>
  );
};

export default Dashboard;
