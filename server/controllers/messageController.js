// /server/controllers/messageController.js
import pool from '../db/pool.js';

/**
 * GET /api/messages/recent?limit=20&before=<ISO timestamp>
 *
 * Returns the most recent messages across all leads, with cursor-based
 * pagination via `before` (exclusive upper bound on sent_at).
 *
 * Response:
 *   { messages: [...], nextCursor: "<ISO>" | null }
 */
export const getRecent = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const before = req.query.before;

  try {
    const params = [];
    let whereClause = '';

    if (before) {
      params.push(before);
      whereClause = `WHERE m.sent_at < $${params.length}`;
    }

    params.push(limit);

    const { rows } = await pool.query(
      `SELECT m.id,
              m.lead_id,
              l.name        AS lead_name,
              l.phone,
              l.instagram_id,
              m.channel,
              m.direction,
              m.content,
              m.sent_at
       FROM   messages m
       JOIN   leads    l ON l.id = m.lead_id
       ${whereClause}
       ORDER  BY m.sent_at DESC
       LIMIT  $${params.length}`,
      params
    );

    const nextCursor = rows.length === limit
      ? rows[rows.length - 1].sent_at
      : null;

    res.json({ messages: rows, nextCursor });
  } catch (err) {
    console.error('[messageController] Error fetching recent messages:', err.message);
    res.status(500).json({ error: err.message });
  }
};
