import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Download, Eye, FileText, Users, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { useAllJournalsMetrics, useOJSConnection } from "@/hooks/useOJSData";
import { KpiCardSkeleton, ConnectionBadge } from "@/components/ui/skeletons";

const Journals = () => {
  const navigate = useNavigate();
  
  // Fetch real data aggregated across all journals
  const { data: allMetrics, isLoading, isRefetching, error, refetch } = useAllJournalsMetrics();
  const { data: ojsConnection } = useOJSConnection();
  
  // Build journal list from real API contexts + per-context metrics
  const journalList = (allMetrics?.contexts || []).map((ctx) => {
    const metrics = allMetrics?.perContextMetrics?.get(ctx.urlPath);
    const name = ctx.name['en_US'] || ctx.name['en'] || Object.values(ctx.name)[0] || ctx.urlPath;
    const acronym = ctx.acronym?.['en_US'] || ctx.acronym?.['en'] || ctx.urlPath.toUpperCase();
    return {
      id: ctx.urlPath,
      name,
      abbr: acronym,
      papers: metrics?.totalPublications || 0,
      abstractViews: metrics?.totalAbstractViews || 0,
      downloads: metrics?.totalDownloads || 0,
      totalUsers: metrics?.totalUsers || 0,
      acceptanceRate: metrics?.acceptanceRate || 0,
      daysToDecision: metrics?.daysToDecision || 0,
      submissionsReceived: metrics?.submissionsReceived || 0,
      enabled: ctx.enabled,
    };
  });

  const isConnected = !!allMetrics && !error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Journals
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isConnected
              ? `Browse and analyze ${journalList.length} journal${journalList.length !== 1 ? 's' : ''} from OJS`
              : 'Browse and analyze individual journal performance'}
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ) : journalList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No journals found. Check your OJS API connection.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {journalList.map((journal, i) => (
            <motion.div
              key={journal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => navigate(`/journals/${journal.id}`)}
              className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{journal.abbr}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <h3 className="mb-3 text-sm font-semibold text-foreground leading-tight">{journal.name}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3 w-3" /> {journal.papers.toLocaleString()} articles
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-3 w-3" /> {journal.abstractViews.toLocaleString()} views
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Download className="h-3 w-3" /> {journal.downloads.toLocaleString()} downloads
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3 w-3" /> {journal.totalUsers.toLocaleString()} users
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" /> {journal.acceptanceRate}% accepted
                </span>
                {journal.daysToDecision > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {journal.daysToDecision}d avg
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Journals;
