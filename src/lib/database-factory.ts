import { DatabaseProvider } from "@/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = "local" | "supabase";

// Constants for localStorage keys - must match those in database.ts
const TEST_MODE_KEY = "networth_test_mode";

// Use environment variable to determine the default backend
const getDefaultBackend = (): DatabaseBackend => {
  // Check if we should use Supabase according to env variable
  const shouldUseSupabase = import.meta.env.VITE_USE_SUPABASE === "true";

  // If we're supposed to use Supabase, verify that the necessary credentials exist
  if (shouldUseSupabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // If credentials are missing, fall back to local storage regardless of the setting
    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase credentials missing. Falling back to local storage backend.",
      );
      return "local";
    }

    return "supabase";
  }

  return "local";
};

// Current database backend (with default from environment)
let currentBackend = getDefaultBackend();

// Track test mode state in localStorage instead of a global variable
const getPersistedTestMode = (): boolean => {
  const storedValue = localStorage.getItem(TEST_MODE_KEY);
  return storedValue === "true";
};

// Get the current database provider based on selected backend and test mode
export function getDatabase(): DatabaseProvider {
  // Always use the mock database when in test mode, regardless of the current backend
  if (getPersistedTestMode()) {
    return mockDb;
  }

  // If the current backend is supabase, check if we have a valid instance
  if (currentBackend === "supabase") {
    // If supabaseDb is null (which happens when credentials are missing), fall back to mockDb
    if (!supabaseDb) {
      console.warn(
        "Supabase database unavailable, falling back to local storage",
      );
      return mockDb;
    }
    return supabaseDb;
  }

  // Default to mock database
  return mockDb;
}

// Switch to a different backend (for testing or development)
export function setDatabaseBackend(backend: DatabaseBackend): void {
  currentBackend = backend;
  console.log(`Switched to ${backend} database backend`);
}

// Set global test mode state (persisted to localStorage)
export function setGlobalTestMode(enabled: boolean): void {
  localStorage.setItem(TEST_MODE_KEY, enabled.toString());
  console.log(`Global test mode ${enabled ? "enabled" : "disabled"}`);
}

// Get test mode state from localStorage
export function isGlobalTestMode(): boolean {
  return getPersistedTestMode();
}

// Get the current backend
export function getDatabaseBackend(): DatabaseBackend {
  return currentBackend;
}
