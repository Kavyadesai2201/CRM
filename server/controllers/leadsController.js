// /server/controllers/leadsController.js
import pool from "../db/pool.js";

const LEAD_ORDER = {
  last_activity_at: "COALESCE(m.sent_at, l.created_at) DESC",
};

export const getAllLeads = async (req, res) => {
  try {
    const { stage, source, search, page = 1, limit = 20, orderBy } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (stage)  { params.push(stage);  where += ` AND l.stage=$${params.length}`; }
    if (source) { params.push(source); where += ` AND l.source=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (l.name ILIKE $${params.length} OR l.email ILIKE $${params.length} OR l.phone::text ILIKE $${params.length})`;
    }
    const orderClause = LEAD_ORDER[orderBy] ?? "l.created_at DESC";
    const query = `
      SELECT l.*,
             m.content   AS last_message,
             m.sent_at   AS last_message_at,
             m.direction AS last_message_direction
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT content, sent_at, direction FROM messages
        WHERE lead_id = l.id
        ORDER BY sent_at DESC
        LIMIT 1
      ) m ON true
      ${where}
      ORDER BY ${orderClause}
      LIMIT $${params.length+1} OFFSET $${params.length+2}
    `;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const { rows } = await pool.query(query, params);
    res.json({ data: rows, page: +page, limit: +limit });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getLeadById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM leads WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Lead not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createLead = async (req, res) => {
  const { name, email, phone, company, stage = "new", source, notes, deal_value } = req.body;

  if (!name || !String(name).trim())
    return res.status(400).json({ error: "Name is required" });
  if (!phone || !String(phone).trim())
    return res.status(400).json({ error: "Phone number is required" });
  if (email && !EMAIL_RE.test(String(email).trim()))
    return res.status(400).json({ error: "Invalid email address" });
  if (deal_value !== undefined && deal_value !== null && deal_value !== "" &&
      (isNaN(Number(deal_value)) || Number(deal_value) < 0))
    return res.status(400).json({ error: "Deal value must be a non-negative number" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO leads
         (name, email, phone, company, stage, source, notes, deal_value, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        String(name).trim(),
        email ? String(email).trim() : null,
        phone   || null,
        company || null,
        stage   || "new",
        source  || null,
        notes   || null,
        deal_value !== undefined && deal_value !== null && deal_value !== ""
          ? Number(deal_value)
          : null,
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateLead = async (req, res) => {
  const { name, email, phone, company, stage, source, notes, assigned_to } = req.body;

  try {
    // Verify assigned_to user exists if provided
    if (assigned_to) {
      const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [assigned_to]);
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }
    }

    const { rows } = await pool.query(
      "UPDATE leads SET name=$1,email=$2,phone=$3,company=$4,stage=$5,source=$6,notes=$7,assigned_to=$8,updated_at=NOW() WHERE id=$9 RETURNING *",
      [name, email, phone, company, stage, source, notes, assigned_to || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Lead not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[leadsController] Error updating lead:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM leads WHERE id=$1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Lead not found" });
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
};
