import { useEffect } from "react";
import { AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/auth-store";
import { supabaseDb } from "@/lib/supabase-database";

// Initialize Supabase client using Vite's environment variable approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the Supabase client if the necessary credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Auth provider component - handles Supabase auth subscription
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const handleAuthStateChange = useAuthStore(
    (state) => state.handleAuthStateChange,
  );

  // Set up auth change subscription
  useEffect(() => {
    if (!supabase) return;

    // Subscribe to auth changes from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.debug("Auth event:", event, session?.user?.id);

        // Update auth state for relevant events
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "USER_UPDATED" ||
          event === "TOKEN_REFRESHED"
        ) {
          await handleAuthStateChange(session);

          // Update the user ID in the Supabase database class
          if (supabaseDb) {
            const userId = session?.user?.id || null;
            supabaseDb.setUserId(userId);
          }
        }
      },
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Initialize user ID in supabase database on mount
  useEffect(() => {
    const initializeUserId = async () => {
      if (!supabase || !supabaseDb) return;

      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id || null;
        supabaseDb.setUserId(userId);
      } catch (error) {
        console.error(
          "Error initializing user ID in supabase database:",
          error,
        );
      }
    };

    initializeUserId();
  }, []);

  return <>{children}</>;
};

// Use the auth store directly
export const useAuth = useAuthStore;
