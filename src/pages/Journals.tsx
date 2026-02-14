import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Download, GitBranch, ExternalLink, RefreshCw } from "lucide-react";
import { journals } from "@/lib/mock-data";
import { useFastStatsDashboard } from "@/hooks/useOJSData";
import { KpiCardSkeleton, ConnectionBadge } from "@/components/ui/skeletons";

const Journals = () => {
  const navigate = useNavigate();
  
  // Fetch real journal data from Fast Stats API
  const { data: dashboardData, isLoading, isRefetching, error } = useFastStatsDashboard();
  
  // Transform API data or fall back to mock data
  const journalList = dashboardData?.journals && dashboardData.journals.length > 0
    ? dashboardData.journals.map((j, idx) => ({
        id: j.path || `journal-${idx + 1}`,
        name: j.name,
        abbr: j.acronym || j.path?.toUpperCase().slice(0, 4) || `J${idx + 1}`,
        papers: j.publishedArticles || 0,
        downloads: (j.totalAbstractViews || 0) + (j.totalFileDownloads || 0),
        internalCitations: 0, // Not available in FastStatsJournalStats
        externalCitations: 0, // Not available in FastStatsJournalStats  
        growth: 0, // Not available in FastStatsJournalStats
      }))
    : journals;
  
  const isUsingMockData = !dashboardData?.journals || dashboardData.journals.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Journals
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">Browse and analyze individual journal performance</p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge 
            connected={!error && !isUsingMockData} 
            label={isUsingMockData ? "Demo Mode" : "API Connected"} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
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
                  <BookOpen className="h-3 w-3" /> {journal.papers} papers
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Download className="h-3 w-3" /> {journal.downloads.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GitBranch className="h-3 w-3" /> {journal.internalCitations} internal
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ExternalLink className="h-3 w-3" /> {journal.externalCitations} external
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-success">
                <span>+{journal.growth}% growth</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Journals;
