import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllJournalsMetrics, useOJSConnection } from "@/hooks/useOJSData";
import { ChartSkeleton, ConnectionBadge } from "@/components/ui/skeletons";
import {
  RefreshCw, FileText, Eye, Download, Users, CheckCircle, XCircle,
  Clock, BookOpen, TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import type { DashboardMetrics } from "@/types/ojs";

// Helper: get a metrics value or 0
const m = (metrics: DashboardMetrics | undefined, key: keyof DashboardMetrics): number => {
  if (!metrics) return 0;
  const v = metrics[key];
  return typeof v === 'number' ? v : 0;
};

// Comparison indicator
const CompareIndicator = ({ a, b }: { a: number; b: number }) => {
  if (a === b) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (a > b) return <ArrowUpRight className="h-3 w-3 text-emerald-500" />;
  return <ArrowDownRight className="h-3 w-3 text-red-500" />;
};

const Comparison = () => {
  // Fetch all journals metrics from OJS API
  const { data: allMetrics, isLoading, isRefetching, error, refetch } = useAllJournalsMetrics();
  const { data: ojsConnection } = useOJSConnection();

  // Build selectable journal list from real contexts
  const journalList = useMemo(() => {
    return (allMetrics?.contexts || []).map((ctx) => {
      const name = ctx.name['en_US'] || ctx.name['en'] || Object.values(ctx.name)[0] || ctx.urlPath;
      const acronym = ctx.acronym?.['en_US'] || ctx.acronym?.['en'] || ctx.urlPath.toUpperCase();
      return { id: ctx.urlPath, name, abbr: acronym };
    });
  }, [allMetrics]);

  const isConnected = !!allMetrics && !error;

  const [journalA, setJournalA] = useState<string>("");
  const [journalB, setJournalB] = useState<string>("");

  const effectiveA = journalA || journalList[0]?.id || "";
  const effectiveB = journalB || journalList[1]?.id || journalList[0]?.id || "";

  const infoA = journalList.find((j) => j.id === effectiveA);
  const infoB = journalList.find((j) => j.id === effectiveB);
  const metricsA = allMetrics?.perContextMetrics?.get(effectiveA);
  const metricsB = allMetrics?.perContextMetrics?.get(effectiveB);

  const abbrA = infoA?.abbr || effectiveA.toUpperCase();
  const abbrB = infoB?.abbr || effectiveB.toUpperCase();

  // ---- Bar Chart Data: key metrics comparison ----
  const barData = infoA && infoB ? [
    { metric: "Articles", [abbrA]: m(metricsA, 'totalPublications'), [abbrB]: m(metricsB, 'totalPublications') },
    { metric: "Abstract Views", [abbrA]: m(metricsA, 'totalAbstractViews'), [abbrB]: m(metricsB, 'totalAbstractViews') },
    { metric: "Downloads", [abbrA]: m(metricsA, 'totalDownloads'), [abbrB]: m(metricsB, 'totalDownloads') },
    { metric: "Users", [abbrA]: m(metricsA, 'totalUsers'), [abbrB]: m(metricsB, 'totalUsers') },
    { metric: "Submissions", [abbrA]: m(metricsA, 'submissionsReceived'), [abbrB]: m(metricsB, 'submissionsReceived') },
  ] : [];

  // ---- Radar Chart Data: normalized editorial metrics ----
  const radarData = useMemo(() => {
    if (!metricsA && !metricsB) return [];
    const fields: { key: keyof DashboardMetrics; label: string }[] = [
      { key: 'totalPublications', label: 'Publications' },
      { key: 'totalAbstractViews', label: 'Views' },
      { key: 'totalDownloads', label: 'Downloads' },
      { key: 'acceptanceRate', label: 'Accept Rate' },
      { key: 'totalUsers', label: 'Users' },
      { key: 'submissionsReceived', label: 'Submissions' },
    ];
    return fields.map(({ key, label }) => {
      const valA = m(metricsA, key);
      const valB = m(metricsB, key);
      const maxVal = Math.max(valA, valB, 1);
      return {
        metric: label,
        [abbrA]: Math.round((valA / maxVal) * 100),
        [abbrB]: Math.round((valB / maxVal) * 100),
      };
    });
  }, [metricsA, metricsB, abbrA, abbrB]);

  // ---- Timeline merge: views over time ----
  const timelineData = useMemo(() => {
    const tA = metricsA?.abstractViewsTimeline || [];
    const tB = metricsB?.abstractViewsTimeline || [];
    const dateMap = new Map<string, { date: string; [k: string]: number | string }>();

    tA.forEach(item => {
      const label = new Date(item.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      const entry = dateMap.get(item.date) || { date: label };
      entry[abbrA] = item.value;
      dateMap.set(item.date, entry);
    });
    tB.forEach(item => {
      const label = new Date(item.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      const entry = dateMap.get(item.date) || { date: label };
      entry[abbrB] = item.value;
      dateMap.set(item.date, entry);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [metricsA, metricsB, abbrA, abbrB]);

  // ---- Detail rows for side-by-side stats ----
  const detailRows: { label: string; icon: React.ElementType; keyA: number; keyB: number; format?: (v: number) => string }[] = infoA && infoB ? [
    { label: "Published Articles", icon: FileText, keyA: m(metricsA, 'totalPublications'), keyB: m(metricsB, 'totalPublications') },
    { label: "Abstract Views", icon: Eye, keyA: m(metricsA, 'totalAbstractViews'), keyB: m(metricsB, 'totalAbstractViews') },
    { label: "File Downloads", icon: Download, keyA: m(metricsA, 'totalDownloads'), keyB: m(metricsB, 'totalDownloads') },
    { label: "Total Views", icon: TrendingUp, keyA: m(metricsA, 'totalViews'), keyB: m(metricsB, 'totalViews') },
    { label: "Total Users", icon: Users, keyA: m(metricsA, 'totalUsers'), keyB: m(metricsB, 'totalUsers') },
    { label: "Authors", icon: Users, keyA: m(metricsA, 'totalAuthors'), keyB: m(metricsB, 'totalAuthors') },
    { label: "Reviewers", icon: Users, keyA: m(metricsA, 'totalReviewers'), keyB: m(metricsB, 'totalReviewers') },
    { label: "Submissions Received", icon: BookOpen, keyA: m(metricsA, 'submissionsReceived'), keyB: m(metricsB, 'submissionsReceived') },
    { label: "Accepted", icon: CheckCircle, keyA: m(metricsA, 'submissionsAccepted'), keyB: m(metricsB, 'submissionsAccepted') },
    { label: "Declined", icon: XCircle, keyA: m(metricsA, 'submissionsDeclined'), keyB: m(metricsB, 'submissionsDeclined') },
    { label: "Acceptance Rate", icon: CheckCircle, keyA: m(metricsA, 'acceptanceRate'), keyB: m(metricsB, 'acceptanceRate'), format: (v) => `${v}%` },
    { label: "Rejection Rate", icon: XCircle, keyA: m(metricsA, 'rejectionRate'), keyB: m(metricsB, 'rejectionRate'), format: (v) => `${v}%` },
    { label: "Avg Days to Decision", icon: Clock, keyA: m(metricsA, 'daysToDecision'), keyB: m(metricsB, 'daysToDecision') },
    { label: "Avg Days to Accept", icon: Clock, keyA: m(metricsA, 'daysToAccept'), keyB: m(metricsB, 'daysToAccept') },
    { label: "Avg Days to Reject", icon: Clock, keyA: m(metricsA, 'daysToReject'), keyB: m(metricsB, 'daysToReject') },
  ] : [];

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Journal Comparison
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isConnected
              ? `Compare metrics between ${journalList.length} journals side-by-side`
              : 'Compare metrics between journals side-by-side'}
          </p>
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
            label={isConnected ? "OJS Live" : "OJS"}
            loading={!ojsConnection}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error.message || 'Failed to fetch journal data from OJS API'}</p>
        </div>
      )}

      {/* Journal Selectors */}
      {journalList.length < 2 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Need at least 2 journals in OJS to compare.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(209_100%_32%)]" /> Journal A
              </label>
              <Select value={effectiveA} onValueChange={setJournalA}>
                <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {journalList.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(43_85%_55%)]" /> Journal B
              </label>
              <Select value={effectiveB} onValueChange={setJournalB}>
                <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {journalList.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bar Chart: Key Metrics */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold font-heading text-foreground">Key Metrics Comparison</h3>
              <p className="text-xs text-muted-foreground">Side-by-side bar chart of core journal statistics</p>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey={abbrA} fill="#2A6EBB" radius={[4, 4, 0, 0]} />
                <Bar dataKey={abbrB} fill="hsl(43 85% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Radar + Timeline row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold font-heading text-foreground">Performance Profile</h3>
                <p className="text-xs text-muted-foreground">Normalized comparison across dimensions (0–100 scale)</p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(214 20% 90%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(213 15% 50%)" />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} stroke="hsl(213 15% 50%)" />
                  <Radar name={abbrA} dataKey={abbrA} stroke="#2A6EBB" fill="rgba(42,110,187,0.2)" strokeWidth={2} />
                  <Radar name={abbrB} dataKey={abbrB} stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.2)" strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Views Timeline */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold font-heading text-foreground">Abstract Views Over Time</h3>
                <p className="text-xs text-muted-foreground">Monthly abstract views comparison</p>
              </div>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(213 15% 50%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(213 15% 50%)" />
                    <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area type="monotone" dataKey={abbrA} stroke="#2A6EBB" fill="rgba(42,110,187,0.12)" strokeWidth={2} />
                    <Area type="monotone" dataKey={abbrB} stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.12)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">
                  No timeline data available
                </div>
              )}
            </motion.div>
          </div>

          {/* Detailed Side-by-side comparison table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold font-heading text-foreground">Detailed Metrics Comparison</h3>
              <p className="text-xs text-muted-foreground">Full side-by-side breakdown of all available metrics</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Metric</th>
                    <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wide" style={{ color: "#2A6EBB" }}>
                      {infoA?.abbr || '—'}
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-10"></th>
                    <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(43 85% 45%)" }}>
                      {infoB?.abbr || '—'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => {
                    const Icon = row.icon;
                    const fmtA = row.format ? row.format(row.keyA) : row.keyA.toLocaleString();
                    const fmtB = row.format ? row.format(row.keyB) : row.keyB.toLocaleString();
                    return (
                      <tr key={row.label} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-2 text-foreground">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.label}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-semibold ${row.keyA >= row.keyB ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {fmtA}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <CompareIndicator a={row.keyA} b={row.keyB} />
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-semibold ${row.keyB >= row.keyA ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {fmtB}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Top Articles comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            {[{ info: infoA, metrics: metricsA, color: "#2A6EBB" }, { info: infoB, metrics: metricsB, color: "hsl(43 85% 55%)" }].map(({ info, metrics, color }, idx) => (
              <motion.div
                key={info?.id || idx}
                initial={{ opacity: 0, x: idx === 0 ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-semibold font-heading text-foreground">{info?.name || '—'}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Top 5 most viewed articles</p>
                <div className="space-y-2">
                  {(metrics?.topPublications || []).slice(0, 5).map((pub, i) => (
                    <div key={pub.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5 w-4">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{pub.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pub.authors}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-semibold text-foreground">{pub.totalViews.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                  {(!metrics?.topPublications || metrics.topPublications.length === 0) && (
                    <p className="text-xs text-muted-foreground py-4 text-center">No publication data</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Comparison;
