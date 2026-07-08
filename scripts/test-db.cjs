const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const p = new PrismaClient({ adapter });
  await p.$connect();
  console.log("CONNECTED");
  const agents = await p.agent.findMany();
  console.log("AGENTS:", JSON.stringify(agents, null, 2));
  const positions = await p.position.findMany();
  console.log("POSITIONS:", JSON.stringify(positions, null, 2));
  const txs = await p.transaction.findMany();
  console.log("TXS:", JSON.stringify(txs, null, 2));
  await p.$disconnect();
  await pool.end();
  console.log("DONE");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
