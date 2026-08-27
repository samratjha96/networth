import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pocketbaseApi } from "./pocketbase-api";
import { sanitizeApiParams } from "@/utils/api-helpers";
import { sanitizeString } from "@/utils/input-validation";

// Auth Mutations for PocketBase
export const usePocketBaseSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const sanitizedParams = sanitizeApiParams({ email, password });
      const result = await pocketbaseApi.auth.signInWithPassword({
        email: sanitizedParams.email,
        password: sanitizedParams.password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign in failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const usePocketBaseSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      const sanitizedName = sanitizeString(name);
      const result = await pocketbaseApi.auth.signUp({
        email,
        password,
        name: sanitizedName,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign up failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const usePocketBaseSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pocketbaseApi.auth.signOut,
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries when signing out
    },
  });
};

export const usePocketBaseSignInWithGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await pocketbaseApi.auth.signInWithOAuth({
        provider: "google",
      });

      // If there's an error in the result, throw it
      if (result.error) {
        throw new Error(result.error.message || "OAuth2 authentication failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => {
      console.error("Google OAuth2 sign-in failed:", error);
    },
  });
};
