import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";
import { ext, isTS, tsconfig } from "./common.ts";

function serverPackageJson(o: ProjectOptions): string {
  const t = isTS(o);
  const bun = o.runtime === "bun";
  const e = ext(o);
  return JSON.stringify(
    {
      name: "server",
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: bun ? `bun --hot src/index.${e}` : t ? `tsx watch src/index.${e}` : `node --watch src/index.${e}`,
        build: t ? "tsc -p tsconfig.json" : "echo 'no build step (plain JS)'",
        start: bun ? `bun src/index.${e}` : t ? "node dist/index.js" : `node src/index.${e}`,
      },
      dependencies: {
        hono: "^4.7.4",
        "@hono/zod-validator": "^0.4.3",
        ...(bun ? {} : { "@hono/node-server": "^1.13.8" }),
        pg: "^8.13.1",
        dotenv: "^16.4.7",
        zod: "^3.24.2",
      },
      devDependencies: {
        ...(t ? { typescript: "^5.8.3", "@types/node": "^22.10.0" } : {}),
        ...(bun ? {} : t ? { tsx: "^4.19.2" } : {}),
        ...(t ? { "@types/pg": "^8.11.0" } : {}),
      },
    },
    null,
    2,
  ) + "\n";
}

function appFile(o: ProjectOptions): string {
  const e = ext(o);
  const t = isTS(o);
  return `import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env.${e}";
import { health } from "./routes/health.${e}";
import { users } from "./routes/users.${e}";

export function createApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", cors({ origin: env.CLIENT_URL }));

  app.onError((err${t ? ": Error" : ""}, c) => {
    console.error(err);
    const status = (err ${t ? "as { status?: unknown }" : ""})?.status === 400 ? 400 : 500;
    return c.json({ error: err.message || "Internal server error" }, status${t ? " as 400 | 500" : ""});
  });

  app.route("/api/health", health);
  app.route("/api/users", users);
  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
`;
}

function indexFile(o: ProjectOptions): string {
  const e = ext(o);
  const bun = o.runtime === "bun";
  const t = isTS(o);
  if (bun) {
    return `import { env, assertDbEnv } from "./config/env.${e}";
import { connectDb } from "./config/db.${e}";
import { createApp } from "./app.${e}";

assertDbEnv();
await connectDb();

const app = createApp();
console.log(\`API listening on http://localhost:\${env.PORT}\`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
`;
  }
  return `import { serve } from "@hono/node-server";
import { env, assertDbEnv } from "./config/env.${e}";
import { connectDb } from "./config/db.${e}";
import { createApp } from "./app.${e}";

async function main(): Promise<void> {
  assertDbEnv();
  await connectDb();
  const app = createApp();
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(\`API listening on http://localhost:\${info.port}\`);
  });
}

main().catch((err${t ? ": unknown" : ""}) => {
  console.error(err);
  process.exit(1);
});
`;
}

function dbFile(o: ProjectOptions): string {
  const t = isTS(o);
  return t
    ? `import { Pool } from "pg";
import { env } from "./env.js";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function connectDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connected");
  } finally {
    client.release();
  }
}
`
    : `import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function connectDb() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connected");
  } finally {
    client.release();
  }
}
`;
}

/** Hono + Postgres backend file map. */
export function honoFiles(o: ProjectOptions): FileMap {
  const e = ext(o);
  const t = isTS(o);
  const compose = `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stackit
    volumes: ["pg-data:/var/lib/postgresql/data"]
volumes:
  pg-data:
`;
  return {
    [`server/package.json`]: serverPackageJson(o),
    [`server/src/index.${e}`]: indexFile(o),
    [`server/src/app.${e}`]: appFile(o),
    [`server/src/config/env.${e}`]: t
      ? `import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
};

export function assertDbEnv(): void {
  if (!env.DATABASE_URL) throw new Error("Missing env var DATABASE_URL (see .env.example)");
}
`
      : `import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
};

export function assertDbEnv() {
  if (!env.DATABASE_URL) throw new Error("Missing env var DATABASE_URL (see .env.example)");
}
`,
    [`server/src/config/db.${e}`]: dbFile(o),
    [`server/src/routes/health.${e}`]: `import { Hono } from "hono";

export const health = new Hono();

health.get("/", (c) => c.json({ status: "ok", uptime: process.uptime() }));
`,
    [`server/src/routes/users.${e}`]: t
      ? `import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { pool } from "../config/db.${e}";

export const users = new Hono();

const userBody = z.object({ name: z.string().min(1).max(80), email: z.string().email() });

// Ensure table exists on first request (adopt a migration tool as you grow).
let ready: Promise<unknown> | null = null;
function ensureSchema(): Promise<unknown> {
  return (ready ??= pool.query(
    \`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())\`,
  ));
}

users.get("/", async (c) => {
  await ensureSchema();
  const { rows } = await pool.query('SELECT id, name, email, created_at AS "createdAt" FROM users ORDER BY id DESC');
  return c.json({ data: rows });
});

users.post("/", zValidator("json", userBody), async (c) => {
  await ensureSchema();
  const body = c.req.valid("json");
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at AS "createdAt"',
    [body.name, body.email],
  );
  return c.json({ data: rows[0] }, 201);
});
`
      : `import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { pool } from "../config/db.${e}";

export const users = new Hono();

const userBody = z.object({ name: z.string().min(1).max(80), email: z.string().email() });

// Ensure table exists on first request (adopt a migration tool as you grow).
let ready = null;
function ensureSchema() {
  return (ready ??= pool.query(
    \`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())\`,
  ));
}

users.get("/", async (c) => {
  await ensureSchema();
  const { rows } = await pool.query('SELECT id, name, email, created_at AS "createdAt" FROM users ORDER BY id DESC');
  return c.json({ data: rows });
});

users.post("/", zValidator("json", userBody), async (c) => {
  await ensureSchema();
  const body = c.req.valid("json");
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at AS "createdAt"',
    [body.name, body.email],
  );
  return c.json({ data: rows[0] }, 201);
});
`,
    [`server/.env.example`]: `# copy to server/.env (root .env.example mirrors this)
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stackit
`,
    [`docker-compose.yml`]: compose,
    ...(isTS(o) ? { [`server/tsconfig.json`]: tsconfig("server", o) } : {}),
  };
}
