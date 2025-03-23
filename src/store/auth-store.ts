import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabaseApi } from "@/api/supabase-api";
import { supabase } from "@/lib/supabase";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
} from "@/utils/input-validation";
import { sanitizeApiParams, createApiError } from "@/utils/api-helpers";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: Error | null;
  authStateSubscription: (() => void) | null;
  subscribeToAuthChanges: () => void;
  unsubscribeFromAuthChanges: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  signIn: async (email, password) => {
    try {
      set({ status: "loading", error: null });

      // Validate inputs
      if (!email || !isValidEmail(email)) {
        throw createApiError("Invalid email address");
      }

      if (!password) {
        throw createApiError("Password is required");
      }

      // Sanitize inputs
      const sanitizedParams = sanitizeApiParams({ email, password });

      const { data, error } = await supabaseApi.auth.signInWithPassword({
        email: sanitizedParams.email,
        password: sanitizedParams.password,
      });

      if (error) throw error;
      // The auth state change listener will update the state automatically
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ status: "loading", error: null });
      const { error } = await supabaseApi.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
      // Auth state changes will be captured by the listener
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signUp: async (email, password, name) => {
    try {
      set({ status: "loading", error: null });

      // Validate inputs
      if (!email || !isValidEmail(email)) {
        throw createApiError("Invalid email address");
      }

      if (!password || !isValidPassword(password)) {
        throw createApiError(
          "Password must be at least 8 characters with uppercase, lowercase, and number",
        );
      }

      if (!name.trim()) {
        throw createApiError("Name is required");
      }

      // Sanitize inputs
      const sanitizedName = sanitizeString(name);

      const { data, error } = await supabaseApi.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: sanitizedName },
        },
      });

      if (error) throw error;
      // Auth listener will handle state updates
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signOut: async () => {
    try {
      set({ status: "loading", error: null });
      const { error } = await supabaseApi.auth.signOut();
      if (error) throw error;
      // Auth listener will handle state updates
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },
}));
