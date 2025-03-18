import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { useAuth } from "@/components/AuthProvider";
import { DebugAuthStatus } from "@/components/DebugAuthStatus";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { DatabaseProvider } from "@/components/DatabaseProvider";
import { useDatabaseStore } from "@/store/database-store";
import { useDb } from "@/components/DatabaseProvider";

// Create the QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus for better user experience
      refetchOnWindowFocus: false,
      // Cache data for longer to reduce unnecessary loading
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// App initialization wrapper that handles auth and database setup
function AppInitializer({ children }) {
  const { isLoading: authLoading, user } = useAuth();
  const { setUserId } = useDatabaseStore();
  const { isLoading: dbLoading } = useDb();
  const [isInitializing, setIsInitializing] = useState(true);

  // Set up user in database when auth state changes
  useEffect(() => {
    if (!authLoading) {
      const userId = user?.id || null;
      console.debug("Auth state determined, setting database user:", userId);
      
      if (userId) {
        // User is authenticated, use their database
        setUserId(userId);
      } else {
        // User is signed out, explicitly reset to mock database
        console.debug("User signed out or not authenticated, using mock database");
        setUserId(null);
      }
      
      // We've done our initialization work
      setIsInitializing(false);
    }
  }, [authLoading, user, setUserId]);

  // Show loading indicator until everything is initialized
  const isLoading = authLoading || dbLoading || isInitializing;
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading</h2>
          <p className="text-muted-foreground text-sm">
            {authLoading ? "Checking authentication..." : 
             dbLoading ? "Initializing database..." : 
             "Preparing application..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// App content with routes
function AppContent() {
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
      <AuthProvider>
        <DatabaseProvider>
          <AppInitializer>
            <AppContent />
          </AppInitializer>
        </DatabaseProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
