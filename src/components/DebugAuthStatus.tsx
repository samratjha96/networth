import { useAuth } from "./AuthProvider";
import { useDatabase } from "@/hooks/use-database";

export function DebugAuthStatus() {
  const { user, isLoading } = useAuth();
  const { backendType } = useDatabase();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-black/70 text-white text-xs p-2 m-2 rounded shadow-lg z-50 max-w-xs">
      <div className="font-bold mb-1">Auth Debug</div>
      <div>
        <div>
          User: {user ? "✅" : "❌"} {user?.email}
        </div>
        <div>Auth Loading: {isLoading ? "⏳" : "✅"}</div>
        <div>Backend: {backendType}</div>
      </div>
    </div>
  );
}
