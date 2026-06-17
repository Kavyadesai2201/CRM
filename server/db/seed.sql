-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                         SAMPLE DATA — SEED.SQL                           ║
-- ║                                                                          ║
-- ║  This file contains sample data for testing the CRM backend:            ║
-- ║  - 2 sample users (admin + sales_rep)                                   ║
-- ║  - 5 sample leads across different stages and sources                   ║
-- ║  - Sample messages and notes for conversation history                   ║
-- ║                                                                          ║
-- ║  Run: psql $DATABASE_URL < server/db/seed.sql                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Clear existing data (re-seeding)
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE notes CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE users CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
--  SAMPLE USERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin user (password: admin123)
-- bcryptjs hash of 'admin123' with 12 rounds
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Alice Admin', 'alice@example.com',
 '$2a$12$U6N5LQ9GYMb3z4wkpmwED.tNDbD1idJN2UK82LbtIqEBsauyie8n6', 'admin',
 NOW() - INTERVAL '2 months'),

-- Sales rep user (password: sales123)
-- bcryptjs hash of 'sales123' with 12 rounds
('550e8400-e29b-41d4-a716-446655440002', 'Bob Sales', 'bob@example.com',
 '$2a$12$rugjf7fVn29WZQxQcyyY7eHMjP6Cf0NDOAMzgAXcKbJm6kDRKSykK', 'sales_rep',
 NOW() - INTERVAL '1 month');

-- ─────────────────────────────────────────────────────────────────────────────
--  SAMPLE LEADS (across different stages & sources)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO leads (
  id, name, email, phone, company, stage, source,
  deal_value, assigned_to, last_message, last_activity_at, created_at
) VALUES
  -- Lead 1: NEW (today, WhatsApp)
  ('550e8400-e29b-41d4-a716-446655550001', 'John Anderson', 'john@acme.com',
   '+14155552671', 'ACME Corp', 'new', 'whatsapp', 0,
   '550e8400-e29b-41d4-a716-446655440002',
   'Hi, I''m interested in learning more about your product',
   NOW(), NOW()),

  -- Lead 2: CONTACTED (2 days ago, Instagram)
  ('550e8400-e29b-41d4-a716-446655550002', 'Sarah Martinez', 'sarah.m@techstartup.io',
   NULL, 'Tech Startup Inc', 'contacted', 'instagram', 0,
   '550e8400-e29b-41d4-a716-446655440002',
   'When can we schedule a demo?',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Lead 3: QUALIFIED (1 week ago, web)
  ('550e8400-e29b-41d4-a716-446655550003', 'Michael Chen', 'michael@consulting.com',
   NULL, 'Consulting Group LLC', 'qualified', 'web', 25000,
   '550e8400-e29b-41d4-a716-446655440002',
   'We''ll need this integrated with Salesforce',
   NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),

  -- Lead 4: PROPOSAL_SENT (2 weeks ago, email)
  ('550e8400-e29b-41d4-a716-446655550004', 'Emily Rodriguez', 'emily.r@enterprise.com',
   '+12125559876', 'Enterprise Solutions', 'proposal_sent', 'email', 85000,
   '550e8400-e29b-41d4-a716-446655440002',
   'Please review the attached contract',
   NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

  -- Lead 5: CLOSED_WON (1 month ago, manual entry)
  ('550e8400-e29b-41d4-a716-446655550005', 'David Wilson', 'david@wincompany.com',
   NULL, 'Win Company Corp', 'closed_won', 'manual', 150000,
   '550e8400-e29b-41d4-a716-446655440001',
   'Contract signed! Onboarding starts next week',
   NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month');

-- ─────────────────────────────────────────────────────────────────────────────
--  SAMPLE MESSAGES (conversation threads)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO messages (id, lead_id, direction, channel, content, sent_at) VALUES
  -- Lead 1 (WhatsApp) - today
  ('660e8400-e29b-41d4-a716-446655550001',
   '550e8400-e29b-41d4-a716-446655550001', 'inbound', 'whatsapp',
   'Hi, I''m interested in learning more about your product',
   NOW() - INTERVAL '2 hours'),

  ('660e8400-e29b-41d4-a716-446655550002',
   '550e8400-e29b-41d4-a716-446655550001', 'outbound', 'whatsapp',
   'Thanks for reaching out! I''d love to help. Can you tell me more about your needs?',
   NOW() - INTERVAL '1 hour'),

  -- Lead 2 (Instagram) - 2 days ago
  ('660e8400-e29b-41d4-a716-446655550003',
   '550e8400-e29b-41d4-a716-446655550002', 'inbound', 'instagram',
   'Hi! I saw your post, sounds interesting',
   NOW() - INTERVAL '2 days 12 hours'),

  ('660e8400-e29b-41d4-a716-446655550004',
   '550e8400-e29b-41d4-a716-446655550002', 'inbound', 'instagram',
   'When can we schedule a demo?',
   NOW() - INTERVAL '2 days 6 hours'),

  ('660e8400-e29b-41d4-a716-446655550005',
   '550e8400-e29b-41d4-a716-446655550002', 'outbound', 'instagram',
   'Great question! How about Thursday at 2 PM?',
   NOW() - INTERVAL '2 days 1 hour'),

  -- Lead 3 (web form) - 1 week ago
  ('660e8400-e29b-41d4-a716-446655550006',
   '550e8400-e29b-41d4-a716-446655550003', 'inbound', 'email',
   'Submitted form: Enterprise plan inquiry',
   NOW() - INTERVAL '8 days'),

  ('660e8400-e29b-41d4-a716-446655550007',
   '550e8400-e29b-41d4-a716-446655550003', 'outbound', 'email',
   'Thank you for your interest! Our team will be in touch with our proposal.',
   NOW() - INTERVAL '7 days'),

  -- Lead 4 (email) - 2 weeks ago
  ('660e8400-e29b-41d4-a716-446655550008',
   '550e8400-e29b-41d4-a716-446655550004', 'outbound', 'email',
   'Please review the attached proposal and contract for your signature.',
   NOW() - INTERVAL '14 days'),

  -- Lead 5 (manual, closed) - 1 month ago
  ('660e8400-e29b-41d4-a716-446655550009',
   '550e8400-e29b-41d4-a716-446655550005', 'outbound', 'email',
   'Congratulations! Your contract has been processed. Welcome aboard!',
   NOW() - INTERVAL '1 month');

-- ─────────────────────────────────────────────────────────────────────────────
--  SAMPLE NOTES (agent annotations)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO notes (id, lead_id, author_id, body, created_at) VALUES
  -- Lead 1 notes
  ('770e8400-e29b-41d4-a716-446655550001',
   '550e8400-e29b-41d4-a716-446655550001',
   '550e8400-e29b-41d4-a716-446655440002',
   'Initial contact via WhatsApp. Customer seemed very interested in the feature set.',
   NOW() - INTERVAL '1 hour 30 minutes'),

  -- Lead 2 notes
  ('770e8400-e29b-41d4-a716-446655550002',
   '550e8400-e29b-41d4-a716-446655550002',
   '550e8400-e29b-41d4-a716-446655440002',
   'Follow up scheduling for Thursday demo. High interest - budget approved internally.',
   NOW() - INTERVAL '2 days'),

  -- Lead 3 notes
  ('770e8400-e29b-41d4-a716-446655550003',
   '550e8400-e29b-41d4-a716-446655550003',
   '550e8400-e29b-41d4-a716-446655440002',
   'Michael is a decision-maker. Needs Salesforce integration. Budget is $25k.',
   NOW() - INTERVAL '6 days'),

  ('770e8400-e29b-41d4-a716-446655550004',
   '550e8400-e29b-41d4-a716-446655550003',
   '550e8400-e29b-41d4-a716-446655440002',
   'Sent customized proposal with Salesforce integration plan.',
   NOW() - INTERVAL '2 days'),

  -- Lead 4 notes
  ('770e8400-e29b-41d4-a716-446655550005',
   '550e8400-e29b-41d4-a716-446655550004',
   '550e8400-e29b-41d4-a716-446655440002',
   'Enterprise contract ready for signature. $85k deal. Legal team approved.',
   NOW() - INTERVAL '14 days'),

  ('770e8400-e29b-41d4-a716-446655550006',
   '550e8400-e29b-41d4-a716-446655550004',
   '550e8400-e29b-41d4-a716-446655440002',
   'Awaiting signed contract. Initial implementation scheduled for next month.',
   NOW() - INTERVAL '7 days'),

  -- Lead 5 notes (closed)
  ('770e8400-e29b-41d4-a716-446655550007',
   '550e8400-e29b-41d4-a716-446655550005',
   '550e8400-e29b-41d4-a716-446655440001',
   'Deal closed! $150k annual contract. Incredible win. Onboarding team notified.',
   NOW() - INTERVAL '1 month');

-- ─────────────────────────────────────────────────────────────────────────────
--  SUMMARY STATISTICS
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify data loaded
SELECT 'USERS' as category, COUNT(*) as count FROM users
UNION ALL
SELECT 'LEADS', COUNT(*) FROM leads
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages
UNION ALL
SELECT 'NOTES', COUNT(*) FROM notes;

-- Show leads by stage
SELECT 'Leads by Stage' as metric, stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY stage;

-- Show leads by source
SELECT 'Leads by Source' as metric, source, COUNT(*) as count FROM leads WHERE source IS NOT NULL GROUP BY source;

-- Show total deal value
SELECT
  'Deal Value' as metric,
  COUNT(*) as total_leads,
  SUM(deal_value) as total_pipeline,
  SUM(deal_value) FILTER (WHERE stage = 'closed_won') as won_revenue;

COMMIT;
