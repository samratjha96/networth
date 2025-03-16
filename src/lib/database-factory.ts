import { DatabaseProvider } from "@/lib/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = 'local' | 'supabase';

// Use environment variable to determine the default backend
const getDefaultBackend = (): DatabaseBackend => 
  import.meta.env.VITE_USE_SUPABASE === 'true' ? 'supabase' : 'local';

// Current database backend (with default from environment)
let currentBackend = getDefaultBackend();

// Get the current database provider based on selected backend
export function getDatabase(): DatabaseProvider {
  return currentBackend === 'supabase' ? supabaseDb : mockDb;
}

// Switch to a different backend (for testing or development)
export function setDatabaseBackend(backend: DatabaseBackend): void {
  currentBackend = backend;
  console.log(`Switched to ${backend} database backend`);
}

// Get the current backend
export function getDatabaseBackend(): DatabaseBackend {
  return currentBackend;
} 