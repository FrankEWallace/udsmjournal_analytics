import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Download, Eye, Zap, RefreshCw, Globe, Clock, MousePointerClick, Users, Monitor, Smartphone, Tablet, ArrowUpRight, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import KpiCard from "@/components/dashboard/KpiCard";
import InteractiveWorldMap from "@/components/dashboard/InteractiveWorldMap";
import {
  useMatomoLiveCounters,
  useMatomoRealtime,
  useMatomoSummary,
  useMatomoVisitors,
  useMatomoCountries,
  useMatomoTopPages,
  useMatomoVisitsOverTime,
  useMatomoBrowsers,
  useMatomoDeviceTypes,
  useMatomoReferrerTypes,
  useMatomoConnection,
} from "@/hooks/useMatomoData";
import { KpiCardSkeleton, ConnectionBadge, DataFreshness } from "@/components/ui/skeletons";

const COLORS = [
  "#2A6EBB",
  "hsl(43, 85%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(340, 75%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(25, 85%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(0, 70%, 55%)",
];

type TimePeriod = "today" | "yesterday" | "month";

const LiveEngagement = () => {
  const [period, setPeriod] = useState<TimePeriod>("today");
  
  const matomoPeriod = "day";
  const matomoDate = period === "month" ? "today" : period;
  const summaryPeriod = period === "month" ? "month" : "day";

  // Live data (always real-time)
  const { data: liveCounters, isLoading: isLoadingCounters, isRefetching: isRefetchingCounters } = useMatomoLiveCounters();
  const { data: realtimeData, isRefetching: isRefetchingRealtime } = useMatomoRealtime();
  
  // Period-based data
  const { data: summary, isLoading: isLoadingSummary } = useMatomoSummary(summaryPeriod, matomoDate);
  const { data: visitors, isLoading: isLoadingVisitors } = useMatomoVisitors(20);
  const { data: countries } = useMatomoCountries(summaryPeriod, matomoDate);
  const { data: topPages } = useMatomoTopPages(summaryPeriod, matomoDate, 15);
  const { data: visitsOverTime } = useMatomoVisitsOverTime("day", "last30");
  const { data: browsers } = useMatomoBrowsers(summaryPeriod, matomoDate);
  const { data: deviceTypes } = useMatomoDeviceTypes(summaryPeriod, matomoDate);
  const { data: referrerTypes } = useMatomoReferrerTypes(summaryPeriod, matomoDate);
  const { data: connection } = useMatomoConnection();
  
  const isLoading = isLoadingCounters || isLoadingSummary;
  const isRefetching = isRefetchingCounters || isRefetchingRealtime;
  
  const activeVisitors = liveCounters?.visitors || 0;
  const actionsLast30Min = liveCounters?.actions || 0;
  const visitsLast30Min = liveCounters?.visits || 0;
  
  const isConnected = connection?.connected || false;

  // Transform visits over time for chart
  const visitsChartData = visitsOverTime
    ? Object.entries(visitsOverTime)
        .map(([date, visits]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          visits: typeof visits === "number" ? visits : 0,
        }))
        .filter((_, i, arr) => arr.length <= 30)
    : [];

  // Transform browsers for pie chart
  const browserChartData = browsers
    ?.filter(b => b.nb_visits > 0)
    .map(b => ({
      name: b.label,
      value: b.nb_visits,
    })) || [];

  // Transform device types for pie chart
  const deviceChartData = deviceTypes
    ?.filter(d => d.nb_visits > 0)
    .map(d => ({
      name: d.label,
      value: d.nb_visits,
    })) || [];

  // Transform referrers for chart
  const referrerChartData = referrerTypes
    ?.filter(r => r.nb_visits > 0)
    .map(r => ({
      name: r.label,
      visits: r.nb_visits,
      actions: r.nb_actions,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Live Engagement
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-medium text-success">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["today", "yesterday", "month"] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                  period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "month" ? "This Month" : p}
              </button>
            ))}
          </div>
          <ConnectionBadge connected={isConnected} label="Matomo" loading={!connection} />
        </div>
      </div>

      {/* Live KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Real-time row (always live, independent of period) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Active Now" value={activeVisitors} icon={Eye} delay={0} accent />
            <KpiCard label="Actions (30 min)" value={actionsLast30Min} icon={MousePointerClick} delay={0.05} />
            <KpiCard label="Visits (30 min)" value={visitsLast30Min} icon={Activity} delay={0.1} />
            <KpiCard
              label="Avg Time on Site"
              value={summary ? `${Math.floor((summary.avg_time_on_site || 0) / 60)}m ${(summary.avg_time_on_site || 0) % 60}s` : "0s"}
              icon={Clock}
              delay={0.15}
            />
          </div>

          {/* Period-based summary row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={`Unique Visitors (${period === "month" ? "Month" : period === "yesterday" ? "Yesterday" : "Today"})`}
              value={summary?.nb_uniq_visitors || 0}
              icon={Users}
              delay={0.2}
            />
            <KpiCard
              label="Total Page Views"
              value={summary?.nb_actions || 0}
              icon={Eye}
              delay={0.25}
              accent
            />
            <KpiCard
              label="Bounce Rate"
              value={summary?.bounce_rate || "0%"}
              icon={ArrowUpRight}
              delay={0.3}
            />
            <KpiCard
              label="Actions / Visit"
              value={summary?.nb_actions_per_visit?.toFixed(1) || "0"}
              icon={Zap}
              delay={0.35}
            />
          </div>
        </>
      )}

      {/* Live World Map */}
      <InteractiveWorldMap
        title="Real-Time Global Activity"
        subtitle="Live reader engagement across the world"
        showToggle={true}
        animated
      />

      {/* Visits Over Time + Country breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Visits Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold font-heading text-foreground">Visits Trend</h3>
            <p className="text-xs text-muted-foreground">Daily visits over the last 30 days</p>
          </div>
          {visitsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={visitsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(213 15% 50%)" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="visits" name="Visits" stroke="#2A6EBB" fill="rgba(42,110,187,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No visit data available</div>
          )}
        </motion.div>

        {/* Country Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold font-heading text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Visitors by Country
            </h3>
            <p className="text-xs text-muted-foreground">Geographic distribution of readers</p>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {countries && countries.length > 0 ? (
              countries.map((country, i) => {
                const maxVisits = Math.max(...countries.map(c => c.nb_visits), 1);
                const pct = (country.nb_visits / maxVisits) * 100;
                return (
                  <div key={country.code || i} className="flex items-center gap-3 py-1.5">
                    <span className="text-lg">{countryFlag(country.code)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{country.label}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{country.nb_visits} visits</span>
                          <span>·</span>
                          <span>{country.nb_actions} actions</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No country data available</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Browser & Device breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Browser Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground mb-1">Browsers</h3>
          <p className="text-xs text-muted-foreground mb-4">Visitor browser breakdown</p>
          {browserChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={browserChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {browserChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
          )}
        </motion.div>

        {/* Device Types Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground mb-1 flex items-center gap-2">
            Devices
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Desktop vs Mobile vs Tablet</p>
          {deviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deviceChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {deviceChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
          )}
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground mb-1">Traffic Sources</h3>
          <p className="text-xs text-muted-foreground mb-4">How visitors find the journals</p>
          {referrerChartData.length > 0 ? (
            <div className="space-y-3">
              {referrerChartData.map((ref, i) => {
                const maxVal = Math.max(...referrerChartData.map(r => r.visits), 1);
                return (
                  <div key={ref.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{ref.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{ref.visits} visits</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(ref.visits / maxVal) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>
          )}
        </motion.div>
      </div>

      {/* Top Pages & Recent Visitors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground mb-1">Top Pages</h3>
          <p className="text-xs text-muted-foreground mb-4">Most visited pages on the journals</p>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {topPages && topPages.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Page</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Visits</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hits</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 15).map((page, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-2 px-1 max-w-[250px]">
                        <p className="text-foreground truncate text-xs font-medium" title={page.label}>
                          {cleanPageLabel(page.label)}
                        </p>
                      </td>
                      <td className="py-2 px-1 text-right font-mono text-xs">{page.nb_visits}</td>
                      <td className="py-2 px-1 text-right font-mono text-xs">{page.nb_hits}</td>
                      <td className="py-2 px-1 text-right font-mono text-xs">{Math.round(page.avg_time_on_page || 0)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No page data available</div>
            )}
          </div>
        </motion.div>

        {/* Recent Visitors Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold font-heading text-foreground">Recent Visitors</h3>
              <p className="text-xs text-muted-foreground">Latest visitor activity feed</p>
            </div>
            {isRefetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Refreshing..." />
            )}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {visitors && visitors.length > 0 ? (
              visitors.map((visitor, i) => (
                <div
                  key={visitor.idVisit || i}
                  className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">{countryFlag(visitor.countryCode)}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {visitor.city || visitor.country || "Unknown"}
                        {visitor.country && visitor.city ? `, ${visitor.country}` : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {visitor.lastActionDateTime ? formatVisitTime(visitor.lastActionDateTime) : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {visitor.browser && (
                        <span className="inline-flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded">
                          {visitor.browser}
                        </span>
                      )}
                      {visitor.operatingSystem && (
                        <span className="inline-flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded">
                          {visitor.operatingSystem}
                        </span>
                      )}
                      {visitor.deviceType && (
                        <span className="inline-flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded">
                          {deviceIcon(visitor.deviceType)} {visitor.deviceType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{visitor.actions || 0} actions</span>
                      <span>·</span>
                      <span>{visitor.visitDurationPretty || "0s"}</span>
                      {visitor.referrerName && (
                        <>
                          <span>·</span>
                          <span>from {visitor.referrerName || "direct"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                {isLoadingVisitors ? "Loading visitors..." : "No recent visitors"}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Helper: clean page URL label for display
function cleanPageLabel(label: string): string {
  return label
    .replace(/^\/journals_multiple/, "")
    .replace(/^\/index\.php/, "")
    .replace(/^\//, "")
    || "/";
}

// Helper: format visit time
function formatVisitTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

// Helper: country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Helper: device type to icon
function deviceIcon(type: string): string {
  switch (type?.toLowerCase()) {
    case "desktop": return "🖥️";
    case "smartphone": return "📱";
    case "tablet": return "📱";
    case "phablet": return "📱";
    default: return "💻";
  }
}

export default LiveEngagement;
