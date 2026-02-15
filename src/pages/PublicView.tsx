import { motion } from "framer-motion";
import { BookOpen, Download, Quote, GitBranch, ExternalLink, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import KpiCard from "@/components/dashboard/KpiCard";
import { journals, topArticles, citationTimeline } from "@/lib/mock-data";

const PublicView = () => {
  const journal = journals[0]; // Example: TJS
  const totalCitations = journal.internalCitations + journal.externalCitations;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Journal Metrics</h1>
        <p className="text-sm text-muted-foreground">Public view · {journal.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Papers" value={journal.papers} icon={BookOpen} delay={0} />
        <KpiCard label="Total Downloads" value={journal.downloads} icon={Download} delay={0.05} accent />
        <KpiCard label="Total Citations" value={totalCitations} icon={Quote} trend={journal.growth} delay={0.1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Internal Citations" value={journal.internalCitations} icon={GitBranch} delay={0.15} />
        <KpiCard label="External Citations" value={journal.externalCitations} icon={ExternalLink} delay={0.2} />
      </div>

      {/* Citation Trend */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Citation Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={citationTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
            <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="internal" stroke="#2A6EBB" fill="rgba(42,110,187,0.15)" strokeWidth={2} />
            <Area type="monotone" dataKey="external" stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.15)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top 5 Cited Articles */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Top 5 Cited Articles</h3>
        <div className="space-y-3">
          {topArticles.map((article, i) => (
            <div key={article.id} className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{article.title}</p>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>{article.citations} citations</span>
                  <span>{article.downloads.toLocaleString()} downloads</span>
                  <span>{article.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PublicView;
