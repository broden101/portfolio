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
  const id = "konglomerasi";
  const existing = await p.agent.findUnique({ where: { id } });
  if (existing) {
    console.log("Agent konglomerasi already exists:", existing.id);
    await p.$disconnect();
    return;
  }
  await p.agent.create({
    data: {
      id: "konglomerasi",
      name: "Konglomerasi",
      strategy: "konglo",
      avatar: "💼",
      initialCapital: 100_000_000,
      cash: 100_000_000,
    },
  });
  console.log("Created agent konglomerasi with Rp100jt cash");
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
