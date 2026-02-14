import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { OJSTimelineItem } from "@/types/ojs";

interface CitationTimelineProps {
  abstractData?: OJSTimelineItem[];
  galleyData?: OJSTimelineItem[];
}

// Merge abstract + galley timelines into a single dataset
const mergeTimelines = (abstractData: OJSTimelineItem[], galleyData: OJSTimelineItem[]) => {
  const galleyMap = new Map(galleyData.map(g => [g.date, g.value]));
  return abstractData.map(item => ({
    month: new Date(item.date).toLocaleString('default', { month: 'short', year: '2-digit' }),
    abstractViews: item.value,
    downloads: galleyMap.get(item.date) || 0,
  }));
};

const CitationTimeline = ({ abstractData, galleyData }: CitationTimelineProps) => {
  const hasData = abstractData && abstractData.length > 0;
  const chartData = hasData
    ? mergeTimelines(abstractData, galleyData || [])
    : [];

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl border border-border bg-card p-6 shadow-card flex items-center justify-center h-[400px]"
      >
        <p className="text-muted-foreground text-sm">No timeline data available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-heading text-foreground">Views Timeline</h3>
        <p className="text-xs text-muted-foreground">Monthly abstract views and file downloads over time</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
          <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area type="monotone" dataKey="abstractViews" name="Abstract Views" stroke="hsl(209 100% 32%)" fill="hsl(209 100% 32% / 0.15)" strokeWidth={2} />
          <Area type="monotone" dataKey="downloads" name="Downloads" stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.15)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default CitationTimeline;
