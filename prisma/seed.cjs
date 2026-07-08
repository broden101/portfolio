const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const agents = [
    { id: "bertot", name: "Bertot", strategy: "bsjp", avatar: "🤖" },
    { id: "dondon", name: "Dondon", strategy: "reversal", avatar: "🔄" },
    { id: "ragacc", name: "ragaCC", strategy: "uptrend_vwap", avatar: "📈" },
  ];

  for (const a of agents) {
    const exists = await prisma.agent.findUnique({ where: { id: a.id } });
    if (!exists) {
      await prisma.agent.create({ data: a });
      console.log(`✓ Created agent: ${a.name}`);
    } else {
      console.log(`- Agent exists: ${a.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
