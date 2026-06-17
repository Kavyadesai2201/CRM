// /server/routes/notes.js
//
// Note management endpoints for leads
// All endpoints require JWT authentication
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import {
  getNotesByLead,
  addNote,
  deleteNote,
} from "../controllers/notesController.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// GET /api/notes/:leadId — Get all notes for a lead
router.get("/:leadId", authenticate, getNotesByLead);

// POST /api/notes/:leadId — Add a note to a lead
router.post("/:leadId", authenticate, addNote);

// DELETE /api/notes/:leadId/:noteId — Delete a note (admin or author only)
router.delete("/:leadId/:noteId", authenticate, deleteNote);

export default router;
