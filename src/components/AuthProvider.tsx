import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useDatabaseStore } from "@/store/database-store";

// Initialize Supabase client using Vite's environment variable approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the Supabase client if the necessary credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Define the auth context type
type AuthContextType = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  session: null,
  user: null,
  signIn: async () => ({ error: new Error("AuthProvider not initialized") }),
  signOut: async () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component - handles Supabase auth and provides context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { setUserId } = useDatabaseStore();

  // Handle auth state changes and update related states
  const handleAuthStateChange = (
    event: AuthChangeEvent,
    currentSession: Session | null,
  ) => {
    console.log(
      "Auth event:",
      event,
      "User ID:",
      currentSession?.user?.id || "none",
    );

    // Update the auth state
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    setIsLoading(false);

    // Update database user ID
    setUserId(currentSession?.user?.id || null);

    // Invalidate queries to refresh data based on new auth state
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized");
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        // Update the state directly for initial load instead of using handleAuthStateChange
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);

        // Also update database user ID
        setUserId(data.session?.user?.id || null);
      } catch (error) {
        console.error("Error getting initial session:", error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth change subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (!supabase)
      return { error: new Error("Supabase client not initialized") };

    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    if (!supabase) return;

    try {
      console.log("Attempting to sign out");

      // Log out with Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during sign out:", error);
        return;
      }

      // No need for page reload - auth state change handled by subscription
      console.log("Sign out successful");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    isLoading,
    session,
    user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
