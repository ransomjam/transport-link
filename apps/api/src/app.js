import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { shipmentsRouter } from "./routes/shipments.routes.js";
import { trackRouter } from "./routes/track.routes.js";
import messagesRouter from "./routes/messages.routes.js";

export const app = express();

const configuredOrigins = [env.FRONTEND_URL, ...env.CORS_ORIGIN.split(",")];
const allowedOrigins = configuredOrigins
  .map((origin) => origin?.trim())
  .filter(Boolean);

function isLocalDevelopmentOrigin(origin) {
  if (env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/", (_req, res) => {
  res.json({ message: "Goods Tracking API" });
});

app.use("/api", healthRouter);
app.use("/api", trackRouter);
app.use("/api", authRouter);
app.use("/api", adminRouter);
app.use("/api", shipmentsRouter);
app.use("/api/messages", messagesRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  if (error?.name === "ZodError") {
    return res.status(422).json({
      message: "Validation failed",
      issues: error.issues
    });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});
