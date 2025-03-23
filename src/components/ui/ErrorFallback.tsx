import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  retry?: () => void;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  retry,
}: ErrorFallbackProps) {
  // Log error to monitoring service in production
  useEffect(() => {
    // In production, send to your error monitoring service
    if (import.meta.env.PROD) {
      // Example: errorMonitoringService.report(error);
      console.error("Application error:", error);
    }
  }, [error]);

  const isNetworkError =
    error.message.includes("network") ||
    error.message.includes("fetch") ||
    error.message.includes("connection");

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {isNetworkError
              ? "We're having trouble connecting to our servers"
              : "An unexpected error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-[200px]">
            <p className="font-mono text-muted-foreground">
              {error.message || "Unknown error"}
            </p>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {isNetworkError ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your internet connection</li>
                <li>The service might be temporarily unavailable</li>
                <li>Try again in a few moments</li>
              </ul>
            ) : (
              <p>Our team has been notified of this issue.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {resetErrorBoundary && (
            <Button variant="outline" onClick={resetErrorBoundary}>
              Reset Application
            </Button>
          )}
          {retry && <Button onClick={retry}>Try Again</Button>}
        </CardFooter>
      </Card>
    </div>
  );
}
