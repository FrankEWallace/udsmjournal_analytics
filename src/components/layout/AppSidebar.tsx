import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GitCompare,
  Activity,
  Settings,
  Globe,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import udsmLogo from "@/assets/udsm-logo.jpeg";

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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col"
      style={{ background: 'linear-gradient(180deg, #1a3d5c 0%, #1e4a6e 40%, #2A6EBB 100%)' }}
    >
      {/* UDSM Logo & Brand */}
      <div className="flex flex-col items-center border-b border-white/10 px-5 py-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg">
          <img src={udsmLogo} alt="UDSM Coat of Arms" className="h-11 w-11 object-contain" />
        </div>
        <div className="mt-2.5 flex flex-col items-center text-center">
          <span className="text-[13px] font-bold text-white tracking-wide font-heading leading-tight">
            University of Dar es Salaam
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-blue-200/80 uppercase tracking-[0.15em]">
            Journal Analytics
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/50">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-white shadow-sm backdrop-blur-sm"
                  : "text-blue-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] transition-colors ${
                isActive ? "text-yellow-400" : "text-blue-200/50 group-hover:text-blue-200/80"
              }`} />
              {item.label}
              {item.to === "/live" && (
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-blue-200/40" />
          <span className="text-[10px] text-blue-200/40 italic">Hekima ni Uhuru</span>
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-blue-200/30" />
          <span className="text-[9px] text-blue-200/30">Powered by OJS · Matomo · Crossref</span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
