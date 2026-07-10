const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const u = new URL(process.env.DATABASE_URL);
const pool = new pg.Pool({ host: u.hostname, port: parseInt(u.port || '5432', 10), database: u.pathname.replace(/^\//, ''), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });
async function main() {
  const id = 'bertot';
  const agent = await p.agent.findUnique({ where: { id } });
  console.log('Current cash:', agent?.cash);
  const pos = await p.position.findMany({ where: { agentId: id } });
  console.log('Positions to delete:', pos.length);
  for (const x of pos) console.log(`  ${x.ticker} ${x.qty} lot @ ${x.avgPrice}`);
  await p.position.deleteMany({ where: { agentId: id } });
  const txCount = await p.transaction.count({ where: { agentId: id } });
  await p.transaction.deleteMany({ where: { agentId: id } });
  console.log('Deleted', txCount, 'transactions');
  await p.agent.update({ where: { id }, data: { cash: 100_000_000, evolutionGen: 0, sellTrigger: 'vwap', minProfitToSell: 0, learningLog: [] } });
  console.log('Bertot fully reset: cash=Rp100jt, no positions, no transactions, learning reset');
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
