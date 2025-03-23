import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: Error | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (data?.session) {
        const { data: userData } = await supabase.auth.getUser();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signInWithApple: async () => {
    try {
      set({ status: "loading", error: null });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
      });
      if (error) throw error;
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },

  signUp: async (email, password, name) => {
    try {
      set({ status: "loading", error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, status: "unauthenticated" });
    } catch (error) {
      set({ error: error as Error, status: "error" });
    }
  },
}));
