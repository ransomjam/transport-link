import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAdminToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}
