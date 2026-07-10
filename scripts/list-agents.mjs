import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const agents = await p.agent.findMany();
for (const a of agents) {
  console.log(`${a.id}|${a.name}|${a.strategy}|${a.cash}`);
}
await p.$disconnect();
