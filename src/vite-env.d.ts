/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_GITHUB_TOKEN: string
  readonly VITE_LEARNING_WEBHOOK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}