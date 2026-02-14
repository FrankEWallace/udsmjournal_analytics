import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { citationTimeline } from "@/lib/mock-data";

const CitationTimeline = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.5 }}
    className="rounded-xl border border-border bg-card p-6 shadow-card"
  >
    <div className="mb-4">
      <h3 className="text-lg font-semibold font-heading text-foreground">Citation Growth Timeline</h3>
      <p className="text-xs text-muted-foreground">Monthly citation trends over the past year</p>
    </div>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={citationTimeline}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(213 15% 50%)" />
        <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }} />
        <Area type="monotone" dataKey="internal" name="Internal" stroke="hsl(209 100% 32%)" fill="hsl(209 100% 32% / 0.15)" strokeWidth={2} />
        <Area type="monotone" dataKey="external" name="External" stroke="hsl(43 85% 55%)" fill="hsl(43 85% 55% / 0.15)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

export default CitationTimeline;
