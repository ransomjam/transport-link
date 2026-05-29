import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const database = {
    configured: Boolean(env.DATABASE_URL),
    connected: false
  };

  if (database.configured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database.connected = true;
    } catch (error) {
      database.error = error.message;
    }
  }

  res.json({
    message: "Server is running",
    database,
    timestamp: new Date().toISOString()
  });
});
