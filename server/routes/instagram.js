// /server/routes/instagram.js
//
// Legacy Instagram functionality — comment replies only.
// DM webhooks are handled by /api/webhooks/instagram (see routes/webhooks.js)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { replyToComment } from "../controllers/instagramController.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// POST /api/instagram/reply — authenticated endpoint to reply to Instagram comments
router.post("/reply", authenticate, replyToComment);

export default router;
