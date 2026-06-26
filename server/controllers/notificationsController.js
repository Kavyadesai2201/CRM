// /server/controllers/notificationsController.js
import pool from '../db/pool.js';

export const getNotifications = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, message, lead_id, read, created_at
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllRead = async (_req, res) => {
  try {
    await pool.query(`UPDATE notifications SET read = TRUE WHERE read = FALSE`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
