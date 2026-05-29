import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAdmin(req, res, next) {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (!["admin", "super_admin"].includes(payload.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
