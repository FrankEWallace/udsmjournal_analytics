import { useState } from "react";
import { Bell, Calendar, ChevronDown, RefreshCw, Search } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold font-heading text-foreground">
          Research Analytics
        </h2>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider sm:inline-block">
          OJS Plugin
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Data Freshness */}
        <div className="hidden items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-700">Live</span>
        </div>

        {/* Date Filter */}
        <Button variant="outline" size="sm" className="hidden gap-1.5 border-border text-xs sm:flex h-8">
          <Calendar className="h-3 w-3" />
          <span>Last 30 days</span>
        </Button>

        {/* Role Switcher */}
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[160px] text-xs h-8 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">System Admin</SelectItem>
            <SelectItem value="manager">Journal Manager</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-primary">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
