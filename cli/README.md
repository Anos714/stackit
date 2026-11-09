# stackit ⚡

[![npm version](https://img.shields.io/npm/v/create-stackit-app.svg)](https://www.npmjs.com/package/create-stackit-app)
[![license](https://img.shields.io/npm/l/create-stackit-app.svg)](https://www.npmjs.com/package/create-stackit-app)

Opinionated full-stack project scaffolder. Like `create-next-app`, but you pick the
whole stack — **MERN, PERN, React + Hono + Postgres, Go + Fiber, FastAPI + Next.js,
NestJS + Next.js** — and get a
best-practice monorepo (Vite + React or Next.js frontend, layered API backend, Docker for the DB).

## 🌐 Live demo & docs

**[stackitcli.vercel.app](https://stackitcli.vercel.app/)** — landing page, stack previews
and full documentation.

Published as [`create-stackit-app`](https://www.npmjs.com/package/create-stackit-app) —
no install needed:

```bash
bunx create-stackit-app@latest create my-app
# or non-interactive:
bunx create-stackit-app@latest create my-app --stack mern --language typescript --runtime bun --pm bun -y
```

Global install (`stackit` command everywhere):

```bash
npm install -g create-stackit-app
stackit create my-app
```

From source (this repo, run inside `cli/`):

```bash
bun install
bun run src/index.ts create my-app
```

## Requirements

- [Bun](https://bun.sh) >= 1.2 (to run the CLI itself)
- Per stack, the CLI checks your machine and fails fast with a helpful hint:
  - `mern` / `pern` / `hono-pg` → Node >= 20 and/or Bun >= 1.2
  - `go-fiber` → Go >= 1.24 (+ Node >= 20 for the Vite frontend)
  - `fastapi` → Python >= 3.11 (+ Node >= 20 for the Next.js frontend); deps install with `uv` when present, otherwise venv + pip
  - `nestjs` → Node >= 20 (+ npm/pnpm/yarn/bun); TypeScript only, Node runtime only

## Running the CLI (run / develop)

```bash
bun install                  # install CLI deps (first time only)
bun run src/index.ts --help  # CLI help

# interactive scaffold
bun run src/index.ts create my-app

# example: MERN + Bun + TypeScript, no prompts
bun run src/index.ts create my-app --stack mern --language typescript --runtime bun --pm bun -y

# example: PERN + Node + JavaScript, skip install + git
bun run src/index.ts create shop-api --stack pern --language javascript --runtime node --pm npm -y --no-install --no-git
```

### `create` options

| Flag | Values | Default |
| ---- | ------ | ------- |
| `[project-name]` | `my-app` (lowercase, `-_`) | prompt |
| `--stack` | `mern` \| `pern` \| `hono-pg` \| `go-fiber` \| `fastapi` \| `nestjs` | prompt (`mern` with `-y`) |
| `--language` | `typescript` \| `javascript` (`go-fiber` → `go`, `fastapi` → `python`, `nestjs` → `typescript` auto) | prompt (`typescript` with `-y`) |
| `--runtime` | `node` \| `bun` (`go-fiber` → `go`, `fastapi` → `python`, `nestjs` → `node` auto) | prompt (stack default with `-y`) |
| `--pm` | `npm` \| `pnpm` \| `yarn` \| `bun` (`fastapi`/`nestjs`: client pm) | prompt (`bun` if runtime is bun, else `npm`) |
| `-y, --yes` | skip all prompts | off |
| `--no-install` | skip dependency install | install |
| `--no-git` | skip `git init` | init |

## Generated project

```bash
cd my-app
cp .env.example server/.env   # fill in DB URL etc.
docker compose up -d          # starts MongoDB / PostgreSQL
bun run dev                   # runs client + server (or npm/pnpm/yarn run dev)
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 (FastAPI / NestJS → :3000) |
| API | http://localhost:5000 |
| Health | http://localhost:5000/api/health |

### Layout (JS stacks)

```
my-app/
├── client/              # Vite + React (proxies /api → :5000)
│   └── src/{App,main,lib/api}
├── server/              # Express / Hono API
│   └── src/
│       ├── index.*      # entrypoint (env → connect → listen)
│       ├── app.*        # app factory (middleware + routes)
│       ├── config/      # env, db connection
│       ├── routes/      # health, users
│       ├── controllers/ # handlers (express) / routes carry logic (hono)
│       ├── models/      # mongoose schema / SQL DDL
│       ├── middlewares/ # errorHandler, notFound, zod validation
│       └── utils/       # asyncHandler, ApiError
├── docker-compose.yml
└── .env.example
```

### Layout (go-fiber)

```
my-app/
├── client/              # same Vite + React frontend
└── server/              # Go + Fiber
    ├── cmd/api/main.go
    └── internal/{config,db,handlers,middleware,models,routes}
```

`DATABASE_URL` unset → API runs with an in-memory store (demo mode);
set it (docker compose gives you Postgres) → real persistence via `pgx`.

### Layout (fastapi)

```
my-app/
├── client/                    # Next.js App Router, auth UI (rewrites /api → :5000)
│   ├── app/{layout,page}.tsx
│   ├── app/globals.css
│   ├── lib/api.ts
│   └── next.config.ts
├── server/                    # FastAPI + SQLAlchemy 2 async + Alembic
│   ├── app/
│   │   ├── main.py            # app factory, CORS, error handlers
│   │   ├── core/              # settings, argon2 hashing, JWT
│   │   ├── db/                # async engine, get_db, Base
│   │   ├── models/            # User, RefreshToken
│   │   ├── schemas/           # pydantic v2 models
│   │   ├── services/          # auth logic (rotation + revocation)
│   │   └── api/               # deps + routes (auth, users, health)
│   ├── alembic/versions/      # 0001_initial migration
│   ├── tests/                 # pytest: full auth flow on in-memory SQLite
│   └── requirements*.txt
├── scripts/py.mjs             # cross-platform venv launcher for npm scripts
├── docker-compose.yml
└── .env.example
```

Ships **real auth**: signup, login, refresh (rotated + revoked), logout and a
protected `/api/auth/me`. The Next.js client signs up, signs in and renders
`/me` — no TODO screens. `npm run test` and `npm run lint` (ruff + mypy strict)
work out of the box. Python deps use `uv` when installed (fast), with a plain
`venv` + `pip` fallback.

```bash
bunx create-stackit-app@latest create my-api --stack fastapi -y
cd my-api && docker compose up -d && npm run dev
```

### Layout (nestjs)

```
nest-api/
├── client/                    # Next.js App Router, auth UI (rewrites /api → :5000)
│   ├── app/{layout,page}.tsx
│   ├── app/globals.css
│   ├── lib/api.ts
│   └── next.config.ts
├── server/                    # NestJS + TypeORM + Postgres
│   ├── src/
│   │   ├── main.ts            # bootstrap, CORS, validation, { detail } errors
│   │   ├── app.module.ts      # ConfigModule + TypeOrmModule
│   │   ├── config/env.ts      # zod-validated environment
│   │   ├── auth/              # controller, service, JWT guard, DTOs
│   │   ├── users/             # entity, response mapper, protected controller
│   │   ├── health/            # /api/health + /api/health/ready
│   │   ├── common/            # exception filter + CurrentUser decorator
│   │   └── database/          # data source + 1730000000000-InitialSchema
│   ├── test/app.e2e-spec.ts   # Jest e2e on in-memory SQLite
│   └── nest-cli.json
├── docker-compose.yml
└── .env.example
```

Ships **real auth**: signup, login, refresh (rotated + revoked), logout and a
protected `/api/auth/me` using the same Next.js client as the FastAPI stack.
`npm run test` (Jest e2e) and `npm run lint` (ESLint + strict `tsc`) work out of
the box; `npm run db:migrate` runs the TypeORM migration.

```bash
bunx create-stackit-app@latest create nest-api --stack nestjs -y
cd nest-api && cp .env.example server/.env && docker compose up -d && npm run dev
```

## Scripts (this repo)

```bash
bun install        # deps
bun run src/index.ts --help
bun test           # 21 tests: semver, registry, scaffold file-maps (incl. fastapi, nestjs)
bunx tsc --noEmit  # typecheck
bun run build      # bun build → dist/stackit
```

## Tech

commander (CLI) · @clack/prompts (interactive UI) · zod (validation) ·
fs-extra (file writes) · yocto-spinner + picocolors (output). Templates are
plain TypeScript functions — no template engine, no network at scaffold time.

## License

MIT © 2026 Rahul Sain. See [LICENSE](LICENSE).
