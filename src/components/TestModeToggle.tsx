import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { getDatabase } from "@/lib/database-factory";
import { useToast } from "@/hooks/use-toast";

export function TestModeToggle() {
  const { toast } = useToast();
  const isTestMode = getDatabase().isTestModeEnabled();

  const handleToggleTestMode = () => {
    try {
      const db = getDatabase();
      db.setTestMode(!isTestMode);

      // Force page reload to apply test mode changes
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle test mode",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <Button
      variant={isTestMode ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggleTestMode}
      className="gap-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h13a1 1 0 0 0 .9-1.45L14 10V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
      </svg>
      {isTestMode ? "Disable Test Mode" : "Enable Test Mode"}
    </Button>
  );
}
