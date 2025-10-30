import React, { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/ui";

export function ConnectionStatusMonitor() {
  const { status } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    // Show a toast notification when connection times out
    if (status === "connection_timeout") {
      toast({
        title: "Connection Issue",
        description: "Connection to backend timed out. Using demo mode.",
        variant: "default",
        // Using a longer duration so the user has time to see the message
        duration: 7000,
      });
    }

    // Show a toast notification when there's an error
    if (status === "error") {
      toast({
        title: "Connection Error",
        description: "Error connecting to backend. Using demo mode.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [status, toast]);

  // This component doesn't render anything
  return null;
}
