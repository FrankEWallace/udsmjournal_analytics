import { BookOpen, Download, FileText, GitBranch, Quote, TrendingUp, ExternalLink } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import WorldMap from "@/components/dashboard/WorldMap";
import CitationChart from "@/components/dashboard/CitationChart";
import CitationTimeline from "@/components/dashboard/CitationTimeline";
import { getAggregatedStats } from "@/lib/mock-data";

const Dashboard = () => {
  const stats = getAggregatedStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">System Overview</h1>
        <p className="text-sm text-muted-foreground">Aggregated analytics across all {stats.totalJournals} UDSM journals</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Journals" value={stats.totalJournals} icon={BookOpen} trend={4.0} delay={0} />
        <KpiCard label="Published Papers" value={stats.totalPapers} icon={FileText} trend={8.2} delay={0.05} />
        <KpiCard label="Total Downloads" value={stats.totalDownloads} icon={Download} trend={12.5} delay={0.1} accent />
        <KpiCard label="Total Citations" value={stats.totalCitations} icon={Quote} trend={stats.avgGrowth} delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Internal Citations" value={stats.totalInternal} icon={GitBranch} trend={9.8} delay={0.2} />
        <KpiCard label="External Citations" value={stats.totalExternal} icon={ExternalLink} trend={7.4} delay={0.25} />
        <KpiCard label="Citation Growth" value={`${stats.avgGrowth}%`} icon={TrendingUp} delay={0.3} accent />
      </div>

      {/* World Map */}
      <WorldMap />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CitationChart />
        <CitationTimeline />
      </div>
    </div>
  );
};

export default Dashboard;
