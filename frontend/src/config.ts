const DEFAULT_API_BASE =
  (import.meta as any).env?.MODE === 'production'
    ? 'http://localhost:8000'
    : 'http://127.0.0.1:8000';

export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL ?? DEFAULT_API_BASE;
