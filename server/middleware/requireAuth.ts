import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

// Extend Express Request to carry the verified userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/**
 * Middleware that verifies the Supabase JWT from the Authorization header.
 * Sets req.userId on success; returns 401 on failure.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = user.id;
  next();
}
