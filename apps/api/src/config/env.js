import "dotenv/config";
import { z } from "zod";

const DEFAULT_JWT_SECRET = "development-only-change-this-secret";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(24).default(DEFAULT_JWT_SECRET),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001"),
  // Base URL of an OSRM-compatible routing server. Defaults to the public demo
  // server; point this at a self-hosted instance for production.
  OSRM_URL: z.string().url().default("https://router.project-osrm.org"),
  ROUTE_TIMEOUT_MS: z.coerce.number().int().positive().default(7000)
});

const parsedEnv = schema.parse(process.env);

if (parsedEnv.NODE_ENV === "production") {
  if (!parsedEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when NODE_ENV=production.");
  }

  if (!parsedEnv.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is required when NODE_ENV=production.");
  }

  if (parsedEnv.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error("JWT_SECRET must be set to a long random secret when NODE_ENV=production.");
  }
}

export const env = parsedEnv;
