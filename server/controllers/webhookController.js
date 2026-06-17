// /server/controllers/webhookController.js
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║        WEBHOOKS: WhatsApp Cloud API + Instagram Graph API               ║
// ║                                                                          ║
// ║  Routes (all mounted under /api/webhooks):                              ║
// ║    GET  /whatsapp  — Meta verification handshake                        ║
// ║    POST /whatsapp  — Inbound messages (HMAC-SHA256 verified)            ║
// ║    GET  /instagram — Meta verification handshake                        ║
// ║    POST /instagram — Inbound DMs     (HMAC-SHA256 verified)             ║
// ║                                                                          ║
// ║  Route mounted elsewhere:                                               ║
// ║    POST /api/whatsapp/send — Send WhatsApp message (JWT required)       ║
// ║                                                                          ║
// ║  CRITICAL: POST webhook handlers must ALWAYS return HTTP 200 to Meta   ║
// ║  after signature verification passes, even on parse/DB errors.         ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import crypto from 'crypto';
import axios  from 'axios';
import pool   from '../db/pool.js';
import { upsertLead } from '../services/leadService.js';

// ═══════════════════════════════════════════════════════════════════════════
//  HMAC helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify Meta's X-Hub-Signature-256 header.
 * Returns true when the signature matches, false otherwise.
 * When `secret` is not configured (local dev without credentials) the check
 * is skipped and we return true with a warning — set the env var in prod.
 */
function verifyHmac(secret, signatureHeader, rawBody) {
  if (!secret) {
    console.warn('[Webhook] App secret not configured — skipping HMAC check (set in prod)');
    return true;
  }
  if (!signatureHeader || !rawBody) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    // timingSafeEqual requires equal-length buffers
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

// ═══════════════════════════════════════════════════════════════════════════
//  WHATSAPP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/webhooks/whatsapp
 * Meta verification handshake — echoes hub.challenge back on token match.
 */
export const verifyWhatsAppWebhook = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified ✅');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp] Webhook verification failed — token mismatch');
  return res.sendStatus(403);
};

/**
 * POST /api/webhooks/whatsapp
 * Receives inbound text messages from WhatsApp Cloud API.
 * Rejects requests with a bad or missing X-Hub-Signature-256.
 */
export const handleWhatsAppWebhook = async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!verifyHmac(process.env.WHATSAPP_APP_SECRET, signature, req.rawBody)) {
    console.warn('[WhatsApp] Rejected webhook — bad signature');
    return res.sendStatus(403);
  }

  // Acknowledge immediately so Meta does not retry
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      console.warn('[WhatsApp] Unexpected object type:', body.object);
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value    = change.value ?? {};
        const messages = value.messages ?? [];
        const contacts = value.contacts ?? [];

        for (const msg of messages) {
          if (msg.type !== 'text') {
            console.log(`[WhatsApp] Non-text message type "${msg.type}" — skipped`);
            continue;
          }

          const phone       = msg.from;
          const messageText = msg.text?.body ?? '';
          const messageId   = msg.id;
          const sentAt      = new Date(Number(msg.timestamp) * 1000);
          const senderName  = contacts.find(c => c.wa_id === phone)?.profile?.name;

          console.log(
            `[WhatsApp] Message from ${phone} | id=${messageId} | time=${sentAt.toISOString()}` +
            `\n  text: "${messageText}"`
          );

          await upsertLead({
            phone,
            name:        senderName,
            lastMessage: messageText,
            source:      'whatsapp',
            sentAt,
          });
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Error processing webhook payload:', err.message);
    console.error('[WhatsApp] Raw body:', JSON.stringify(req.body, null, 2));
  }
};

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp text message via Cloud API (JWT-authenticated).
 * Persists the outbound message after a successful Meta API call.
 */
export const sendWhatsAppMessage = async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "'to' and 'message' are required" });
  }

  try {
    const { data } = await axios.post(
      `${GRAPH_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to,
        type:              'text',
        text:              { preview_url: false, body: message },
      },
      {
        headers: {
          Authorization:  `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Message sent to ${to} | message_id=${data.messages?.[0]?.id}`);

    // Persist outbound message — best-effort, never block the response
    try {
      const { rows } = await pool.query(
        'SELECT id FROM leads WHERE phone = $1 LIMIT 1',
        [to]
      );
      if (rows.length) {
        await pool.query(
          `INSERT INTO messages (lead_id, direction, channel, content, sent_at)
           VALUES ($1, 'outbound', 'whatsapp', $2, NOW())`,
          [rows[0].id, message]
        );
      }
    } catch (dbErr) {
      console.error('[WhatsApp] Failed to persist outbound message:', dbErr.message);
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    const errData = err.response?.data ?? err.message;
    console.error('[WhatsApp] Send error:', JSON.stringify(errData, null, 2));
    return res.status(500).json({ error: errData });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  INSTAGRAM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/webhooks/instagram
 * Meta verification handshake — uses INSTAGRAM_VERIFY_TOKEN.
 */
export const verifyInstagramWebhook = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log('[Instagram] Webhook verified ✅');
    return res.status(200).send(challenge);
  }

  console.warn('[Instagram] Webhook verification failed — token mismatch');
  return res.sendStatus(403);
};

/**
 * POST /api/webhooks/instagram
 * Receives inbound DMs from Instagram Graph API.
 * Rejects requests with a bad or missing X-Hub-Signature-256.
 */
export const handleInstagramWebhook = async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!verifyHmac(process.env.INSTAGRAM_APP_SECRET, signature, req.rawBody)) {
    console.warn('[Instagram] Rejected webhook — bad signature');
    return res.sendStatus(403);
  }

  // Acknowledge immediately
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== 'instagram') {
      console.warn('[Instagram] Unexpected object type:', body.object);
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const senderId    = event.sender?.id;
        const messageText = event.message?.text ?? '';
        const messageId   = event.message?.mid;
        const sentAt      = new Date(event.timestamp);

        if (!messageText) {
          console.log(`[Instagram] Non-text event from ${senderId} — skipped`);
          continue;
        }

        console.log(
          `[Instagram] DM from PSID=${senderId} | mid=${messageId} | time=${sentAt.toISOString()}` +
          `\n  text: "${messageText}"`
        );

        await upsertLead({
          instagramId: senderId,
          lastMessage: messageText,
          source:      'instagram',
          sentAt,
        });
      }
    }
  } catch (err) {
    console.error('[Instagram] Error processing webhook payload:', err.message);
    console.error('[Instagram] Raw body:', JSON.stringify(req.body, null, 2));
  }
};
