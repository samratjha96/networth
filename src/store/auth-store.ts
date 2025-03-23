import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabaseApi } from "@/api/supabase-api";
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
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  error: null,

  initialize: async () => {
    try {
      set({ status: "loading" });

      // Check for existing session
      const { data, error } = await supabaseApi.auth.getSession();

      if (error) {
        throw error;
      }

      if (data?.session) {
        const { data: userData } = await supabaseApi.auth.getUser();
        set({ user: userData.user, status: "authenticated" });
      } else {
        set({ user: null, status: "unauthenticated" });
      }
    } catch (error) {
      set({ user: null, error: error as Error, status: "error" });
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
      set({ user: data.user, status: "authenticated" });
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
      set({ user: data.user, status: "authenticated" });
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signOut: async () => {
    try {
      set({ status: "loading", error: null });
      const { error } = await supabaseApi.auth.signOut();
      if (error) throw error;
      set({ user: null, status: "unauthenticated" });
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },
}));
