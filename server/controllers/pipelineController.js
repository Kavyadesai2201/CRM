// /server/controllers/pipelineController.js
import pool from "../db/pool.js";
import bus  from "../events.js";

const STAGES = ["new","contacted","qualified","proposal","negotiation","closed_won","closed_lost"];

export const getPipelineStages = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT stage, COUNT(*) as count, SUM(deal_value) as total_value FROM leads GROUP BY stage"
    );
    const stageMap = Object.fromEntries(rows.map(r => [r.stage, r]));
    const result = STAGES.map(s => ({ stage: s, count: stageMap[s]?.count || 0, total_value: stageMap[s]?.total_value || 0 }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getPipelineStats = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) as total_leads, SUM(CASE WHEN stage='closed_won' THEN deal_value ELSE 0 END) as revenue, SUM(deal_value) as pipeline_value FROM leads"
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const moveLeadToStage = async (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ error: "Invalid stage" });
  try {
    const { rows } = await pool.query(
      "UPDATE leads SET stage=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [stage, req.params.leadId]
    );
    if (!rows.length) return res.status(404).json({ error: "Lead not found" });
    bus.emit('event', { type: 'stage', payload: { lead_id: req.params.leadId, stage } });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
