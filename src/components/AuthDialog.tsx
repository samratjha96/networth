import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface AuthDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function AuthDialog({ trigger, className }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signIn, signUp, signInWithGoogle, signInWithApple, error } =
    useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }

      if (!error) {
        setIsOpen(false);
        toast.success(
          mode === "signin"
            ? "Signed in successfully"
            : "Account created successfully",
        );
        resetForm();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }

      if (!error) {
        setIsOpen(false);
        toast.success("Signed in successfully");
        resetForm();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <div className={className}>{trigger}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-4">
          {/* OAuth Options */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-center gap-2 py-5 w-full"
              onClick={() => handleOAuthSignIn("google")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-center gap-2 py-5 w-full"
              onClick={() => handleOAuthSignIn("apple")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.37C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.87 1.17-.28 2.3-.99 3.46-.84 1.47.2 2.58.99 3.26 2.22-3.14 1.83-2.35 6.24.7 7.5-.55 1.35-1.3 2.7-2.5 3.22zM12.03 7.25c-.15-2.23 1.66-4.13 3.67-4.25.32 2.21-1.7 4.31-3.67 4.25z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signin"
                    ? "Enter your password"
                    : "Create a password"
                }
                required
                minLength={6}
                className="bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error.message}</p>}

            <Button
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Mode Switch */}
          <div className="text-center text-sm">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline focus:outline-none"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline focus:outline-none"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
