interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENDPOINT_LOGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}