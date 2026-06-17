// /server/routes/webhooks.js
//
// Unified webhook router — mounted at /api/webhooks
// Covers: WhatsApp Cloud API + Instagram Graph API
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
  verifyInstagramWebhook,
  handleInstagramWebhook,
} from "../controllers/webhookController.js";

const router = Router();

// ── WhatsApp ─────────────────────────────────────────────────────────────────
// GET  /api/webhooks/whatsapp  — Meta verification handshake
// POST /api/webhooks/whatsapp  — Inbound messages
router.get ("/whatsapp", verifyWhatsAppWebhook);
router.post("/whatsapp", handleWhatsAppWebhook);

// ── Instagram ─────────────────────────────────────────────────────────────────
// GET  /api/webhooks/instagram — Meta verification handshake
// POST /api/webhooks/instagram — Inbound DMs
router.get ("/instagram", verifyInstagramWebhook);
router.post("/instagram", handleInstagramWebhook);

export default router;
