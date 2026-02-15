/**
 * Citation Metrics Panel
 * 
 * Displays Crossref citation data: h-index, total citations,
 * top-cited articles, and citation distribution.
 */

import { motion } from "framer-motion";
import { Quote, TrendingUp, Award, BookOpen, ExternalLink, RefreshCw, AlertCircle, Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CitationSummary } from "@/types/crossref";

interface CitationMetricsProps {
  summary: CitationSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
}

const CitationMetrics = ({
  summary,
  isLoading,
  isError,
  error,
  onRefresh,
  isRefreshing,
  compact = false,
}: CitationMetricsProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground">Citation Metrics</h3>
            <p className="text-xs text-muted-foreground">Fetching citation data from Crossref…</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (isError || !summary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-200 bg-amber-50 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {error?.message || 'No articles with DOIs found for citation lookup'}
            </p>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="text-xs text-amber-700 hover:text-amber-900 underline">
              Retry
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Top cited articles for chart
  const chartData = summary.articleCitations
    .filter(a => a.citationCount > 0)
    .slice(0, 8)
    .map(a => ({
      name: a.title.length > 25 ? a.title.slice(0, 25) + '…' : a.title,
      citations: a.citationCount,
      fullTitle: a.title,
      authors: a.authors,
      doi: a.doi,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground flex items-center gap-2">
              <Quote className="h-5 w-5 text-primary" />
              Citation Metrics
              <span className="text-[10px] font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                Crossref
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Citation data from {summary.totalArticlesLookedUp} articles with DOIs
              {summary.lastUpdated && (
                <> · Updated {summary.lastUpdated.toLocaleTimeString()}</>
              )}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Quote}
            label="Total Citations"
            value={summary.totalCitations.toLocaleString()}
            sublabel={`From ${summary.totalArticlesLookedUp} articles`}
          />
          <MetricCard
            icon={Award}
            label="h-Index"
            value={summary.hIndex}
            sublabel="Crossref h-index"
            accent
          />
          <MetricCard
            icon={TrendingUp}
            label="Avg Citations"
            value={summary.avgCitationsPerArticle}
            sublabel="Per article"
          />
          <MetricCard
            icon={BarChart3}
            label="Most Cited"
            value={summary.maxCitations.toLocaleString()}
            sublabel="Single article max"
            accent
          />
        </div>
      </div>

      {!compact && (
        <>
          {/* Citation Distribution Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-base font-semibold font-heading text-foreground mb-1">Top Cited Articles</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Articles ranked by Crossref citation count
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(213 15% 50%)" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    stroke="hsl(213 15% 50%)"
                    width={160}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(214 20% 90%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} citations`, 'Citations']}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload;
                      return item ? `${item.fullTitle}\n${item.authors}` : '';
                    }}
                  />
                  <Bar
                    dataKey="citations"
                    fill="#2A6EBB"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      if (data?.doi) window.open(`https://doi.org/${data.doi}`, '_blank');
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Cited Articles Table */}
          {summary.articleCitations.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-base font-semibold font-heading text-foreground mb-1">Citation Details</h3>
              <p className="text-xs text-muted-foreground mb-4">
                All {summary.articleCitations.length} articles with DOI registrations
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Article</th>
                      <th className="pb-3 font-medium text-center">Year</th>
                      <th className="pb-3 font-medium text-right">Citations</th>
                      <th className="pb-3 font-medium text-right">References</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {summary.articleCitations.map((article, index) => (
                      <tr key={article.doi} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-2 text-muted-foreground font-mono text-xs">{index + 1}</td>
                        <td className="py-3 pr-4 max-w-lg">
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground line-clamp-2 text-sm leading-tight">
                              {article.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{article.authors}</p>
                            <a
                              href={`https://doi.org/${article.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              {article.doi}
                            </a>
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                          {article.year || '—'}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-mono text-sm font-semibold ${
                            article.citationCount > 0 ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {article.citationCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-xs text-muted-foreground">
                          {article.referencesCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

// ============================================
// Sub-component: Metric Card
// ============================================

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
    </div>
  );
}

export default CitationMetrics;
