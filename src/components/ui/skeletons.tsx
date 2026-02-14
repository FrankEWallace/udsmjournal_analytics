/**
 * Loading Skeleton Components
 * 
 * Skeleton placeholders shown while data is loading
 */

import { motion } from "framer-motion";

/**
 * Skeleton for KPI Card
 */
export const KpiCardSkeleton = ({ accent = false }: { accent?: boolean }) => (
  <div
    className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card ${
      accent ? "border-l-4 border-l-accent" : ""
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg p-2.5 bg-muted animate-pulse">
        <div className="h-5 w-5" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for Chart container
 */
export const ChartSkeleton = ({ height = 320 }: { height?: number }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-card">
    <div className="mb-4 space-y-2">
      <div className="h-5 w-48 rounded bg-muted animate-pulse" />
      <div className="h-3 w-64 rounded bg-muted animate-pulse" />
    </div>
    <div 
      className="flex items-end justify-between gap-2 px-4"
      style={{ height }}
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-muted animate-pulse"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for World Map
 */
export const MapSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-card">
    <div className="mb-2 flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        <div className="h-3 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
    </div>
    <div 
      className="relative rounded-lg bg-secondary/30 overflow-hidden flex items-center justify-center"
      style={{ aspectRatio: "2/1" }}
    >
      <div className="text-muted-foreground text-sm">Loading map...</div>
    </div>
  </div>
);

/**
 * Full Dashboard Skeleton
 */
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <div className="h-7 w-48 rounded bg-muted animate-pulse mb-2" />
      <div className="h-4 w-64 rounded bg-muted animate-pulse" />
    </div>

    {/* Top KPI Row */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton accent />
      <KpiCardSkeleton />
    </div>

    {/* Second KPI Row */}
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton accent />
    </div>

    {/* Map */}
    <MapSkeleton />

    {/* Charts */}
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton height={280} />
    </div>
  </div>
);

/**
 * Error State Component
 */
export const ErrorState = ({ 
  title = "Unable to load data",
  message = "Please check your connection and try again.",
  onRetry,
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
  >
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
      <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    )}
  </motion.div>
);

/**
 * Connection Status Badge
 */
export const ConnectionBadge = ({ 
  connected, 
  label,
  loading = false,
}: { 
  connected: boolean;
  label: string;
  loading?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xs">
    <span className={`h-2 w-2 rounded-full ${
      loading ? "bg-yellow-500 animate-pulse" :
      connected ? "bg-success" : "bg-destructive"
    }`} />
    <span className="text-muted-foreground">{label}</span>
  </div>
);

/**
 * Data freshness indicator
 */
export const DataFreshness = ({ 
  lastUpdated,
  isRefetching = false,
}: { 
  lastUpdated?: Date;
  isRefetching?: boolean;
}) => {
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isRefetching && (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {lastUpdated && <span>Updated {getTimeAgo(lastUpdated)}</span>}
    </div>
  );
};
