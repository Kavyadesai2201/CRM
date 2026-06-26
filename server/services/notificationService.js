// /server/services/notificationService.js
import pool from '../db/pool.js';
import bus  from '../events.js';

/**
 * Insert a notification row and broadcast it over SSE.
 * Fire-and-forget safe — errors are logged, never thrown.
 */
export async function createNotification({ type, message, leadId = null }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (type, message, lead_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [type, message, leadId]
    );
    bus.emit('event', { type: 'notification', payload: rows[0] });
    return rows[0];
  } catch (err) {
    console.error('[notificationService] Failed to persist notification:', err.message);
  }
}
