import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GitCompare,
  Activity,
  Settings,
  Globe,
  BarChart3,
} from "lucide-react";
import udsmLogo from "@/assets/udsm-logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/journals", icon: BookOpen, label: "Journals" },
  { to: "/comparison", icon: GitCompare, label: "Comparison" },
  { to: "/live", icon: Activity, label: "Live Engagement" },
  { to: "/public-view", icon: Globe, label: "Public View" },
  { to: "/settings", icon: Settings, label: "System Settings" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <img src={udsmLogo} alt="UDSM" className="h-10 w-10 rounded-full bg-white/10 object-contain p-0.5" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white font-heading">UDSM Analytics</span>
          <span className="text-[11px] text-sidebar-muted">OJS Plugin v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-sidebar-primary" : ""}`} />
              {item.label}
              {item.to === "/live" && (
                <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sidebar-muted" />
          <span className="text-xs text-sidebar-muted">Powered by Matomo & Crossref</span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
