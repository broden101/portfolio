const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.hixxnjrkbokibaeimymj',
  password: 'Turisari332*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS "Agent" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        strategy TEXT NOT NULL,
        avatar TEXT NOT NULL,
        "initialCapital" DOUBLE PRECISION NOT NULL DEFAULT 100000000,
        cash DOUBLE PRECISION NOT NULL DEFAULT 100000000,
        "evolutionGen" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "Position" (
        id SERIAL PRIMARY KEY,
        "agentId" TEXT NOT NULL REFERENCES "Agent"(id) ON DELETE CASCADE,
        ticker TEXT NOT NULL,
        qty INTEGER NOT NULL,
        "avgPrice" DOUBLE PRECISION NOT NULL,
        "openedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE("agentId", ticker)
      );

      CREATE TABLE IF NOT EXISTS "Transaction" (
        id SERIAL PRIMARY KEY,
        "agentId" TEXT NOT NULL REFERENCES "Agent"(id) ON DELETE CASCADE,
        ticker TEXT NOT NULL,
        side TEXT NOT NULL,
        qty INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        reason TEXT NOT NULL,
        pnl DOUBLE PRECISION,
        "executedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await pool.query(sql);
    console.log('Tables created OK');

    // Seed agents
    const agents = [
      { id: 'bertot', name: 'Bertot', strategy: 'bsjp', avatar: '🤖' },
      { id: 'dondon', name: 'Dondon', strategy: 'reversal', avatar: '🔄' },
      { id: 'ragacc', name: 'ragaCC', strategy: 'uptrend_vwap', avatar: '📈' },
    ];
    for (const a of agents) {
      const exists = await pool.query('SELECT id FROM "Agent" WHERE id = $1', [a.id]);
      if (exists.rows.length === 0) {
        await pool.query('INSERT INTO "Agent" (id, name, strategy, avatar) VALUES ($1,$2,$3,$4)', [a.id, a.name, a.strategy, a.avatar]);
        console.log(`✓ Created ${a.name}`);
      } else {
        console.log(`- ${a.name} exists`);
      }
    }
    console.log('Done!');
  } catch (e) {
    console.error('FAIL', e.message);
  } finally {
    pool.end();
  }
}
run();
