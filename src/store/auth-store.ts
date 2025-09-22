import { create } from "zustand";
import { pb } from "@/lib/pocketbase";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error"
  | "connection_timeout";

// Generic user type for PocketBase
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

    // Create a timeout for connection
    const connectionTimeout = setTimeout(() => {
      // If we're still in loading state after timeout, assume connection failed
      if (get().status === "loading") {
        console.warn(
          "PocketBase connection timed out. Falling back to demo mode.",
        );
        set({
          user: null,
          status: "connection_timeout",
          error: new Error("Connection to PocketBase timed out"),
        });
      }
    }, 10000); // 10 seconds timeout

    try {
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
