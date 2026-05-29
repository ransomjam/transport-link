import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(24).default("development-only-change-this-secret"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Base URL of an OSRM-compatible routing server. Defaults to the public demo
  // server; point this at a self-hosted instance for production.
  OSRM_URL: z.string().url().default("https://router.project-osrm.org"),
  ROUTE_TIMEOUT_MS: z.coerce.number().int().positive().default(7000)
});

export const env = schema.parse(process.env);
