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
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth change subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        console.debug("Auth event:", event, currentSession?.user?.id);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Make sure we're not in loading state after auth changes
        setIsLoading(false);
      },
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (!supabase)
      return { error: new Error("Supabase client not initialized") };

    try {
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
      await supabase.auth.signOut();
      // Reset cache for all queries when user signs out
      queryClient.invalidateQueries();
      console.log("Sign out successful, queries invalidated");
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
