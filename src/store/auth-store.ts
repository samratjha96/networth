import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

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

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
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

    set({ authStateSubscription: () => data.subscription.unsubscribe() });
  },

  unsubscribeFromAuthChanges: () => {
    const { authStateSubscription } = get();
    if (authStateSubscription) {
      authStateSubscription();
      set({ authStateSubscription: null });
    }
  },
}));
