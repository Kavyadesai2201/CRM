// /server/controllers/instagramController.js
//
// Legacy Instagram functionality — comment replies only.
// DM webhook handling has been moved to webhookController.js
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import pool  from '../db/pool.js';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * POST /api/instagram/reply
 * Send a reply to an Instagram comment (requires authentication).
 *
 * Body: { commentId: "123456789", message: "Thanks!", leadId: "<uuid>" }
 *
 * `leadId` is optional — when provided, the outbound message is persisted
 * in the messages table so it appears in the Live Feed.
 */
export const replyToComment = async (req, res) => {
  const { commentId, message, leadId } = req.body;

  if (!commentId || !message) {
    return res.status(400).json({ error: "'commentId' and 'message' are required" });
  }

  try {
    const { data } = await axios.post(
      `${GRAPH_URL}/${commentId}/replies`,
      { message },
      { params: { access_token: process.env.INSTAGRAM_ACCESS_TOKEN } }
    );

    // Persist outbound message when we have a lead to attach it to
    if (leadId) {
      try {
        await pool.query(
          `INSERT INTO messages (lead_id, direction, channel, content, sent_at)
           VALUES ($1, 'outbound', 'instagram', $2, NOW())`,
          [leadId, message]
        );
      } catch (dbErr) {
        console.error('[Instagram] Failed to persist outbound message:', dbErr.message);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};
