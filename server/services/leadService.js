// /server/services/leadService.js
import pool from "../db/pool.js";
import bus  from "../events.js";

/**
 * Upsert a lead based on phone or instagramId.
 *
 * Logic:
 *   1. Try to find an existing lead matching phone OR instagramId.
 *   2. If found  → update last_message + last_activity_at + any new fields.
 *   3. If not    → insert a new lead row.
 *
 * After persisting an inbound message, emits an SSE event on the bus so all
 * connected clients receive it in real time.
 *
 * @param {Object} data
 * @param {string} [data.phone]        - Sender phone number  (WhatsApp)
 * @param {string} [data.instagramId]  - Sender PSID          (Instagram)
 * @param {string} [data.lastMessage]  - Most recent message text
 * @param {string} [data.source]       - "whatsapp" | "instagram"
 * @param {string} [data.name]         - Optional display name
 * @param {Date}   [data.sentAt]       - Message timestamp
 * @returns {Promise<Object>} The upserted lead row
 */
export async function upsertLead({ phone, instagramId, lastMessage, source, name, sentAt }) {
  const client = await pool.connect();
  try {
    // ── 1. Look for existing lead ─────────────────────────────────────────────
    let existing = null;

    if (phone) {
      const { rows } = await client.query(
        "SELECT * FROM leads WHERE phone = $1 LIMIT 1",
        [phone]
      );
      existing = rows[0] ?? null;
    }

    if (!existing && instagramId) {
      const { rows } = await client.query(
        "SELECT * FROM leads WHERE instagram_id = $1 LIMIT 1",
        [instagramId]
      );
      existing = rows[0] ?? null;
    }

    const msgSentAt = sentAt ?? new Date();

    // ── 2. Update existing lead ───────────────────────────────────────────────
    if (existing) {
      const { rows } = await client.query(
        `UPDATE leads
            SET last_message       = $1,
                last_activity_at   = NOW(),
                phone              = COALESCE($2, phone),
                instagram_id       = COALESCE($3, instagram_id),
                updated_at         = NOW()
          WHERE id = $4
          RETURNING *`,
        [lastMessage, phone ?? null, instagramId ?? null, existing.id]
      );
      const lead = rows[0];
      console.log(`[leadService] Updated lead ${lead.id} (${source})`);

      if (lastMessage) {
        const { rows: msgRows } = await client.query(
          `INSERT INTO messages (lead_id, direction, channel, content, sent_at)
           VALUES ($1, 'inbound', $2, $3, $4) RETURNING *`,
          [lead.id, source, lastMessage, msgSentAt]
        );
        bus.emit('event', {
          type: 'message',
          payload: {
            ...msgRows[0],
            lead_name:    lead.name,
            phone:        lead.phone,
            instagram_id: lead.instagram_id,
          },
        });
      }
      return lead;
    }

    // ── 3. Insert new lead ────────────────────────────────────────────────────
    const { rows } = await client.query(
      `INSERT INTO leads
         (name, phone, instagram_id, last_message, last_activity_at, source, stage)
       VALUES ($1, $2, $3, $4, NOW(), $5, 'new')
       RETURNING *`,
      [
        name ?? (phone ? `WA:${phone}` : `IG:${instagramId}`),
        phone ?? null,
        instagramId ?? null,
        lastMessage,
        source,
      ]
    );
    const lead = rows[0];
    console.log(`[leadService] Created lead ${lead.id} (${source})`);

    if (lastMessage) {
      const { rows: msgRows } = await client.query(
        `INSERT INTO messages (lead_id, direction, channel, content, sent_at)
         VALUES ($1, 'inbound', $2, $3, $4) RETURNING *`,
        [lead.id, source, lastMessage, msgSentAt]
      );
      bus.emit('event', {
        type: 'message',
        payload: {
          ...msgRows[0],
          lead_name:    lead.name,
          phone:        lead.phone,
          instagram_id: lead.instagram_id,
        },
      });
    }
    return lead;
  } finally {
    client.release();
  }
}
