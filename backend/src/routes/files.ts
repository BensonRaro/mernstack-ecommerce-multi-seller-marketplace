import { Router } from "express";
import { UTApi } from "uploadthing/server";
import { requireAuth } from "../middlewares/require-auth.js";

const router = Router();
const utapi = new UTApi();

router.delete("/", requireAuth, async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey || typeof fileKey !== "string") {
      return res.status(400).json({ error: "fileKey is required" });
    }

    const result = await utapi.deleteFiles(fileKey);

    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: "Failed to delete file" });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
