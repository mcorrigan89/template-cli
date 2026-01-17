/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly SERVER_URL?: string;
  readonly CLIENT_URL?: string;
  readonly NODE_ENV?: string;
  readonly ENABLE_MAINTENANCE_MODE?: string;
  [key: string]: string | undefined;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
