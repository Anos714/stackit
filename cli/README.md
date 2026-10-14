# stackit ⚡

Opinionated full-stack project scaffolder. Like `create-next-app`, but you pick the
whole stack — **MERN, PERN, React + Hono + Postgres, Go + Fiber** — and get a
best-practice monorepo (Vite + React frontend, layered API backend, Docker for the DB).

```bash
bun run src/index.ts create my-app
# or non-interactive:
bun run src/index.ts create my-app --stack mern --language typescript --runtime bun --pm bun -y
```

## Requirements

- [Bun](https://bun.sh) >= 1.2 (to run the CLI itself)
- Per stack, the CLI checks your machine and fails fast with a helpful hint:
  - `mern` / `pern` / `hono-pg` → Node >= 20 and/or Bun >= 1.2
  - `go-fiber` → Go >= 1.24 (+ Node >= 20 for the Vite frontend)

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
| `--stack` | `mern` \| `pern` \| `hono-pg` \| `go-fiber` | prompt (`mern` with `-y`) |
| `--language` | `typescript` \| `javascript` (`go-fiber` → `go` auto) | prompt (`typescript` with `-y`) |
| `--runtime` | `node` \| `bun` (`go-fiber` → `go` auto) | prompt (stack default with `-y`) |
| `--pm` | `npm` \| `pnpm` \| `yarn` \| `bun` | prompt (`bun` if runtime is bun, else `npm`) |
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
| Frontend | http://localhost:5173 |
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

## Scripts (this repo)

```bash
bun install        # deps
bun run src/index.ts --help
bun test           # 13 tests: semver, registry, scaffold file-maps
bunx tsc --noEmit  # typecheck
bun run build      # bun build → dist/stackit
```

## Tech

commander (CLI) · @clack/prompts (interactive UI) · zod (validation) ·
fs-extra (file writes) · yocto-spinner + picocolors (output). Templates are
plain TypeScript functions — no template engine, no network at scaffold time.
