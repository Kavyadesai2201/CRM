// /server/controllers/messagesController.js
//
// Message thread retrieval for leads.
// Supports multi-channel conversation history (WhatsApp, Instagram, Email, SMS)
// ─────────────────────────────────────────────────────────────────────────────

import pool from "../db/pool.js";

/**
 * GET /api/leads/:id/messages
 * Retrieve conversation thread for a lead.
 *
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Messages per page (default: 50, max: 500)
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "lead_id": "uuid",
 *       "direction": "inbound",
 *       "channel": "whatsapp",
 *       "content": "Hi there!",
 *       "sent_at": "2024-06-11T10:30:00Z",
 *       "created_at": "2024-06-11T10:30:05Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 50,
 *     "total": 125,
 *     "pages": 3
 *   }
 * }
 */
export const getLeadMessages = async (req, res) => {
  const { id } = req.params;
  let { page = 1, limit = 50 } = req.query;

  // Validation
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

  const offset = (page - 1) * limit;

  try {
    // Verify lead exists
    const leadCheck = await pool.query("SELECT id FROM leads WHERE id = $1", [
      id,
    ]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Get total count
    const countRes = await pool.query(
      "SELECT COUNT(*) as total FROM messages WHERE lead_id = $1",
      [id]
    );
    const total = parseInt(countRes.rows[0].total, 10);

    // Get paginated messages
    const messagesRes = await pool.query(
      `SELECT id, lead_id, direction, channel, content, sent_at, created_at
       FROM messages
       WHERE lead_id = $1
       ORDER BY sent_at ASC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: messagesRes.rows,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error("[messagesController] Error fetching messages:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Internal: Create a message record (called by webhook handlers)
 * Useful for webhook handlers to log incoming messages
 *
 * @param {string} leadId — Lead UUID
 * @param {string} direction — 'inbound' or 'outbound'
 * @param {string} channel — 'whatsapp', 'instagram', 'email', 'sms'
 * @param {string} content — Message text
 * @param {Date} sentAt — When the message was sent
 * @returns {Promise<Object>} Message row
 */
export const createMessage = async (
  leadId,
  direction,
  channel,
  content,
  sentAt
) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO messages (lead_id, direction, channel, content, sent_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [leadId, direction, channel, content, sentAt]
    );
    return rows[0];
  } finally {
    client.release();
  }
};
