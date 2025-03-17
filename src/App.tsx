import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { AppProvider } from "@/components/AppProvider";
import { useAuth } from "@/components/AuthProvider";
import { DebugAuthStatus } from "@/components/DebugAuthStatus";
import { useEffect } from "react";

const queryClient = new QueryClient();

// App content with authentication awareness
function AppContent() {
  const { isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Reset cache when component mounts to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
      <DebugAuthStatus />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
