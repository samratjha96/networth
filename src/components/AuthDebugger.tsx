import { useAuthStore } from "@/store/auth-store";
import { pb } from "@/lib/pocketbase";

export const AuthDebugger = () => {
  const { user, status, error } = useAuthStore();

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  const testOAuth = async () => {
    try {
      console.log("Testing OAuth2 flow...");
      const result = await pb
        .collection("users")
        .authWithOAuth2({ provider: "google" });
      console.log("OAuth2 test result:", result);
    } catch (err) {
      console.error("OAuth2 test failed:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Auth Debug Info</div>
      <div className="space-y-1">
        <div>Status: {status}</div>
        <div>User ID: {user?.id || "none"}</div>
        <div>Email: {user?.email || "none"}</div>
        <div>Name: {(user as { name?: string })?.name || "none"}</div>
        <div>PB Valid: {pb.authStore.isValid ? "yes" : "no"}</div>
        <div>PB Token: {pb.authStore.token ? "present" : "none"}</div>
        <div>Provider: pocketbase</div>
        <div>PB URL: {import.meta.env.VITE_POCKETBASE_URL}</div>
        {error && <div className="text-red-300">Error: {error.message}</div>}

        <button
          onClick={testOAuth}
          className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
        >
          Test OAuth2
        </button>

        <button
          onClick={() => pb.authStore.clear()}
          className="mt-1 px-2 py-1 bg-red-600 text-white rounded text-xs"
        >
          Clear Auth
        </button>
      </div>
    </div>
  );
};
