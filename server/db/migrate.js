// /server/db/migrate.js
import pool from "./pool.js";

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── users ─────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          VARCHAR(30)  DEFAULT 'agent',
        created_at    TIMESTAMPTZ  DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ── leads ─────────────────────────────────────────────────────────────────
    // instagram_id     — Instagram sender PSID
    // last_message     — Most recent inbound message text
    // last_activity_at — Timestamp of last webhook event
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name             VARCHAR(150),
        email            VARCHAR(150),
        phone            VARCHAR(30),
        instagram_id     VARCHAR(80),
        company          VARCHAR(150),
        stage            VARCHAR(50)   DEFAULT 'new',
        source           VARCHAR(80),
        deal_value       NUMERIC(12,2) DEFAULT 0,
        notes            TEXT,
        last_message     TEXT,
        last_activity_at TIMESTAMPTZ,
        assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at       TIMESTAMPTZ   DEFAULT NOW(),
        updated_at       TIMESTAMPTZ   DEFAULT NOW()
      );
    `);

    // Idempotent: add new columns if table was already created without them
    await client.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS instagram_id     VARCHAR(80),
        ADD COLUMN IF NOT EXISTS last_message     TEXT,
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
    `);

    // Unique indexes — prevent duplicate leads per channel
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone
        ON leads (phone) WHERE phone IS NOT NULL;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_instagram_id
        ON leads (instagram_id) WHERE instagram_id IS NOT NULL;
    `);

    // ── activities ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
        user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        type       VARCHAR(50),
        note       TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── messages ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        direction  VARCHAR(20) NOT NULL,
        channel    VARCHAR(20) NOT NULL,
        content    TEXT NOT NULL,
        sent_at    TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_lead_id
        ON messages (lead_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sent_at
        ON messages (sent_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_channel
        ON messages (channel);
    `);

    // ── notes ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id   UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        body      TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_lead_id
        ON notes (lead_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_author_id
        ON notes (author_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_created_at
        ON notes (created_at DESC);
    `);

    await client.query("COMMIT");
    console.log("✅ Migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
