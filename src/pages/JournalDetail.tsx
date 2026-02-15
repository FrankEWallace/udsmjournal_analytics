import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Download, Eye, Users, FileText, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw, ExternalLink, Loader2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import KpiCard from "@/components/dashboard/KpiCard";
import EditorialFunnel from "@/components/dashboard/EditorialFunnel";
import CitationMetrics from "@/components/dashboard/CitationMetrics";
import { useDashboardMetrics, useOJSConnection } from "@/hooks/useOJSData";
import { usePublicationCitations, useCrossrefConnection } from "@/hooks/useCrossrefData";
import { KpiCardSkeleton, ConnectionBadge } from "@/components/ui/skeletons";

const JournalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contextPath = id || '';

  // Fetch per-journal metrics from standard OJS API
  const { data: metrics, isLoading, isRefetching, error, refetch } = useDashboardMetrics(contextPath);
  const { data: ojsConnection } = useOJSConnection(contextPath);
  const { data: crossrefConnection } = useCrossrefConnection();

  // Citation data from Crossref
  const {
    data: citationSummary,
    isLoading: citationsLoading,
    isError: citationsError,
    error: citationsErrorObj,
    refetch: refetchCitations,
    isRefetching: citationsRefetching,
  } = usePublicationCitations(metrics?.topPublications);

  // Build a lookup map for citation counts by DOI
  const citationsByDoi = new Map(
    (citationSummary?.articleCitations || []).map(c => [c.doi, c.citationCount])
  );

  const isConnected = !!metrics && !error;

  // Build timeline chart data by merging abstract + galley timelines
  const timelineData = (() => {
    if (!metrics?.abstractViewsTimeline?.length) return [];
    const galleyMap = new Map(
      (metrics.galleyViewsTimeline || []).map(g => [g.date, g.value])
    );
    return metrics.abstractViewsTimeline.map(item => ({
      month: new Date(item.date).toLocaleString('default', { month: 'short', year: '2-digit' }),
      abstractViews: item.value,
      downloads: galleyMap.get(item.date) || 0,
    }));
  })();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journals")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journals")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-heading text-foreground">Journal: {contextPath}</h1>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium mb-2">Failed to load journal data</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journals")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-heading text-foreground">Journal not found</h1>
        </div>
        <p className="text-muted-foreground">No data available for "{contextPath}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journals")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
              {contextPath.toUpperCase()}
              {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground">/{contextPath} · Detailed Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ConnectionBadge 
            connected={ojsConnection?.connected || false} 
            label={isConnected ? "Live Data" : "OJS"} 
            loading={!ojsConnection}
          />
          <ConnectionBadge 
            connected={crossrefConnection?.connected || false} 
            label="Crossref" 
            loading={!crossrefConnection}
          />
        </div>
      </div>

      {/* KPI Cards - Row 1: Content & Views */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Published Articles" value={metrics.totalPublications} icon={FileText} delay={0} />
        <KpiCard label="Abstract Views" value={metrics.totalAbstractViews} icon={Eye} delay={0.05} accent />
        <KpiCard label="File Downloads" value={metrics.totalDownloads} icon={Download} delay={0.1} accent />
        <KpiCard label="Total Users" value={metrics.totalUsers} icon={Users} delay={0.15} />
      </div>

      {/* KPI Cards - Row 2: Editorial */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Submissions Received" value={metrics.submissionsReceived} icon={TrendingUp} delay={0.2} />
        <KpiCard label="Acceptance Rate" value={`${metrics.acceptanceRate}%`} icon={CheckCircle} delay={0.25} accent />
        <KpiCard label="Avg Days to Decision" value={metrics.daysToDecision} icon={Clock} delay={0.3} />
        <KpiCard label="In Progress" value={metrics.submissionsInProgress} icon={Loader2} delay={0.35} />
      </div>

      {/* Views Timeline Chart */}
      {timelineData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-1 text-lg font-semibold font-heading text-foreground">Views & Downloads Timeline</h3>
          <p className="mb-4 text-xs text-muted-foreground">Monthly abstract views and file downloads</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="abstractViews" name="Abstract Views" stroke="#2A6EBB" fill="rgba(42,110,187,0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="downloads" name="Downloads" stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Editorial Pipeline + User Breakdown */}
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

        {/* User Roles Breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold font-heading text-foreground mb-1">User Roles</h3>
          <p className="text-xs text-muted-foreground mb-5">Registered users by role</p>
          <div className="space-y-4">
            {[
              { label: "Authors", value: metrics.totalAuthors, icon: FileText, color: "bg-blue-500" },
              { label: "Reviewers", value: metrics.totalReviewers, icon: CheckCircle, color: "bg-emerald-500" },
              { label: "Readers", value: metrics.activeReaders, icon: Eye, color: "bg-amber-500" },
            ].map((role) => {
              const max = Math.max(metrics.totalAuthors, metrics.totalReviewers, metrics.activeReaders, 1);
              const widthPct = Math.max((role.value / max) * 100, 5);
              const Icon = role.icon;
              return (
                <div key={role.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{role.label}</span>
                      <span className="font-bold font-mono text-foreground">{role.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${role.color}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-border flex justify-between text-sm">
              <span className="text-muted-foreground">Total Users</span>
              <span className="font-bold font-mono text-foreground">{metrics.totalUsers.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Viewed Articles */}
      {metrics.topPublications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-1 text-lg font-semibold font-heading text-foreground">Top Viewed Articles</h3>
          <p className="mb-4 text-xs text-muted-foreground">Most viewed publications · Top {Math.min(metrics.topPublications.length, 10)}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium text-right">
                    <span className="flex items-center justify-end gap-1"><Eye className="h-3 w-3" /> Views</span>
                  </th>
                  <th className="pb-3 font-medium text-right">
                    <span className="flex items-center justify-end gap-1"><Download className="h-3 w-3" /> Downloads</span>
                  </th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">
                    <span className="flex items-center justify-end gap-1"><Quote className="h-3 w-3" /> Citations</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {metrics.topPublications.slice(0, 10).map((article, index) => (
                  <tr key={article.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-2 text-muted-foreground font-mono text-xs">{index + 1}</td>
                    <td className="py-3 pr-4 max-w-md">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground line-clamp-2 text-sm leading-tight">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.authors}</p>
                        {article.doi && (
                          <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                            <ExternalLink className="h-2.5 w-2.5" /> {article.doi}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-sm">{article.abstractViews.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-sm">{article.galleyViews.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-sm font-semibold text-primary">{article.totalViews.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-sm">
                      {article.doi ? (
                        <span className={citationsByDoi.has(article.doi) ? 'font-semibold' : 'text-muted-foreground'}>
                          {citationsByDoi.get(article.doi)?.toLocaleString() ?? (citationsLoading ? '…' : '–')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No DOI</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Crossref Citation Metrics */}
      <CitationMetrics
        summary={citationSummary || null}
        isLoading={citationsLoading}
        isError={citationsError}
        error={citationsErrorObj}
        onRefresh={() => refetchCitations()}
        isRefreshing={citationsRefetching}
        compact
      />
    </div>
  );
};

export default JournalDetail;
