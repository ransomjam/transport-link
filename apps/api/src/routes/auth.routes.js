import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { signAdminToken } from "../lib/tokens.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post("/auth/login", async (req, res, next) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: signAdminToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/auth/me", requireAdmin, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/auth/logout", requireAdmin, (_req, res) => {
  res.json({ message: "Logged out" });
});
