import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let db: any = null;

function getDB() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://localhost/meta_ads",
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export { getDB };
export const db = new Proxy({}, {
  get: (target, prop) => {
    return getDB()[prop];
  }
});
export * from "./schema";
