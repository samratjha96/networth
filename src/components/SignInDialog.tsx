import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export const SignInDialog = () => {
  const { signIn, signUp, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleError = (err: unknown) => {
    // Handle Supabase error object
    const supabaseError = err as any;

    // Check for Supabase error format
    if (supabaseError?.error?.message) {
      const message = supabaseError.error.message;

      // Handle specific error cases
      if (message.includes("Email already registered")) {
        return "This email is already registered. Please sign in instead.";
      }
      if (message.includes("Password") || message.includes("Auth")) {
        return "Password must be at least 6 characters long.";
      }
      if (message.includes("Invalid login credentials")) {
        return "Invalid email or password. Please try again.";
      }
      if (message.includes("Email not confirmed")) {
        return "Please check your email to confirm your account before signing in.";
      }

      // Return the actual error message if we don't have a specific handler
      return message;
    }

    // Handle standard Error objects
    if (err instanceof Error) {
      return err.message;
    }

    // Default error message
    return "Authentication failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        try {
          await signUp(email, password);
        } catch (err) {
          setError(handleError(err));
          return;
        }
        // After successful sign up, automatically sign in
        try {
          await signIn(email, password);
          setOpen(false);
          window.location.reload();
        } catch (err) {
          setError(
            "Account created but failed to sign in. Please try signing in manually.",
          );
        }
      } else {
        try {
          await signIn(email, password);
          setOpen(false);
          window.location.reload();
        } catch (err) {
          setError(handleError(err));
        }
      }
    } catch (err) {
      setError(handleError(err));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setOpen(false);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("popup_closed_by_user")
      ) {
        setError("Google sign in was cancelled. Please try again.");
        return;
      }
      setError(handleError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={isLoading}>
          Sign {isSignUp ? "Up" : "In"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Create an account to save your data"
              : "Sign in to access your account"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
