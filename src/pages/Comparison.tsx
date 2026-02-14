import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { journals } from "@/lib/mock-data";
import { useFastStatsDashboard } from "@/hooks/useOJSData";
import { ChartSkeleton, ConnectionBadge } from "@/components/ui/skeletons";
import { RefreshCw } from "lucide-react";

const Comparison = () => {
  // Fetch API data
  const { data: dashboardData, isLoading, isRefetching, error } = useFastStatsDashboard();
  
  // Transform API journals or use mock data
  const journalList = useMemo(() => {
    if (dashboardData?.journals && dashboardData.journals.length > 0) {
      return dashboardData.journals.map((j, idx) => ({
        id: j.id || idx + 1,
        name: j.name,
        abbr: j.acronym || j.path?.toUpperCase().slice(0, 4) || `J${idx + 1}`,
        papers: j.publishedArticles || 0,
        downloads: (j.totalAbstractViews || 0) + (j.totalFileDownloads || 0),
        internalCitations: 0,
        externalCitations: 0,
        growth: 0,
      }));
    }
    return journals;
  }, [dashboardData]);
  
  const isUsingMockData = !dashboardData?.journals || dashboardData.journals.length === 0;
  
  const [journalA, setJournalA] = useState<string>("");
  const [journalB, setJournalB] = useState<string>("");
  
  // Set defaults when data loads
  const effectiveJournalA = journalA || journalList[0]?.id.toString();
  const effectiveJournalB = journalB || journalList[1]?.id.toString();

  const a = journalList.find((j) => j.id.toString() === effectiveJournalA) || journalList[0];
  const b = journalList.find((j) => j.id.toString() === effectiveJournalB) || journalList[1];

  const compData = a && b ? [
    { metric: "Papers", [a.abbr]: a.papers, [b.abbr]: b.papers },
    { metric: "Downloads", [a.abbr]: a.downloads / 100, [b.abbr]: b.downloads / 100 },
    { metric: "Internal Cit.", [a.abbr]: a.internalCitations, [b.abbr]: b.internalCitations },
    { metric: "External Cit.", [a.abbr]: a.externalCitations, [b.abbr]: b.externalCitations },
    { metric: "Growth %", [a.abbr]: a.growth * 10, [b.abbr]: b.growth * 10 },
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <ChartSkeleton />
      </div>
    );
  }

  if (!a || !b) {
    return <div className="text-center py-12 text-muted-foreground">Not enough journals to compare</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            Journal Comparison
            {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">Compare metrics between journals side-by-side</p>
        </div>
        <ConnectionBadge 
          connected={!error && !isUsingMockData} 
          label={isUsingMockData ? "Demo Data" : "Live Data"} 
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Journal A</label>
          <Select value={effectiveJournalA} onValueChange={setJournalA}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {journalList.map((j) => <SelectItem key={j.id} value={j.id.toString()}>{j.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Journal B</label>
          <Select value={effectiveJournalB} onValueChange={setJournalB}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {journalList.map((j) => <SelectItem key={j.id} value={j.id.toString()}>{j.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={compData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
            <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey={a.abbr} fill="hsl(209 100% 32%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey={b.abbr} fill="hsl(43 85% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Side-by-side stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[a, b].map((j, idx) => (
          <motion.div key={j.id} initial={{ opacity: 0, x: idx === 0 ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">{j.name}</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Papers", j.papers],
                ["Downloads", j.downloads.toLocaleString()],
                ["Internal Citations", j.internalCitations],
                ["External Citations", j.externalCitations],
                ["Growth", `+${j.growth}%`],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Comparison;
