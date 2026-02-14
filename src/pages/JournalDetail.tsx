import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Download, GitBranch, ExternalLink, Quote, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from "@/components/dashboard/KpiCard";
import { journals, topArticles, citationTimeline } from "@/lib/mock-data";
import { useFastStatsDashboard } from "@/hooks/useOJSData";
import { KpiCardSkeleton, ConnectionBadge } from "@/components/ui/skeletons";

const JournalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch API data
  const { data: dashboardData, isLoading, isRefetching, error } = useFastStatsDashboard();
  
  // Try to find journal from API data first, then fall back to mock
  const apiJournal = dashboardData?.journals?.find((j) => j.path === id || j.id === Number(id));
  const mockJournal = journals.find((j) => j.id === Number(id) || j.name.toLowerCase().includes(id?.toLowerCase() || ''));
  
  const isUsingMockData = !apiJournal;
  
  // Normalize journal data
  const journal = apiJournal 
    ? {
        id: apiJournal.id,
        name: apiJournal.name,
        abbr: apiJournal.acronym || apiJournal.path?.toUpperCase().slice(0, 4) || 'JNL',
        papers: apiJournal.publishedArticles || 0,
        downloads: (apiJournal.totalAbstractViews || 0) + (apiJournal.totalFileDownloads || 0),
        internalCitations: 0,
        externalCitations: 0,
        growth: 0,
      }
    : mockJournal;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!journal) {
    return <div className="text-center py-12 text-muted-foreground">Journal not found</div>;
  }

  const totalCitations = journal.internalCitations + journal.externalCitations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journals")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
              {journal.name}
              {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground">{journal.abbr} · Detailed Analytics</p>
          </div>
        </div>
        <ConnectionBadge 
          connected={!error && !isUsingMockData} 
          label={isUsingMockData ? "Demo Data" : "Live Data"} 
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Papers" value={journal.papers} icon={BookOpen} delay={0} />
        <KpiCard label="Total Downloads" value={journal.downloads} icon={Download} trend={12.5} delay={0.05} accent />
        <Sheet>
          <SheetTrigger asChild>
            <div className="cursor-pointer">
              <KpiCard label="Total Citations" value={totalCitations} icon={Quote} trend={journal.growth} delay={0.1} />
            </div>
          </SheetTrigger>
          <SheetContent className="w-[460px] sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">Citation Details — {journal.abbr}</SheetTitle>
            </SheetHeader>
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
                <TabsTrigger value="external">External</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="rounded-lg bg-secondary p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Citations</span><span className="font-semibold">{totalCitations}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Internal</span><span className="font-semibold">{journal.internalCitations}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">External</span><span className="font-semibold">{journal.externalCitations}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Growth</span><span className="font-semibold text-success">+{journal.growth}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Confidence Score</span><span className="font-semibold">87%</span></div>
                </div>
              </TabsContent>
              <TabsContent value="internal" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">{journal.internalCitations} citations from within UDSM journals</p>
                <div className="space-y-2">
                  {journals.filter(j => j.id !== journal.id).slice(0, 5).map(j => (
                    <div key={j.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <span className="text-foreground">{j.abbr}</span>
                      <span className="text-muted-foreground">{Math.floor(Math.random() * 50 + 10)} citations</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="external" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">{journal.externalCitations} citations from external sources</p>
                <div className="space-y-2">
                  {["Scopus", "Web of Science", "Google Scholar", "PubMed", "DOAJ"].map(src => (
                    <div key={src} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <span className="text-foreground">{src}</span>
                      <span className="text-muted-foreground">{Math.floor(Math.random() * 200 + 30)} citations</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Internal Citations" value={journal.internalCitations} icon={GitBranch} delay={0.15} />
        <KpiCard label="External Citations" value={journal.externalCitations} icon={ExternalLink} delay={0.2} />
        <KpiCard label="Citation Growth" value={`${journal.growth}%`} icon={TrendingUp} delay={0.25} accent />
      </div>

      {/* Citation Timeline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Citation Growth Timeline</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={citationTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="internal" stroke="hsl(209 100% 32%)" fill="hsl(209 100% 32% / 0.15)" strokeWidth={2} />
            <Area type="monotone" dataKey="external" stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.15)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Cited Articles */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Top Cited Articles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Year</th>
                <th className="pb-3 font-medium text-right">Citations</th>
                <th className="pb-3 font-medium text-right">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topArticles.map((article) => (
                <tr key={article.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-4 text-foreground">{article.title}</td>
                  <td className="py-3 text-muted-foreground">{article.year}</td>
                  <td className="py-3 text-right font-medium text-foreground">{article.citations}</td>
                  <td className="py-3 text-right text-muted-foreground">{article.downloads.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default JournalDetail;
