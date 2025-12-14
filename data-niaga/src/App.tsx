import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Tutorial from "./pages/Tutorial";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Forecasts from "./pages/Forecasts";
import Inventory from "./pages/Inventory";
import Promo from "./pages/Promo";
import StoreLayout from "./pages/StoreLayout";
import Quality from "./pages/Quality";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/layout" element={<StoreLayout />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
