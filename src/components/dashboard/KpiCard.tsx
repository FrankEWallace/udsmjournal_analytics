import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  accent?: boolean;
  delay?: number;
}

const KpiCard = ({ label, value, icon: Icon, trend, accent, delay = 0 }: KpiCardProps) => {
  const isPositive = trend && trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover ${
        accent ? "border-l-4 border-l-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground animate-count-up">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(trend)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

export default KpiCard;
