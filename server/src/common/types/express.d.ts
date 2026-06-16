import "express";

/** Set by middleware/auth.ts after session validation — never from the client. */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        timezone: string;
        settings: Record<string, unknown>;
      };
    }
  }
}

export {};
