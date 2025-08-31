interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_API_URL: string;
  // Adicione outras variáveis aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}