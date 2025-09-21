/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_USE_SUPABASE: string;
  readonly VITE_SUPABASE_TEST_USER_EMAIL: string;
  readonly VITE_SUPABASE_TEST_USER_PASSWORD: string;
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_POCKETBASE_TEST_USER_EMAIL: string;
  readonly VITE_POCKETBASE_TEST_USER_PASSWORD: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
