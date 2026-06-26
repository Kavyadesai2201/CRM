// /server/db/pool.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // Supabase requires SSL in all environments
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,       // 10s — Supabase pooler can be slow on cold start
});

pool.on('connect', () => {
  console.log('🐘 PostgreSQL connected');
});

pool.on('error', (err) => {
  // Log but don't exit — transient network errors shouldn't kill the server
  console.error('PostgreSQL pool error:', err.message);
});

export default pool;
