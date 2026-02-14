import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Database, Globe, RefreshCw, Plug } from "lucide-react";

const integrations = [
  { name: "Crossref API", status: "connected", lastSync: "2 minutes ago", icon: Globe },
  { name: "Matomo Analytics", status: "connected", lastSync: "30 seconds ago", icon: Database },
  { name: "Google Scholar", status: "planned", lastSync: "—", icon: Plug },
  { name: "Scopus API", status: "planned", lastSync: "—", icon: Plug },
  { name: "OpenCitations", status: "planned", lastSync: "—", icon: Plug },
];

const SystemSettings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-heading text-foreground">System Settings</h1>
      <p className="text-sm text-muted-foreground">Integration status and data management</p>
    </div>

    {/* Data Freshness */}
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Data Freshness</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-success/10 p-4 text-center">
          <RefreshCw className="mx-auto mb-2 h-6 w-6 text-success" />
          <p className="text-2xl font-bold text-foreground">2 min</p>
          <p className="text-xs text-muted-foreground">Last data sync</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="text-2xl font-bold text-foreground">30 sec</p>
          <p className="text-xs text-muted-foreground">Refresh interval</p>
        </div>
        <div className="rounded-lg bg-accent/15 p-4 text-center">
          <Database className="mx-auto mb-2 h-6 w-6 text-accent" />
          <p className="text-2xl font-bold text-foreground">99.8%</p>
          <p className="text-xs text-muted-foreground">Uptime</p>
        </div>
      </div>
    </motion.div>

    {/* Integrations */}
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 text-lg font-semibold font-heading text-foreground">Integrations</h3>
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${integration.status === "connected" ? "bg-success/10" : "bg-muted"}`}>
                <integration.icon className={`h-4 w-4 ${integration.status === "connected" ? "text-success" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{integration.name}</p>
                <p className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.status === "connected" ? (
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" /> Planned
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default SystemSettings;
