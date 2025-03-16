import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { SignInDialog } from "./SignInDialog";
import { useCallback } from "react";
import { useDatabaseStore } from "@/store/database-store";

export const Header = () => {
  const { user, signOut, isLoading } = useAuth();
  const { currentBackend } = useDatabaseStore();

  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out and switching to local database");
      await signOut();
      // The backend switch will happen automatically through the DatabaseSyncProvider
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Argos
        </h1>
        <p className="text-xs text-muted-foreground">
          Your all-seeing financial guardian
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="h-8 w-[200px] animate-pulse rounded bg-muted" />
        ) : user ? (
          // Authenticated user view
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        ) : (
          // Demo mode view with sign in dialog
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Demo Mode</span>
            <SignInDialog />
          </div>
        )}
      </div>
    </div>
  );
};
