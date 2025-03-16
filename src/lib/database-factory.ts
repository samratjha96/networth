import { DatabaseProvider } from "@/lib/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = 'local' | 'supabase';

// Database factory to get the appropriate database implementation
export class DatabaseFactory {
  private static instance: DatabaseFactory | null = null;
  private currentBackend: DatabaseBackend = 'local';
  
  private constructor() {
    // Check environment variables to determine default backend
    const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    console.log('useSupabase', useSupabase);
    this.currentBackend = useSupabase ? 'supabase' : 'local';
  }

  static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  // Get the current database provider based on selected backend
  getDatabase(): DatabaseProvider {
    switch (this.currentBackend) {
      case 'supabase':
        return supabaseDb;
      case 'local':
      default:
        return mockDb;
    }
  }

  // Switch to a different backend (for testing or development)
  setBackend(backend: DatabaseBackend): void {
    this.currentBackend = backend;
    console.log(`Switched to ${backend} database backend`);
  }

  // Get the current backend
  getCurrentBackend(): DatabaseBackend {
    return this.currentBackend;
  }
}

// Export singleton instance
export const databaseFactory = DatabaseFactory.getInstance();

// Export a convenience function to get the current database
export function getDatabase(): DatabaseProvider {
  return databaseFactory.getDatabase();
} 