import { BookOpen, Download, FileText, TrendingUp, Users, Clock, CheckCircle, Eye, RefreshCw, Quote } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import InteractiveWorldMap from "@/components/dashboard/InteractiveWorldMap";
import CitationChart from "@/components/dashboard/CitationChart";
import CitationTimeline from "@/components/dashboard/CitationTimeline";
import TopArticlesTable from "@/components/dashboard/TopArticlesTable";
import EditorialFunnel from "@/components/dashboard/EditorialFunnel";
import CitationMetrics from "@/components/dashboard/CitationMetrics";
import { DashboardSkeleton, ErrorState, DataFreshness, ConnectionBadge } from "@/components/ui/skeletons";
import { useAllJournalsMetrics, useOJSConnection } from "@/hooks/useOJSData";
import { useMatomoConnection } from "@/hooks/useMatomoData";
import { usePublicationCitations, useCrossrefConnection } from "@/hooks/useCrossrefData";

const Dashboard = () => {
  // Fetch real data from OJS standard API (aggregated across all journals)
  const { 
    data: metrics, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useAllJournalsMetrics();
  
  // Connection status checks
  const { data: ojsConnection } = useOJSConnection();
  const { data: matomoConnection } = useMatomoConnection();
  const { data: crossrefConnection } = useCrossrefConnection();
  
  // Citation data from Crossref (uses DOIs from OJS publications)
  const {
    data: citationSummary,
    isLoading: citationsLoading,
    isError: citationsError,
    error: citationsErrorObj,
    refetch: refetchCitations,
    isRefetching: citationsRefetching,
  } = usePublicationCitations(metrics?.topPublications);
  
  const isConnected = !!metrics && !error;

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
            {isConnected ? (
              <>Analytics across {metrics.contexts?.length || 0} UDSM scholarly journals</>
            ) : (
              <span className="text-yellow-600">Unable to connect to OJS API</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DataFreshness 
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined} 
            isRefetching={isRefetching} 
          />
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-3">
            <ConnectionBadge 
              connected={ojsConnection?.connected || false} 
              label="OJS" 
              loading={!ojsConnection}
            />
            <ConnectionBadge 
              connected={matomoConnection?.connected || false} 
              label="Matomo" 
              loading={!matomoConnection}
            />
            <ConnectionBadge 
              connected={crossrefConnection?.connected || false} 
              label="Crossref" 
              loading={!crossrefConnection}
            />
          </div>
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <ErrorState 
          title="API Connection Issue"
          message={error.message || "Unable to fetch live data from OJS API."}
          onRetry={() => refetch()}
        />
      )}

      {/* KPI Cards - Primary Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
              label="Total Journals" 
              value={metrics.contexts?.length || 0} 
              icon={BookOpen} 
              delay={0} 
            />
            <KpiCard 
              label="Published Articles" 
              value={metrics.totalPublications} 
              icon={FileText} 
              delay={0.05} 
            />
            <KpiCard 
              label="Abstract Views" 
              value={metrics.totalAbstractViews} 
              icon={Eye} 
              delay={0.1} 
              accent 
            />
            <KpiCard 
              label="File Downloads" 
              value={metrics.totalDownloads} 
              icon={Download} 
              delay={0.15} 
              accent
            />
          </div>

          {/* KPI Cards - Editorial & User Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
              label="Total Users" 
              value={metrics.totalUsers} 
              icon={Users} 
              delay={0.2} 
            />
            <KpiCard 
              label="Acceptance Rate" 
              value={`${metrics.acceptanceRate}%`} 
              icon={CheckCircle} 
              delay={0.25}
              accent 
            />
            <KpiCard 
              label="Avg Days to Decision" 
              value={metrics.daysToDecision} 
              icon={Clock} 
              delay={0.3} 
            />
            <KpiCard 
              label="Submissions Received" 
              value={metrics.submissionsReceived} 
              icon={TrendingUp} 
              delay={0.35}
            />
          </div>

          {/* KPI Cards - Citation Metrics (Crossref) */}
          {citationSummary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard 
                label="Total Citations" 
                value={citationSummary.totalCitations} 
                icon={Quote} 
                delay={0.4} 
                accent
              />
              <KpiCard 
                label="h-Index" 
                value={citationSummary.hIndex} 
                icon={TrendingUp} 
                delay={0.45} 
              />
              <KpiCard 
                label="Avg Citations/Article" 
                value={citationSummary.avgCitationsPerArticle.toFixed(1)} 
                icon={FileText} 
                delay={0.5} 
              />
              <KpiCard 
                label="Most Cited Article" 
                value={citationSummary.maxCitations} 
                icon={BookOpen} 
                delay={0.55} 
              />
            </div>
          )}

          {/* World Map - Matomo data */}
          <InteractiveWorldMap />

          {/* Charts row: Top publications + Timeline */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CitationChart data={metrics.topPublications} />
            <CitationTimeline 
              abstractData={metrics.abstractViewsTimeline} 
              galleyData={metrics.galleyViewsTimeline} 
            />
          </div>

          {/* Editorial Pipeline */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EditorialFunnel
              submissionsReceived={metrics.submissionsReceived}
              submissionsAccepted={metrics.submissionsAccepted}
              submissionsDeclined={metrics.submissionsDeclined}
              submissionsInProgress={metrics.submissionsInProgress}
              acceptanceRate={metrics.acceptanceRate}
              rejectionRate={metrics.rejectionRate}
              daysToDecision={metrics.daysToDecision}
              daysToAccept={metrics.daysToAccept}
              daysToReject={metrics.daysToReject}
            />
            {/* Journal breakdown placeholder - shows per-journal data */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Journals Overview</h3>
              <p className="text-xs text-muted-foreground mb-4">Articles and views per journal</p>
              <div className="space-y-3">
                {metrics.contexts?.map((ctx) => {
                  const ctxMetrics = metrics.perContextMetrics?.get(ctx.urlPath);
                  return (
                    <div key={ctx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ctx.name['en_US'] || ctx.name['en'] || Object.values(ctx.name)[0] || ctx.urlPath}
                        </p>
                        <p className="text-xs text-muted-foreground">/{ctx.urlPath}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Articles</p>
                          <p className="text-sm font-bold font-mono">{ctxMetrics?.totalPublications?.toLocaleString() || '–'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Views</p>
                          <p className="text-sm font-bold font-mono">{ctxMetrics?.totalAbstractViews?.toLocaleString() || '–'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Downloads</p>
                          <p className="text-sm font-bold font-mono">{ctxMetrics?.totalDownloads?.toLocaleString() || '–'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Articles Table */}
          <TopArticlesTable data={metrics.topPublications} maxItems={10} />

          {/* Crossref Citation Metrics */}
          <CitationMetrics
            summary={citationSummary || null}
            isLoading={citationsLoading}
            isError={citationsError}
            error={citationsErrorObj}
            onRefresh={() => refetchCitations()}
            isRefreshing={citationsRefetching}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
