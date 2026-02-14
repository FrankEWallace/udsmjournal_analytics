import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { journals } from "@/lib/mock-data";
import type { FastStatsPublicationWithStats } from "@/types/fastStats";

interface CitationChartProps {
  data?: FastStatsPublicationWithStats[];
}

// Transform API data to chart format
const transformApiData = (publications: FastStatsPublicationWithStats[]) => {
  return publications.slice(0, 8).map((pub, index) => ({
    name: pub.title.slice(0, 15) + (pub.title.length > 15 ? "..." : ""),
    internal: pub.abstractViews || 0,
    external: pub.fileDownloads || 0,
    id: pub.submissionId || index + 1,
    fullTitle: pub.title,
  }));
};

// Mock data fallback
const mockChartData = journals.slice(0, 8).map((j) => ({
  name: j.abbr,
  internal: j.internalCitations,
  external: j.externalCitations,
  id: j.id,
  fullTitle: j.name,
}));

const CitationChart = ({ data }: CitationChartProps) => {
  const navigate = useNavigate();
  
  // Use API data if available, otherwise use mock
  const chartData = data && data.length > 0 
    ? transformApiData(data) 
    : mockChartData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-heading text-foreground">Citation Distribution by Journal</h3>
        <p className="text-xs text-muted-foreground">Internal vs External citations · Click a journal to drill down</p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} onClick={(data) => {
          if (data?.activePayload?.[0]?.payload?.id) {
            navigate(`/journals/${data.activePayload[0].payload.id}`);
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
          <Tooltip
            contentStyle={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(214 20% 90%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="internal" name="Internal Citations" fill="hsl(209 100% 32%)" radius={[4, 4, 0, 0]} stackId="a" cursor="pointer" />
          <Bar dataKey="external" name="External Citations" fill="hsl(43 85% 55%)" radius={[4, 4, 0, 0]} stackId="a" cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default CitationChart;
