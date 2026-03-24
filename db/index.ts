import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let dbInstance: any = null;

function getDB() {
  if (!dbInstance) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://localhost/meta_ads",
    });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export const db = new Proxy({}, {
  get: (target, prop) => {
    return getDB()[prop];
  }
});
export * from "./schema";
