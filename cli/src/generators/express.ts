import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";
import { cext, ext, isTS, tsconfig } from "./common.ts";

export type DbKind = "mongodb" | "postgres";

function serverPackageJson(o: ProjectOptions, db: DbKind): string {
  const t = isTS(o);
  const bun = o.runtime === "bun";
  const deps: Record<string, string> = {
    express: "^4.21.2",
    cors: "^2.8.5",
    dotenv: "^16.4.7",
    zod: "^3.24.2",
    ...(db === "mongodb" ? { mongoose: "^8.9.5" } : { pg: "^8.13.1" }),
  };
  const devDeps: Record<string, string> = {
    ...(t ? { typescript: "^5.8.3" } : {}),
    ...(bun ? {} : t ? { tsx: "^4.19.2" } : {}),
    ...(db === "postgres" && t ? { "@types/pg": "^8.11.0" } : {}),
    ...(t ? { "@types/express": "^5.0.0", "@types/cors": "^2.8.17", "@types/node": "^22.10.0" } : {}),
  };
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
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  ) + "\n";
}

function envExample(db: DbKind): string {
  return `# copy to server/.env (root .env.example mirrors this)
PORT=5000
CLIENT_URL=http://localhost:5173
${db === "mongodb" ? "MONGO_URI=mongodb://localhost:27017/stackit" : "DATABASE_URL=postgres://postgres:postgres@localhost:5432/stackit"}
`;
}

function dbFile(o: ProjectOptions, db: DbKind): string {
  const t = isTS(o);
  if (db === "mongodb") {
    return t
      ? `import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
}
`
      : `import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
}
`;
  }
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

function envFile(o: ProjectOptions, db: DbKind): string {
  const t = isTS(o);
  const varName = db === "mongodb" ? "MONGO_URI" : "DATABASE_URL";
  return t
    ? `import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(\`Missing env var \${name} (see .env.example)\`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  ${varName}: process.env.${varName} ?? "",
};

export function assertDbEnv(): void {
  required("${varName}");
}
`
    : `import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  ${varName}: process.env.${varName} ?? "",
};

export function assertDbEnv() {
  if (!env.${varName}) throw new Error("Missing env var ${varName} (see .env.example)");
}
`;
}

function userModel(o: ProjectOptions, db: DbKind): string {
  const t = isTS(o);
  if (db === "mongodb") {
    return t
      ? `import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
`
      : `import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true },
);

export const UserModel = model("User", userSchema);
`;
  }
  return t
    ? `export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Keep schema in code until you adopt a migration tool (node-pg-migrate, drizzle…).
export const CREATE_USERS_TABLE = \`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);\`;
`
    : `// Keep schema in code until you adopt a migration tool (node-pg-migrate, drizzle…).
export const CREATE_USERS_TABLE = \`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);\`;
`;
}

function usersController(o: ProjectOptions, db: DbKind): string {
  const t = isTS(o);
  const imp = (s: string) => `import { ${s} } from "../utils/asyncHandler.${ext(o)}";`;
  if (db === "mongodb") {
    return `${t ? 'import type { Request, Response } from "express";\n' : ""}${imp("asyncHandler")}
import { UserModel } from "../models/user.${ext(o)}";

export const listUsers = asyncHandler(async (_req${t ? ": Request" : ""}, res${t ? ": Response" : ""}) => {
  const users = await UserModel.find().sort({ createdAt: -1 }).lean();
  res.json({ data: users });
});

export const createUser = asyncHandler(async (req${t ? ": Request" : ""}, res${t ? ": Response" : ""}) => {
  const user = await UserModel.create(req.body);
  res.status(201).json({ data: user });
});
`;
  }
  return `${t ? 'import type { Request, Response } from "express";\n' : ""}${imp("asyncHandler")}
import { pool } from "../config/db.${ext(o)}";
import { CREATE_USERS_TABLE${t ? ", type User" : ""} } from "../models/user.${ext(o)}";

let ready: Promise<unknown> | null = null;
function ensureSchema() {
  return (ready ??= pool.query(CREATE_USERS_TABLE));
}

export const listUsers = asyncHandler(async (_req${t ? ": Request" : ""}, res${t ? ": Response" : ""}) => {
  await ensureSchema();
  const { rows } = await pool.query(${t ? "<User>" : ""}"SELECT id, name, email, created_at AS \\"createdAt\\" FROM users ORDER BY id DESC");
  res.json({ data: rows });
});

export const createUser = asyncHandler(async (req${t ? ": Request" : ""}, res${t ? ": Response" : ""}) => {
  await ensureSchema();
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at AS "createdAt"',
    [req.body.name, req.body.email],
  );
  res.status(201).json({ data: rows[0] });
});
`;
}

function shared(o: ProjectOptions): FileMap {
  const e = ext(o);
  const t = isTS(o);
  return {
    [`server/src/utils/asyncHandler.${e}`]: t
      ? `import type { NextFunction, Request, RequestHandler, Response } from "express";

type Fn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap async handlers so rejections reach the error middleware. */
export function asyncHandler(fn: Fn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
`
      : `/** Wrap async handlers so rejections reach the error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
`,
    [`server/src/utils/ApiError.${e}`]: t
      ? `export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
`
      : `export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
`,
    [`server/src/middlewares/notFound.${e}`]: t
      ? `import type { Request, Response } from "express";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
`
      : `export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}
`,
    [`server/src/middlewares/errorHandler.${e}`]: t
      ? `import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  if (err instanceof Error && err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
    return;
  }
  const status = typeof (err as { status?: unknown }).status === "number" ? (err as { status: number }).status : 500;
  res.status(status).json({ error: err instanceof Error ? err.message : "Internal server error" });
}
`
      : `export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err instanceof Error && err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
    return;
  }
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ error: err instanceof Error ? err.message : "Internal server error" });
}
`,
    [`server/src/middlewares/validate.${e}`]: t
      ? `import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!parsed.success) {
      next(Object.assign(new Error("Invalid request"), { status: 400, cause: parsed.error.flatten() }));
      return;
    }
    req.body = (parsed.data as { body: unknown }).body;
    next();
  };
}

export const userSchema = z.object({ body: z.object({ name: z.string().min(1).max(80), email: z.string().email() }) });
`
      : `import { z } from "zod";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!parsed.success) {
      next(Object.assign(new Error("Invalid request"), { status: 400 }));
      return;
    }
    req.body = parsed.data.body;
    next();
  };
}

export const userSchema = z.object({ body: z.object({ name: z.string().min(1).max(80), email: z.string().email() }) });
`,
    [`server/src/routes/health.${e}`]: t
      ? `import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
`
      : `import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
`,
    [`server/src/routes/users.${e}`]: `import { Router } from "express";
import { createUser, listUsers } from "../controllers/users.${e}";
import { userSchema, validate } from "../middlewares/validate.${e}";

export const usersRouter = Router();

usersRouter.get("/", listUsers);
usersRouter.post("/", validate(userSchema), createUser);
`,
  };
}

function appFile(o: ProjectOptions): string {
  const e = ext(o);
  const t = isTS(o);
  return `import express from "express";
import cors from "cors";
import { env } from "./config/env.${e}";
import { healthRouter } from "./routes/health.${e}";
import { usersRouter } from "./routes/users.${e}";
import { notFound } from "./middlewares/notFound.${e}";
import { errorHandler } from "./middlewares/errorHandler.${e}";

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.CLIENT_URL }));
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/users", usersRouter);

  app.use(notFound);
  app.use(errorHandler${t ? " as express.ErrorRequestHandler" : ""});
  return app;
}
`;
}

function indexFile(o: ProjectOptions): string {
  const e = ext(o);
  const t = isTS(o);
  return `import { createApp } from "./app.${e}";
import { assertDbEnv, env } from "./config/env.${e}";
import { connectDb } from "./config/db.${e}";

async function main(): Promise<void> {
  assertDbEnv();
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(\`API listening on http://localhost:\${env.PORT}\`);
  });
}

main().catch((err${t ? ": unknown" : ""}) => {
  console.error(err);
  process.exit(1);
});
`;
}

/** Express + Mongo/Postgres backend file map (server/ + root .env + compose). */
export function expressFiles(o: ProjectOptions, db: DbKind): FileMap {
  const e = ext(o);
  const compose =
    db === "mongodb"
      ? `services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]
volumes:
  mongo-data:
`
      : `services:
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
    [`server/package.json`]: serverPackageJson(o, db),
    [`server/src/index.${e}`]: indexFile(o),
    [`server/src/app.${e}`]: appFile(o),
    [`server/src/config/env.${e}`]: envFile(o, db),
    [`server/src/config/db.${e}`]: dbFile(o, db),
    [`server/src/models/user.${e}`]: userModel(o, db),
    [`server/src/controllers/users.${e}`]: usersController(o, db),
    [`server/.env.example`]: envExample(db),
    [`docker-compose.yml`]: compose,
    ...shared(o),
    ...(isTS(o) ? { [`server/tsconfig.json`]: tsconfig("server", o) } : {}),
  };
}

export { cext };
