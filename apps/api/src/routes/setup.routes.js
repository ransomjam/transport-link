import { Router } from "express";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const setupRouter = Router();

function setupSecretMatches(headerValue) {
  return Boolean(env.SETUP_SECRET) && headerValue === env.SETUP_SECRET;
}

setupRouter.post("/setup/admin", async (req, res, next) => {
  try {
    if (!setupSecretMatches(req.get("x-setup-secret"))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!env.SETUP_ADMIN_EMAIL || !env.SETUP_ADMIN_PASSWORD) {
      return res.status(500).json({ message: "Setup admin environment variables are not configured" });
    }

    const passwordHash = await bcrypt.hash(env.SETUP_ADMIN_PASSWORD, 12);

    await prisma.user.upsert({
      where: { email: env.SETUP_ADMIN_EMAIL },
      update: {
        name: "Super Admin",
        passwordHash,
        role: "super_admin"
      },
      create: {
        name: "Super Admin",
        email: env.SETUP_ADMIN_EMAIL,
        passwordHash,
        role: "super_admin"
      }
    });

    return res.json({ message: "Admin account created/updated successfully" });
  } catch (error) {
    return next(error);
  }
});
