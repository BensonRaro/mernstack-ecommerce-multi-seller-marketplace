import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { Request, Response, NextFunction } from "express";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    (req as any).session = session;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
