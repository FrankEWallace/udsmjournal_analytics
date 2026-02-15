import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TopPublication } from "@/types/ojs";

interface CitationChartProps {
  data?: TopPublication[];
}

// Transform API data to chart format
const transformApiData = (publications: TopPublication[]) => {
  return publications.slice(0, 8).map((pub) => ({
    name: pub.title.length > 20 ? pub.title.slice(0, 20) + "…" : pub.title,
    abstractViews: pub.abstractViews || 0,
    downloads: pub.galleyViews || 0,
    id: pub.submissionId,
    fullTitle: pub.title,
    authors: pub.authors,
  }));
};

const CitationChart = ({ data }: CitationChartProps) => {
  const chartData = data && data.length > 0 ? transformApiData(data) : [];

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-6 shadow-card flex items-center justify-center h-[400px]"
      >
        <p className="text-muted-foreground text-sm">No publication data available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-heading text-foreground">Top Publications by Views</h3>
        <p className="text-xs text-muted-foreground">Abstract views vs file downloads · Top 8 articles</p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(213 15% 50%)" interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
          <Tooltip
            contentStyle={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(214 20% 90%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${item.fullTitle}\nby ${item.authors}` : '';
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="abstractViews" name="Abstract Views" fill="#2A6EBB" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="downloads" name="Downloads" fill="hsl(43 85% 55%)" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default CitationChart;
