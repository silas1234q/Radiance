import 'dotenv/config'
import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

// Discard broken connections instead of crashing
pool.on('error', (err) => {
  console.warn('[DB] Pool connection error (will reconnect):', err.message);
});

const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

const TRANSIENT_ERRORS = [
  'Connection terminated unexpectedly',
  'Connection terminated',
  'connection is insecure',
  'Client has encountered a connection error',
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
];

function isTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return TRANSIENT_ERRORS.some((t) => message.includes(t));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < retries && isTransientError(err)) {
        console.warn(`[DB] Transient error, retrying (${attempt + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        return withRetry(() => query(args));
      },
    },
  },
});

export default prisma;
