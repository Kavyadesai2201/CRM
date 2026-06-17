-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                      CRM DATABASE SCHEMA                                 ║
-- ║                  Complete PostgreSQL Schema Reference                   ║
-- ║                                                                          ║
-- ║  This file documents the complete database schema. The actual schema    ║
-- ║  is created and maintained in /server/db/migrate.js using idempotent  ║
-- ║  CREATE TABLE IF NOT EXISTS statements for production deployments.     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
--  USERS TABLE — Team members and CRM agents
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  role             VARCHAR(30) DEFAULT 'sales_rep',           -- admin, sales_rep, viewer
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ─────────────────────────────────────────────────────────────────────────────
--  LEADS TABLE — Core CRM entities (prospects/customers)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  name             VARCHAR(150),
  email            VARCHAR(150),
  phone            VARCHAR(30),                              -- WhatsApp phone number
  instagram_id     VARCHAR(80),                              -- Instagram PSID
  company          VARCHAR(150),

  -- Sales pipeline
  stage            VARCHAR(50) DEFAULT 'new',                -- new, contacted, qualified, proposal_sent, closed_won, closed_lost
  source           VARCHAR(80),                              -- whatsapp, instagram, web, email, manual
  deal_value       NUMERIC(12,2) DEFAULT 0,

  -- Team assignment
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Communication tracking
  last_message     TEXT,                                     -- Most recent inbound message
  last_activity_at TIMESTAMPTZ,                              -- Timestamp of last interaction

  -- Metadata
  notes            TEXT,                                     -- Deprecated: use notes table instead
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate leads per channel
CREATE UNIQUE INDEX idx_leads_phone ON leads (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_instagram_id ON leads (instagram_id) WHERE instagram_id IS NOT NULL;

-- Query optimization indexes
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_last_activity_at ON leads(last_activity_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
--  MESSAGES TABLE — Communication history (email, WhatsApp, Instagram, SMS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Message metadata
  direction        VARCHAR(20) NOT NULL,                     -- inbound, outbound
  channel          VARCHAR(20) NOT NULL,                     -- whatsapp, instagram, email, sms
  content          TEXT NOT NULL,

  -- Timestamps
  sent_at          TIMESTAMPTZ NOT NULL,                     -- When message was sent
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Query optimization
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_channel ON messages(channel);

-- ─────────────────────────────────────────────────────────────────────────────
--  NOTES TABLE — Agent annotations on leads
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id        UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Content
  body             TEXT NOT NULL,

  -- Timestamps
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Query optimization
CREATE INDEX idx_notes_lead_id ON notes(lead_id);
CREATE INDEX idx_notes_author_id ON notes(author_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
--  ACTIVITIES TABLE — Audit trail and historical events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event metadata
  type             VARCHAR(50),                              -- stage_change, note_added, assigned, etc.
  note             TEXT,

  -- Timestamp
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Query optimization
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
--  SAMPLE QUERIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Get all leads with their assigned agent
-- SELECT l.id, l.name, l.email, l.stage, u.name as assigned_agent
-- FROM leads l
-- LEFT JOIN users u ON l.assigned_to = u.id
-- ORDER BY l.last_activity_at DESC;

-- Get conversation thread for a lead
-- SELECT id, direction, channel, content, sent_at
-- FROM messages
-- WHERE lead_id = 'xxx-xxx-xxx'
-- ORDER BY sent_at ASC;

-- Get lead with all notes
-- SELECT n.id, n.body, u.name as author, n.created_at
-- FROM notes n
-- LEFT JOIN users u ON n.author_id = u.id
-- WHERE n.lead_id = 'xxx-xxx-xxx'
-- ORDER BY n.created_at DESC;

-- Get leads by stage with counts
-- SELECT stage, COUNT(*) as count
-- FROM leads
-- GROUP BY stage
-- ORDER BY CASE WHEN stage = 'new' THEN 1
--               WHEN stage = 'contacted' THEN 2
--               WHEN stage = 'qualified' THEN 3
--               WHEN stage = 'proposal_sent' THEN 4
--               WHEN stage = 'closed_won' THEN 5
--               WHEN stage = 'closed_lost' THEN 6
--               ELSE 7 END;

-- Get leads by source with counts
-- SELECT source, COUNT(*) as count
-- FROM leads
-- WHERE source IS NOT NULL
-- GROUP BY source
-- ORDER BY count DESC;

-- Get new leads created today
-- SELECT id, name, email, source, created_at
-- FROM leads
-- WHERE DATE(created_at) = CURRENT_DATE
-- ORDER BY created_at DESC;

-- Get leads assigned to a specific user
-- SELECT id, name, email, stage, last_activity_at
-- FROM leads
-- WHERE assigned_to = 'user-uuid-here'
-- ORDER BY last_activity_at DESC;

-- Calculate conversion funnel
-- SELECT stage,
--        COUNT(*) as leads,
--        ROUND(COUNT(*)*100.0/NULLIF(SUM(COUNT(*)) OVER (),0),2) as percentage
-- FROM leads
-- GROUP BY stage
-- ORDER BY CASE WHEN stage = 'new' THEN 1
--               WHEN stage = 'contacted' THEN 2
--               WHEN stage = 'qualified' THEN 3
--               WHEN stage = 'proposal_sent' THEN 4
--               WHEN stage = 'closed_won' THEN 5
--               WHEN stage = 'closed_lost' THEN 6
--               ELSE 7 END;

-- Calculate total deal value by stage
-- SELECT stage, SUM(deal_value) as total_value
-- FROM leads
-- WHERE stage IN ('proposal_sent', 'closed_won')
-- GROUP BY stage
-- ORDER BY total_value DESC;
