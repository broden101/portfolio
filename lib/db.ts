import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

function parseDbUrl(url: string): DbConfig {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "5432", 10),
    database: u.pathname.replace(/^\//, ""),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}

function createPrisma() {
  const raw = process.env.DATABASE_URL || "";
  const cfg = parseDbUrl(raw);
  const pool = new pg.Pool({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
