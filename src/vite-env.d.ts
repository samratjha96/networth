/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string;
  readonly VITE_POCKETBASE_TEST_USER_EMAIL: string;
  readonly VITE_POCKETBASE_TEST_USER_PASSWORD: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
