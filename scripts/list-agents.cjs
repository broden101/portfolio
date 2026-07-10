const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const raw = process.env.DATABASE_URL || "";
const u = new URL(raw);
const pool = new pg.Pool({
  host: u.hostname,
  port: parseInt(u.port || "5432", 10),
  database: u.pathname.replace(/^\//, ""),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const agents = await p.agent.findMany();
  for (const a of agents) {
    console.log(`${a.id}|${a.name}|${a.strategy}|${a.cash}`);
  }
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
