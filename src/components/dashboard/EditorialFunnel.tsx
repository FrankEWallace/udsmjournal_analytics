import { motion } from "framer-motion";
import { FileInput, CheckCircle, XCircle, BookOpen, Clock, Loader2 } from "lucide-react";

interface EditorialFunnelProps {
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  submissionsInProgress: number;
  submissionsPublished?: number;
  acceptanceRate: number;
  rejectionRate: number;
  daysToDecision: number;
  daysToAccept: number;
  daysToReject: number;
}

const EditorialFunnel = ({
  submissionsReceived,
  submissionsAccepted,
  submissionsDeclined,
  submissionsInProgress,
  submissionsPublished,
  acceptanceRate,
  rejectionRate,
  daysToDecision,
  daysToAccept,
  daysToReject,
}: EditorialFunnelProps) => {
  const stages = [
    {
      label: "Received",
      value: submissionsReceived,
      icon: FileInput,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "In Progress",
      value: submissionsInProgress,
      icon: Loader2,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Accepted",
      value: submissionsAccepted,
      icon: CheckCircle,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Declined",
      value: submissionsDeclined,
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (submissionsPublished !== undefined) {
    stages.push({
      label: "Published",
      value: submissionsPublished,
      icon: BookOpen,
      color: "bg-primary",
      textColor: "text-primary",
      bgColor: "bg-primary/5",
    });
  }

  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold font-heading text-foreground">Editorial Pipeline</h3>
        <p className="text-xs text-muted-foreground">Submission workflow overview · All time</p>
      </div>

      {/* Funnel bars */}
      <div className="space-y-3 mb-6">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const widthPct = Math.max((stage.value / maxVal) * 100, 8);
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <div className={`rounded-lg p-1.5 ${stage.bgColor}`}>
                <Icon className={`h-4 w-4 ${stage.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{stage.label}</span>
                  <span className="text-sm font-bold font-mono text-foreground">{stage.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${stage.color}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Acceptance Rate</p>
          <p className="text-lg font-bold text-emerald-600">{acceptanceRate}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Rejection Rate</p>
          <p className="text-lg font-bold text-red-500">{rejectionRate}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Avg Decision
          </p>
          <p className="text-lg font-bold text-foreground">{daysToDecision}d</p>
        </div>
      </div>

      {/* Turnaround detail */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          <span className="text-muted-foreground">Avg. days to accept:</span>
          <span className="font-semibold font-mono text-foreground">{daysToAccept}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-muted-foreground">Avg. days to reject:</span>
          <span className="font-semibold font-mono text-foreground">{daysToReject}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EditorialFunnel;
