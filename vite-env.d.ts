/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KFTC_CLIENT_ID: string;
  readonly VITE_KFTC_CLIENT_SECRET: string;
  readonly VITE_KFTC_CALLBACK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
