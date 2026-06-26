// /server/controllers/analyticsController.js
import pool from "../db/pool.js";

export const getDashboardStats = async (_req, res) => {
  try {
    // Get all dashboard metrics with a single efficient query
    const { rows: dashboardData } = await pool.query(`
      SELECT
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date) as new_today,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = ((NOW() AT TIME ZONE 'Asia/Kolkata') - INTERVAL '1 day')::date) as new_yesterday,
        COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days') AS new_leads_30d,
        COUNT(*) FILTER (WHERE stage='closed_won') AS total_won,
        COUNT(*) FILTER (WHERE stage='closed_lost') AS total_lost,
        SUM(deal_value) FILTER (WHERE stage='closed_won') AS total_revenue,
        SUM(deal_value) AS pipeline_value
      FROM leads
    `);

    // Get breakdown by source
    const { rows: bySourceRows } = await pool.query(
      `SELECT source, COUNT(*) as count
       FROM leads
       WHERE source IS NOT NULL
       GROUP BY source
       ORDER BY count DESC`
    );

    // Convert source array to object
    const bySource = {};
    bySourceRows.forEach(row => {
      bySource[row.source] = row.count;
    });

    // Get breakdown by stage
    const { rows: byStageRows } = await pool.query(
      `SELECT stage, COUNT(*) as count
       FROM leads
       GROUP BY stage
       ORDER BY CASE
         WHEN stage = 'new' THEN 1
         WHEN stage = 'contacted' THEN 2
         WHEN stage = 'qualified' THEN 3
         WHEN stage = 'proposal' THEN 4
         WHEN stage = 'closed_won' THEN 5
         WHEN stage = 'closed_lost' THEN 6
         ELSE 7 END`
    );

    // Convert stage array to object
    const byStage = {};
    byStageRows.forEach(row => {
      byStage[row.stage] = row.count;
    });

    const stats = dashboardData[0];

    // Return enhanced dashboard stats
    res.json({
      totalLeads:   parseInt(stats.total_leads,    10),
      newToday:     parseInt(stats.new_today,      10),
      newYesterday: parseInt(stats.new_yesterday,  10),
      bySource,
      byStage,
      new_leads_30d: parseInt(stats.new_leads_30d, 10),
      total_won:     parseInt(stats.total_won,     10),
      total_lost:    parseInt(stats.total_lost,    10),
      total_revenue: parseFloat(stats.total_revenue) || 0,
      pipeline_value: parseFloat(stats.pipeline_value) || 0,
    });
  } catch (err) {
    console.error("[analyticsController] Error getting dashboard stats:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getLeadsBySource = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getConversionReport = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT stage, COUNT(*) as count,
        ROUND(COUNT(*)*100.0/NULLIF(SUM(COUNT(*)) OVER (),0),2) AS percentage
      FROM leads GROUP BY stage
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getRevenueTimeline = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DATE_TRUNC('month', updated_at AT TIME ZONE 'Asia/Kolkata') AS month,
        SUM(deal_value) AS revenue
      FROM leads WHERE stage='closed_won'
      GROUP BY month ORDER BY month
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
