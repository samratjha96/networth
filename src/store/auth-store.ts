import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error"
  | "connection_timeout";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: Error | null;
  authStateSubscription: (() => void) | null;
  subscribeToAuthChanges: () => void;
  unsubscribeFromAuthChanges: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",
  error: null,
  authStateSubscription: null,

  subscribeToAuthChanges: () => {
    // Prevent multiple subscriptions
    if (get().authStateSubscription) {
      get().unsubscribeFromAuthChanges();
    }

    // Set initial loading state
    set({ status: "loading" });

    // Create a timeout for connection
    const connectionTimeout = setTimeout(() => {
      // If we're still in loading state after timeout, assume connection failed
      if (get().status === "loading") {
        console.warn(
          "Supabase connection timed out. Falling back to demo mode.",
        );
        set({
          user: null,
          status: "connection_timeout",
          error: new Error("Connection to Supabase timed out"),
        });
      }
    }, 10000); // 10 seconds timeout

    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Clear timeout since we got a response
        clearTimeout(connectionTimeout);

        if (event === "INITIAL_SESSION") {
          if (session) {
            set({ user: session.user, status: "authenticated", error: null });
          } else {
            set({ user: null, status: "unauthenticated", error: null });
          }
        } else if (event === "SIGNED_IN") {
          set({
            user: session?.user || null,
            status: "authenticated",
            error: null,
          });
        } else if (event === "SIGNED_OUT") {
          set({ user: null, status: "unauthenticated", error: null });
        } else if (event === "USER_UPDATED") {
          set({ user: session?.user || null });
        }
      });

      set({
        authStateSubscription: () => {
          clearTimeout(connectionTimeout);
          data.subscription.unsubscribe();
        },
      });
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error("Error subscribing to auth changes:", error);
      set({
        user: null,
        status: "error",
        error: error instanceof Error ? error : new Error("Unknown auth error"),
      });
    }
  },

  unsubscribeFromAuthChanges: () => {
    const { authStateSubscription } = get();
    if (authStateSubscription) {
      authStateSubscription();
      set({ authStateSubscription: null });
    }
  },
}));
