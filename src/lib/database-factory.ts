import { DatabaseProvider } from "@/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = 'local' | 'supabase';

// Constants for localStorage keys - must match those in database.ts
const TEST_MODE_KEY = 'networth_test_mode';

// Use environment variable to determine the default backend
const getDefaultBackend = (): DatabaseBackend => 
  import.meta.env.VITE_USE_SUPABASE === 'true' ? 'supabase' : 'local';

// Current database backend (with default from environment)
let currentBackend = getDefaultBackend();

// Track test mode state in localStorage instead of a global variable
const getPersistedTestMode = (): boolean => {
  const storedValue = localStorage.getItem(TEST_MODE_KEY);
  return storedValue === 'true';
};

// Get the current database provider based on selected backend and test mode
export function getDatabase(): DatabaseProvider {
  // Always use the mock database when in test mode, regardless of the current backend
  if (getPersistedTestMode()) {
    return mockDb;
  }
  return currentBackend === 'supabase' ? supabaseDb : mockDb;
}

// Switch to a different backend (for testing or development)
export function setDatabaseBackend(backend: DatabaseBackend): void {
  currentBackend = backend;
  console.log(`Switched to ${backend} database backend`);
}

// Set global test mode state (persisted to localStorage)
export function setGlobalTestMode(enabled: boolean): void {
  localStorage.setItem(TEST_MODE_KEY, enabled.toString());
  console.log(`Global test mode ${enabled ? 'enabled' : 'disabled'}`);
}

// Get test mode state from localStorage
export function isGlobalTestMode(): boolean {
  return getPersistedTestMode();
}

// Get the current backend
export function getDatabaseBackend(): DatabaseBackend {
  return currentBackend;
} 