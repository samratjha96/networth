import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>An error occurred while loading data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "Unknown error"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {resetErrorBoundary && (
          <Button variant="outline" onClick={resetErrorBoundary}>
            Reset
          </Button>
        )}
        {retry && <Button onClick={retry}>Try Again</Button>}
      </CardFooter>
    </Card>
  );
}
