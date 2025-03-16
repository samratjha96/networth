import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { useDatabaseStore } from "./database-store";

// Initialize Supabase client using Vite's environment variable approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the Supabase client if the necessary credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type DatabaseMode = "local" | "supabase";

type AuthState = {
  // Authentication state
  session: Session | null;
  user: User | null;
  databaseMode: DatabaseMode;

  // UI state
  isLoading: boolean;
  isInitialized: boolean;
};

type AuthActions = {
  // Core auth flow
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  // Internal actions
  setDatabaseMode: (mode: DatabaseMode, userId?: string) => Promise<void>;
  handleAuthStateChange: (session: Session | null) => Promise<void>;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  session: null,
  user: null,
  databaseMode: "local",
  isLoading: false,
  isInitialized: false,

  // Set database mode (local or supabase)
  setDatabaseMode: async (mode: DatabaseMode, userId?: string) => {
    set({ isLoading: true });
    const dbStore = useDatabaseStore.getState();

    if (mode === "local") {
      // Switch to local storage mode by setting userId to null
      dbStore.setUserId(null);

      // Update auth state to reflect no user
      set({
        databaseMode: "local",
        session: null,
        user: null,
        isLoading: false,
      });
    } else {
      // Switch to Supabase mode
      if (!userId) {
        throw new Error("User ID is required when setting Supabase mode");
      }

      // Just set the user ID in the database store
      dbStore.setUserId(userId);

      // Update auth state to reflect the database mode
      set({
        databaseMode: "supabase",
        isLoading: false,
      });
    }
  },

  // Initialize authentication
  initialize: async () => {
    // Skip if already initialized
    if (get().isInitialized) return;

    set({ isLoading: true });

    // When Supabase isn't available, fall back to local storage
    if (!supabase) {
      await get().setDatabaseMode("local");
      set({ isInitialized: true, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session?.user) {
        // User is authenticated
        set({
          session: data.session,
          user: data.session.user,
        });
        await get().setDatabaseMode("supabase", data.session.user.id);
      } else {
        // No authenticated user
        await get().setDatabaseMode("local");
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      await get().setDatabaseMode("local");
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  // Handle auth state changes from Supabase
  handleAuthStateChange: async (session: Session | null) => {
    const dbStore = useDatabaseStore.getState();

    if (session?.user) {
      set({ session, user: session.user });
      dbStore.setUserId(session.user.id);
    } else {
      dbStore.setUserId(null);
      set({ session: null, user: null });
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Authentication is not available");
    }

    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Authentication is not available");
    }

    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true });

    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    }

    // Directly update database store and local state
    const dbStore = useDatabaseStore.getState();
    dbStore.setUserId(null);

    // Update auth state
    set({
      session: null,
      user: null,
      databaseMode: "local",
      isLoading: false,
    });
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    if (!supabase) {
      throw new Error("Authentication is not available");
    }

    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
