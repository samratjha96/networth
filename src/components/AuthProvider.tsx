import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { supabaseDb } from "@/lib/supabase-database";
import { setDatabaseBackend, setGlobalTestMode } from "@/lib/database-factory";

// Initialize Supabase client using Vite's environment variable approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the Supabase client if the necessary credentials are available
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Context type definition
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If Supabase isn't available, fall back to local storage immediately
    if (!supabase) {
      console.warn(
        "Supabase client not available, falling back to local storage",
      );
      setDatabaseBackend("local");
      setGlobalTestMode(true);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    // Track initialization state
    let isInitializing = false;

    // Get the initial session and set up auth subscription
    const initializeAuth = async () => {
      // Prevent double initialization
      if (isInitializing) return;
      isInitializing = true;

      try {
        setIsLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        console.log("Initial auth state:", {
          hasSession: !!session,
          hasUser: !!session?.user,
        });

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          supabaseDb.setUserId(session.user.id);
          setDatabaseBackend("supabase");
          setGlobalTestMode(false);
          await supabaseDb.initialize();
        } else {
          setSession(null);
          setUser(null);
          setDatabaseBackend("local");
          setGlobalTestMode(true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setDatabaseBackend("local");
        setGlobalTestMode(true);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        isInitializing = false;
      }
    };

    initializeAuth();

    // Debounce auth state changes to prevent rapid firing
    let authChangeTimeout: number | null = null;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (!mounted) return;

        console.debug("Auth event:", event, session?.user?.id);

        // Clear any pending auth change handlers
        if (authChangeTimeout) {
          window.clearTimeout(authChangeTimeout);
        }

        // Debounce auth changes to prevent rapid firing
        authChangeTimeout = window.setTimeout(async () => {
          try {
            switch (event) {
              case "INITIAL_SESSION":
                // Skip as we handle this in initializeAuth
                break;

              case "SIGNED_IN":
                setIsLoading(true);
                if (session?.user) {
                  setSession(session);
                  setUser(session.user);
                  supabaseDb.setUserId(session.user.id);
                  setDatabaseBackend("supabase");
                  setGlobalTestMode(false);
                  await supabaseDb.initialize();
                }
                setIsLoading(false);
                break;

              case "SIGNED_OUT":
                setIsLoading(true);
                setSession(null);
                setUser(null);
                setDatabaseBackend("local");
                setGlobalTestMode(true);
                setIsLoading(false);
                break;

              case "USER_UPDATED":
                if (session?.user) {
                  setUser(session.user);
                  setSession(session);
                }
                break;

              case "TOKEN_REFRESHED":
                if (session) {
                  setSession(session);
                }
                break;
            }
          } catch (error) {
            console.error("Error handling auth change:", error);
            setDatabaseBackend("local");
            setGlobalTestMode(true);
            setIsLoading(false);
          }
        }, 50); // Small delay to batch rapid auth events
      },
    );

    // Clean up
    return () => {
      mounted = false;
      if (authChangeTimeout) {
        window.clearTimeout(authChangeTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(
        "Authentication is not available. Supabase client not initialized.",
      );
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(
        "Authentication is not available. Supabase client not initialized.",
      );
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) {
      // If supabase not available, just reset local state
      setSession(null);
      setUser(null);
      setDatabaseBackend("local");
      setGlobalTestMode(true);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error(
        "Authentication is not available. Supabase client not initialized.",
      );
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
