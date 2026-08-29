import type { Request, Response, NextFunction } from "express";

export function requireSeller(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (session.user.role !== "seller") {
    return res.status(403).json({ error: "Forbidden: seller access required" });
  }

  next();
}
