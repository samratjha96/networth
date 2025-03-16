import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define env variables to be used in client-side code
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY,
      ),
      "import.meta.env.VITE_USE_SUPABASE": JSON.stringify(
        env.VITE_USE_SUPABASE,
      ),
      // Replace console.debug with empty function in production
      ...(isProd ? { "console.debug": "(() => {})" } : {})
    },
    build: {
      // In production, also remove console.debug when minifying
      minify: isProd,
      terserOptions: isProd ? {
        compress: {
          drop_console: false, // Don't drop all console statements
          pure_funcs: ['console.debug'], // Only remove console.debug
        }
      } : undefined,
    },
  };
});
