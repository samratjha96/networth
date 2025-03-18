import { DatabaseProvider } from "@/types/database";
import { MockDatabase } from "./database";
import { SupabaseDatabase, useSupabase } from "./supabase-database";

// Define database backend types
export type DatabaseBackend = "local" | "supabase";

/**
 * Database factory that creates the appropriate database provider
 * based on the specified backend type and environment settings.
 */
export const DatabaseFactory = {
  /**
   * Create a database provider instance based on the specified backend type.
   * Will check environment settings and fall back to mock database if needed.
   */
  createProvider(
    backendType: DatabaseBackend,
    userId?: string | null
  ): DatabaseProvider {
    console.debug(`DatabaseFactory: Creating provider with backendType=${backendType}, userId=${userId || 'null'}, useSupabase=${useSupabase}`);
    
    // If Supabase is explicitly requested and enabled in environment
    if (backendType === "supabase" && useSupabase) {
      // Only use Supabase if we have a valid user ID
      if (userId) {
        console.debug("DatabaseFactory: Attempting to create Supabase database with userId:", userId);
        const supabaseDb = SupabaseDatabase.getInstance();
        
        // Set the user ID on the Supabase instance
        if (supabaseDb) {
          supabaseDb.setUserId(userId);
          console.debug("DatabaseFactory: Successfully created Supabase database provider");
          return supabaseDb;
        }
      }
      
      // If we couldn't create a Supabase instance, fall back to mock
      console.warn(
        "DatabaseFactory: Supabase was requested but couldn't be initialized. Falling back to mock database."
      );
    } else {
      console.debug(`DatabaseFactory: Using mock database (backendType=${backendType}, useSupabase=${useSupabase})`);
    }
    
    // Default to mock database for local mode or when Supabase isn't available
    const mockDb = MockDatabase.getInstance();
    console.debug("DatabaseFactory: Successfully created Mock database provider");
    return mockDb;
  }
} 