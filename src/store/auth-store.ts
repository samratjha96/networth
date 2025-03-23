import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabaseApi } from "@/api/supabase-api";
import { supabase } from "@/lib/supabase";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
} from "@/utils/input-validation";
import { createApiError } from "@/utils/api-helpers";
import {
  useSignIn,
  useSignOut,
  useSignUp,
  useSignInWithGoogle,
} from "@/api/queries";

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

      // const { data, error } = await useSignIn()
      const mutation = useSignIn();
      const { data, error } = await mutation.mutateAsync({
        email,
        password,
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
      const mutation = useSignInWithGoogle();
      const { data, error } = await mutation.mutateAsync();
      if (error) throw error;
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

      const mutation = useSignUp();
      const { data, error } = await mutation.mutateAsync({
        email,
        password,
        name,
      });

      if (error) throw error;
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signOut: async () => {
    try {
      set({ status: "loading", error: null });
      const mutation = useSignOut();
      const { error } = await mutation.mutateAsync();
      if (error) throw error;
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },
}));
