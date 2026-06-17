// /server/controllers/aiController.js
import pool from '../db/pool.js';
import { generateAI } from '../services/aiService.js';

const VALID_MODES = new Set(['summary', 'suggest_reply']);

export const leadAI = async (req, res) => {
  const { id }   = req.params;
  const { mode } = req.body;

  if (!mode || !VALID_MODES.has(mode)) {
    return res.status(400).json({ error: 'mode must be "summary" or "suggest_reply"' });
  }

  try {
    // Load lead
    const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (!leadRes.rows.length) return res.status(404).json({ error: 'Lead not found' });
    const lead = leadRes.rows[0];

    // Latest 30 messages, returned in chronological order
    const msgRes = await pool.query(
      `SELECT direction, channel, content, sent_at
       FROM messages
       WHERE lead_id = $1
       ORDER BY sent_at DESC
       LIMIT 30`,
      [id]
    );
    const messages = msgRes.rows.reverse();

    const result = await generateAI({ mode, lead, messages });
    res.json({ result });
  } catch (err) {
    console.error('[aiController]', err.message);
    res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
};
