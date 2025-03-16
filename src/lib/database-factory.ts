import { DatabaseProvider } from "@/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb, useSupabase } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = "local" | "supabase";

// Check if user is signed in to Supabase
const isUserAuthenticated = (): boolean => {
  if (!supabaseDb) return false;
  return supabaseDb.hasUserId();
};

// Track the current backend state
let currentBackend: DatabaseBackend = "local"; // Start with local until authentication is confirmed

// Get the current database provider based on authentication state
export function getDatabase(): DatabaseProvider {
  // Set the current backend based on authentication state
  currentBackend = isUserAuthenticated() && useSupabase ? "supabase" : "local";

  // Return the appropriate database provider
  if (currentBackend === "supabase" && supabaseDb) {
    return supabaseDb;
  }

  // Fall back to mock database when not authenticated or supabaseDb is unavailable
  return mockDb;
}

// Get the current backend
export function getDatabaseBackend(): DatabaseBackend {
  // Always return the current actual state, which is based on authentication
  return isUserAuthenticated() && useSupabase ? "supabase" : "local";
}

// For development purposes only: force using local storage
// This should not be used in production scenarios
export function forceMockDatabaseForDevelopment(enabled: boolean): void {
  if (enabled) {
    console.warn(
      "⚠️ DEVELOPMENT MODE: Forcing use of mock database regardless of auth state",
    );
    currentBackend = "local";
  } else {
    // Reset to the correct state based on authentication
    currentBackend =
      isUserAuthenticated() && useSupabase ? "supabase" : "local";
  }

  // Force a dispatch of a custom event to help components react to the change
  window.dispatchEvent(
    new CustomEvent("database-backend-changed", {
      detail: { backend: currentBackend },
    }),
  );
}
