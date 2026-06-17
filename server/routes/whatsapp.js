// /server/routes/whatsapp.js
//
// Only /api/whatsapp/send lives here.
// Webhook GET/POST are handled by /api/webhooks/whatsapp (routes/webhooks.js)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { sendWhatsAppMessage } from "../controllers/webhookController.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// POST /api/whatsapp/send  — requires a valid JWT
router.post("/send", authenticate, sendWhatsAppMessage);

export default router;
