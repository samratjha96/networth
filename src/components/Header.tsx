import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { TestModeToggle } from "./TestModeToggle";
import { SignInButton } from "./SignInButton";
import { useDatabase } from "@/lib/database-context";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isTestMode, toggleTestMode } = useDatabase();
  
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
        {user ? (
          // Authenticated user view
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        ) : (
          // Demo mode view with sign in button
          <SignInButton />
        )}
        
        {/* Only show test mode toggle for authenticated users */}
        {user && <TestModeToggle />}
      </div>
    </div>
  );
}; 