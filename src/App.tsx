import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionStatusMonitor } from "@/components/ConnectionStatusMonitor";

// Create the QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus for better user experience
      refetchOnWindowFocus: false,
      // Cache data for longer to reduce unnecessary loading
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// App content with routes
function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Sonner />
      <ConnectionStatusMonitor />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppDataProvider>
          <AppContent />
        </AppDataProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
