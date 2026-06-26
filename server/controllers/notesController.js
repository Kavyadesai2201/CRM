// /server/controllers/notesController.js
//
// Note management for leads - agent annotations and internal comments
// ─────────────────────────────────────────────────────────────────────────────

import pool from "../db/pool.js";
import { createNotification } from "../services/notificationService.js";

/**
 * GET /api/leads/:leadId/notes
 * Retrieve all notes for a lead with author information.
 *
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Notes per page (default: 50)
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "lead_id": "uuid",
 *       "author_id": "uuid",
 *       "author_name": "John Smith",
 *       "body": "Customer is interested in the pro plan",
 *       "created_at": "2024-06-11T10:30:00Z"
 *     }
 *   ],
 *   "pagination": { "page": 1, "limit": 50, "total": 12, "pages": 1 }
 * }
 */
export const getNotesByLead = async (req, res) => {
  const { leadId } = req.params;
  let { page = 1, limit = 50 } = req.query;

  // Validation
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));

  const offset = (page - 1) * limit;

  try {
    // Verify lead exists
    const leadCheck = await pool.query("SELECT id FROM leads WHERE id = $1", [
      leadId,
    ]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Get total count
    const countRes = await pool.query(
      "SELECT COUNT(*) as total FROM notes WHERE lead_id = $1",
      [leadId]
    );
    const total = parseInt(countRes.rows[0].total, 10);

    // Get paginated notes with author info
    const notesRes = await pool.query(
      `SELECT n.id, n.lead_id, n.author_id, u.name as author_name, n.body, n.created_at
       FROM notes n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.lead_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [leadId, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: notesRes.rows,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error("[notesController] Error fetching notes:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/leads/:leadId/notes
 * Add a note to a lead (internal team comment).
 *
 * Body: { body: "Customer requesting demo next week" }
 *
 * Response:
 * {
 *   "id": "uuid",
 *   "lead_id": "uuid",
 *   "author_id": "uuid",
 *   "author_name": "John Smith",
 *   "body": "Customer requesting demo next week",
 *   "created_at": "2024-06-11T10:30:00Z"
 * }
 */
export const addNote = async (req, res) => {
  const { leadId } = req.params;
  const { body } = req.body;

  // Validation
  if (!body || typeof body !== "string" || body.trim() === "") {
    return res.status(400).json({ error: "Note body is required and cannot be empty" });
  }

  if (body.length > 10000) {
    return res.status(400).json({ error: "Note body cannot exceed 10,000 characters" });
  }

  try {
    // Verify lead exists
    const leadCheck = await pool.query("SELECT id FROM leads WHERE id = $1", [
      leadId,
    ]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Insert note
    const { rows } = await pool.query(
      `INSERT INTO notes (lead_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, lead_id, author_id, body, created_at`,
      [leadId, req.user.id, body.trim()]
    );

    const note = rows[0];

    // Get author name
    const authorRes = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [req.user.id]
    );
    const authorName = authorRes.rows[0]?.name || "Unknown";

    console.log(`[notesController] Note added to lead ${leadId} by ${authorName}`);

    // Get lead name for the notification message
    const leadRes = await pool.query('SELECT name FROM leads WHERE id = $1', [leadId]);
    const leadName = leadRes.rows[0]?.name ?? 'a lead';
    createNotification({
      type:    'note_added',
      message: `Note added on ${leadName} by ${authorName}`,
      leadId,
    });

    res.status(201).json({
      ...note,
      author_name: authorName,
    });
  } catch (err) {
    console.error("[notesController] Error adding note:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/leads/:leadId/notes/:noteId
 * Delete a note (only by admin or author).
 *
 * Response: { message: "Note deleted" }
 */
export const deleteNote = async (req, res) => {
  const { leadId, noteId } = req.params;

  try {
    // Get the note
    const noteRes = await pool.query(
      "SELECT id, author_id FROM notes WHERE id = $1 AND lead_id = $2",
      [noteId, leadId]
    );

    if (noteRes.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    const note = noteRes.rows[0];

    // Check permission - admin or author
    if (req.user.role !== "admin" && req.user.id !== note.author_id) {
      return res.status(403).json({
        error: "Forbidden: Only admin or author can delete this note",
      });
    }

    // Delete
    await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);

    console.log(`[notesController] Note ${noteId} deleted`);

    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("[notesController] Error deleting note:", err.message);
    res.status(500).json({ error: err.message });
  }
};
