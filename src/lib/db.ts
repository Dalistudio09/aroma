import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

function env(name: string): string | undefined {
  const value = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readDatabaseUrl(): string | undefined {
  return env("DATABASE_URL") || env("POSTGRES_URL") || env("POSTGRES_PRISMA_URL");
}

function isDeployedRuntime(): boolean {
  return Boolean(env("VERCEL") || env("AWS_LAMBDA_FUNCTION_NAME") || env("NETLIFY"));
}

/**
 * Neon / Postgres when DATABASE_URL is set. PGLite only for the local preview.
 * On Vercel PGlite is never used — missing DATABASE_URL is an error.
 */
export const dbSource: DbSource = readDatabaseUrl()
  ? "neon"
  : isDeployedRuntime()
    ? "neon"
    : "pglite";

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<T[]>;
}

const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __pgMigrateChain__?: Promise<void>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function loadMigrationFiles(): Record<string, string> {
  return import.meta.glob("/migrations/*.sql", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
}

function postgresPoolConfig(connectionString: string) {
  const needsSsl =
    isDeployedRuntime() ||
    /sslmode=require|neon\.tech|amazonaws\.com|supabase\.co/i.test(connectionString);
  return {
    connectionString,
    max: 1,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}

async function applyPostgresMigrations(pool: import("pg").Pool) {
  const pass = (globalRef.__pgMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const client = await pool.connect();
      try {
        await client.query(
          "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
        );
        const applied = (await client.query<{ name: string }>("select name from _migrations")).rows
          .map((row) => row.name);
        const migrations = loadMigrationFiles();
        for (const { name, path } of pendingMigrations(Object.keys(migrations), applied)) {
          try {
            await client.query("BEGIN");
            await client.query(migrations[path]);
            await client.query("insert into _migrations (name) values ($1)", [name]);
            await client.query("COMMIT");
          } catch (error) {
            try {
              await client.query("ROLLBACK");
            } catch {
              // keep original error
            }
            throw error;
          }
        }
      } finally {
        client.release();
      }
    });
  globalRef.__pgMigrateChain__ = pass;
  await pass;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const databaseUrl = readDatabaseUrl();
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is required on Vercel. Add a Postgres URL and redeploy. PGlite is disabled in production.",
      );
    }
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool(postgresPoolConfig(databaseUrl));
    await applyPostgresMigrations(pool);
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  if (isDeployedRuntime()) {
    throw new Error(
      "PGlite is disabled on Vercel. Set DATABASE_URL to a Postgres connection string.",
    );
  }
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  const migrate = async (): Promise<void> => {
    const migrations = loadMigrationFiles();
    const doneRows = await pg.query<{ name: string }>("select name from _migrations");
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

function usePostgres(): boolean {
  return Boolean(readDatabaseUrl()) || isDeployedRuntime();
}

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return usePostgres() ? createNeonSql() : createPgliteSql();
}

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}

export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (usePostgres()) {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

export function ensureDbReady(): Promise<void> {
  return getSql().then(() => undefined);
}

const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && !isDeployedRuntime() && !readDatabaseUrl()) {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
