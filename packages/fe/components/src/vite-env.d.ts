/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_PORT: string;
  readonly VITE_API_URL: string;
  readonly VITE_NODE_ENV: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '@grrr/utils' {
  export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, wait: number): T;
}

declare module '@grrr/utils' {
  export function parseJson<T = unknown>(jsonString: string | null): T;
}

declare module 'dompurify' {
  interface DOMPurifyConfig {
    ALLOWED_TAGS?: string[];
    ALLOWED_ATTR?: string[];
    FORBID_TAGS?: string[];
    FORBID_ATTR?: string[];
    [key: string]: unknown;
  }

  const DOMPurify: {
    sanitize: (dirty: string, config?: DOMPurifyConfig) => string;
  };
  export default DOMPurify;
}
