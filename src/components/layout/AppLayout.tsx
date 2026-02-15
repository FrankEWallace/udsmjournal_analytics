import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        {/* Footer */}
        <footer className="border-t border-border bg-white px-6 py-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>© 2026 University of Dar es Salaam · Directorate of Research &amp; Knowledge Exchange</span>
            <div className="flex items-center gap-3">
              <a href="https://www.udsm.ac.tz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">udsm.ac.tz</a>
              <span className="h-3 w-px bg-border" />
              <span>OJS Analytics v1.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
