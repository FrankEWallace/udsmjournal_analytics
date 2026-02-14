import { useState } from "react";
import { Bell, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AppHeader = () => {
  const [role, setRole] = useState("admin");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold font-heading text-foreground">
          Research Analytics
        </h2>
        <span className="hidden rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline-block">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Data Freshness */}
        <div className="hidden items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          <span className="text-xs font-medium text-success">Data fresh · 2 min ago</span>
        </div>

        {/* Date Filter */}
        <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs">Last 30 days</span>
        </Button>

        {/* Role Switcher */}
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">System Administrator</SelectItem>
            <SelectItem value="manager">Journal Manager</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
