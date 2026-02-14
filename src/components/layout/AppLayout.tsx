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
        <footer className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 University of Dar es Salaam · Digital Commons</span>
            <span>OJS Analytics Plugin · Version 1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
