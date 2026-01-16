/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-safe variables
  readonly VITE_APP_NAME?: string;

  // Add more client env variables here as you define them in client.ts
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
