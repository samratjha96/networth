import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { pb } from "@/lib/pocketbase";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error"
  | "connection_timeout";

// Generic user type that works with both Supabase and PocketBase
interface GenericUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: GenericUser | null;
  status: AuthStatus;
  error: Error | null;
  authStateSubscription: (() => void) | null;
  subscribeToAuthChanges: () => void;
  unsubscribeFromAuthChanges: () => void;
}

// Utility function to determine which auth provider to use
const getAuthProvider = () => {
  // Default to PocketBase, only use Supabase if explicitly enabled
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true";
  return useSupabase ? "supabase" : "pocketbase"; // PocketBase is the default
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",
  error: null,
  authStateSubscription: null,

  subscribeToAuthChanges: () => {
    // Prevent multiple subscriptions
    if (get().authStateSubscription) {
      get().unsubscribeFromAuthChanges();
    }

    // Set initial loading state
    set({ status: "loading" });

    const authProvider = getAuthProvider();

    // Create a timeout for connection
    const connectionTimeout = setTimeout(() => {
      // If we're still in loading state after timeout, assume connection failed
      if (get().status === "loading") {
        console.warn(
          `${authProvider} connection timed out. Falling back to demo mode.`,
        );
        set({
          user: null,
          status: "connection_timeout",
          error: new Error(`Connection to ${authProvider} timed out`),
        });
      }
    }, 10000); // 10 seconds timeout

    try {
      if (authProvider === "supabase") {
        // Supabase authentication
        if (!supabase) {
          throw new Error(
            "Supabase client not initialized. Make sure VITE_USE_SUPABASE=true and provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
          );
        }

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          // Clear timeout since we got a response
          clearTimeout(connectionTimeout);

          if (event === "INITIAL_SESSION") {
            if (session) {
              set({
                user: session.user as unknown as GenericUser,
                status: "authenticated",
                error: null,
              });
            } else {
              set({ user: null, status: "unauthenticated", error: null });
            }
          } else if (event === "SIGNED_IN") {
            set({
              user: (session?.user as unknown as GenericUser) || null,
              status: "authenticated",
              error: null,
            });
          } else if (event === "SIGNED_OUT") {
            set({ user: null, status: "unauthenticated", error: null });
          } else if (event === "USER_UPDATED") {
            set({ user: (session?.user as unknown as GenericUser) || null });
          }
        });

        set({
          authStateSubscription: () => {
            clearTimeout(connectionTimeout);
            data.subscription.unsubscribe();
          },
        });
      } else {
        // PocketBase authentication
        // Check initial auth state
        if (pb.authStore.isValid && pb.authStore.record) {
          clearTimeout(connectionTimeout);
          set({
            user: pb.authStore.record as GenericUser,
            status: "authenticated",
            error: null,
          });
        } else {
          clearTimeout(connectionTimeout);
          set({ user: null, status: "unauthenticated", error: null });
        }

        // Set up auth store listener for PocketBase
        const unsubscribe = pb.authStore.onChange(() => {
          console.log("PocketBase auth store changed:", {
            isValid: pb.authStore.isValid,
            hasRecord: !!pb.authStore.record,
            userId: pb.authStore.record?.id,
            email: pb.authStore.record?.email,
          });

          if (pb.authStore.isValid && pb.authStore.record) {
            set({
              user: pb.authStore.record as GenericUser,
              status: "authenticated",
              error: null,
            });
          } else {
            set({ user: null, status: "unauthenticated", error: null });
          }
        });

        set({
          authStateSubscription: () => {
            clearTimeout(connectionTimeout);
            unsubscribe();
          },
        });
      }
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error("Error subscribing to auth changes:", error);
      set({
        user: null,
        status: "error",
        error: error instanceof Error ? error : new Error("Unknown auth error"),
      });
    }
  },

  unsubscribeFromAuthChanges: () => {
    const { authStateSubscription } = get();
    if (authStateSubscription) {
      authStateSubscription();
      set({ authStateSubscription: null });
    }
  },
}));
