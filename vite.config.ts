import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";
  process.env.NODE_ENV = isProd ? "production" : "development";

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
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY,
      ),
      "import.meta.env.VITE_USE_SUPABASE": JSON.stringify(
        env.VITE_USE_SUPABASE,
      ),
    },
    esbuild: {
      pure: isProd
        ? [
            "console.log",
            "console.info",
            "console.debug",
            // Keep error and warning logs for debugging
            // 'console.warn',
            // 'console.error',
            "console.trace",
          ]
        : [],
      logLevel: "error",
    },
    build: {
      minify: isProd,
      drop: isProd ? ["debugger"] : [], // Keep console logs for debugging
    },
  };
});
