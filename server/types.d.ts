declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      avatar_url: string | null;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CALLBACK_URL: string;
      JWT_SECRET: string;
      GOOGLE_AI_API_KEY: string;
      TURSO_URL: string;
      TURSO_AUTH_TOKEN: string;
      CLIENT_URL?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      PORT?: string;
      GEMINI_DAILY_TOKEN_LIMIT?: string;
    }
  }
}

export {};
