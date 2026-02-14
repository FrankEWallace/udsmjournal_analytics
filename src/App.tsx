import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Journals from "@/pages/Journals";
import JournalDetail from "@/pages/JournalDetail";
import Comparison from "@/pages/Comparison";
import LiveEngagement from "@/pages/LiveEngagement";
import PublicView from "@/pages/PublicView";
import SystemSettings from "@/pages/SystemSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journals" element={<Journals />} />
            <Route path="/journals/:id" element={<JournalDetail />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/live" element={<LiveEngagement />} />
            <Route path="/public-view" element={<PublicView />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
