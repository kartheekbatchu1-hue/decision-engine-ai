import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Build connection string from Supabase env vars if DATABASE_URL not set
const connectionString = process.env.DATABASE_URL ||
  (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? (() => {
        const url = new URL(process.env.SUPABASE_URL);
        const host = `aws-0-us-east-1.pooler.supabase.com`;
        const projectRef = url.hostname.split('.')[0];
        return `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_KEY}@${host}:6543/postgres`;
      })()
    : null);

if (!connectionString) {
  throw new Error('Missing database config. Set SUPABASE_URL + SUPABASE_SERVICE_KEY (or DATABASE_URL) in backend/.env');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('query', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };
  client.release = () => {
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };
  return client;
}

export async function initializeDatabase() {
  const client = await getClient();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS decision_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        urgency VARCHAR(50) NOT NULL DEFAULT 'Medium',
        problem_statement TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS decision_alternatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        estimated_cost NUMERIC(12, 2),
        time_to_implement_weeks INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS decision_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        weight INT CHECK (weight BETWEEN 1 AND 10),
        is_maximize BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS decision_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        decision_id UUID REFERENCES decision_models(id) ON DELETE CASCADE,
        recommended_option_id UUID REFERENCES decision_alternatives(id),
        overall_confidence_score NUMERIC(5, 2),
        mcda_scores JSONB NOT NULL DEFAULT '{}',
        risk_assessment JSONB NOT NULL DEFAULT '[]',
        explainable_recommendation JSONB NOT NULL DEFAULT '{}',
        raw_ai_response JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Default demo user
    await client.query(`
      INSERT INTO users (id, email, name)
      VALUES ('00000000-0000-0000-0000-000000000001', 'demo@decisionengine.ai', 'Demo User')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

